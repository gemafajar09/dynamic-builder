<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

// uppy
import Uppy from "@uppy/core"
import Dashboard from "@uppy/dashboard"
import ImageEditor from "@uppy/image-editor"

import "@uppy/core/css/style.min.css"
import "@uppy/dashboard/css/style.min.css"
import "@uppy/image-editor/css/style.min.css"

// shadcn-vue
import {
    Dialog,
    DialogContent,
    DialogHeader
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

type Nullable<T> = T | null

const props = withDefaults(
    defineProps<{
        modelValue: boolean
        file: Nullable<File>

        title?: string
        description?: string

        /**
         * null => free crop, number => fixed ratio (misal 320/200)
         */
        aspectRatio?: number | null

        /**
         * Jika diisi, hasil final akan di-resize ke ukuran ini.
         * NOTE: untuk "Save tanpa crop", emit file apa adanya (tanpa resize).
         */
        outputWidth?: number | null
        outputHeight?: number | null

        quality?: number

        /**
         * optional: auto open editor saat modal open
         */
        autoOpenEditor?: boolean
    }>(),
    {
        title: "Resize & Crop Gambar",
        description: "",
        aspectRatio: null,
        outputWidth: null,
        outputHeight: null,
        quality: 0.92,
        autoOpenEditor: false,
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void
    (e: "done", file: File): void
    (e: "cancel"): void
}>()

const open = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit("update:modelValue", v),
})

const dashboardEl = ref<HTMLElement | null>(null)
const currentFileId = ref<string | null>(null)

let uppy: any = null
let disposed = false
let jobToken = 0

function cancelDialog() {
    open.value = false
    emit("cancel")
}

function destroyUppy() {
    if (!uppy) return
    try {
        uppy.close()
    } catch { }
    uppy = null

    if (dashboardEl.value) dashboardEl.value.innerHTML = ""
    currentFileId.value = null
}

async function resizeToTarget(
    blob: Blob,
    w: number,
    h: number,
    type: string,
    quality: number
): Promise<Blob> {
    const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = (err) => {
            URL.revokeObjectURL(url)
            reject(err)
        }
        img.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")
    if (!ctx) return blob

    ctx.drawImage(imgEl, 0, 0, w, h)

    return await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || blob), type, quality)
    })
}

function openEditorNow() {
    if (!uppy || !currentFileId.value) return

    const dashboard: any = uppy.getPlugin("Dashboard")
    const file = uppy.getFile(currentFileId.value)
    if (!dashboard || !file) return

    requestAnimationFrame(() => {
        try {
            dashboard.openFileEditor(file)
        } catch {
            try {
                dashboard.openFileEditor(currentFileId.value)
            } catch { }
        }
    })
}

/**
 * ✅ SAVE TANPA CROP
 * Emit file apa adanya (original / current state file di uppy) tanpa resize.
 */
function quickSaveAsIs() {
    if (!uppy || !currentFileId.value) return

    const f = uppy.getFile(currentFileId.value)
    if (!f?.data) return

    const data = f.data as Blob | File
    const type = (data as any).type || f.type || "application/octet-stream"
    const name = f.name || "image"

    const outFile = data instanceof File ? data : new File([data], name, { type })

    emit("done", outFile)
    open.value = false
}

async function loadFileToUppy(file: File) {
    if (!uppy) return

    uppy.cancelAll()
    currentFileId.value = null

    try {
        const id = uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            source: "Local",
            isRemote: false,
        })
        currentFileId.value = String(id)
    } catch { }
}

function initUppy() {
    if (!dashboardEl.value) return

    // safety: kalau kebuka dua kali, bersihkan dulu
    if (uppy) destroyUppy()

    uppy = new Uppy({
        autoProceed: false,
        restrictions: {
            maxNumberOfFiles: 1,
            allowedFileTypes: ["image/*"],
        },
    })

    uppy.use(Dashboard, {
        target: dashboardEl.value,
        inline: true,
        height: 480,
        proudlyDisplayPoweredByUppy: false,
        hideUploadButton: true,
        hideRetryButton: true,
        hidePauseResumeButton: true,
        hideCancelButton: true,
        showProgressDetails: false,
    })

    uppy.use(ImageEditor, {
        target: Dashboard,
        quality: props.quality,
        cropperOptions: {
            viewMode: 1,
            dragMode: "move",
            autoCropArea: 1,
            aspectRatio: props.aspectRatio == null ? NaN : props.aspectRatio,
        },
    })

    uppy.on("file-editor:cancel", () => {
        open.value = false
    })

    uppy.on("file-added", (file: any) => {
        currentFileId.value = file?.id ?? null

        if (props.autoOpenEditor) {
            setTimeout(() => openEditorNow(), 80)
        }
    })

    async function logCroppedFile(file: File, tag = "CROP_RESULT") {
        const url = URL.createObjectURL(file)

        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const im = new Image()
                im.onload = () => resolve(im)
                im.onerror = reject
                im.src = url
            })

            console.group(tag)
            console.log("file:", file)
            console.table({
                name: file.name,
                type: file.type,
                sizeBytes: file.size,
                sizeMB: +(file.size / 1024 / 1024).toFixed(3),
                width: img.naturalWidth,
                height: img.naturalHeight,
                ratio: +(img.naturalWidth / img.naturalHeight).toFixed(4),
            })
            console.log("previewUrl:", url)
            console.groupEnd()
        } finally {
            URL.revokeObjectURL(url)
        }
    }


    // Save dari editor (crop)
    uppy.on("file-editor:complete", async (updatedFile: any) => {
        const myToken = ++jobToken

        try {
            const srcBlob: Blob = updatedFile.data as Blob
            const type = srcBlob.type || updatedFile.type || "image/jpeg"

            let finalBlob: Blob = srcBlob

            // resize hanya untuk hasil editor (kalau diset)
            if (props.outputWidth && props.outputHeight) {
                finalBlob = await resizeToTarget(
                    srcBlob,
                    props.outputWidth,
                    props.outputHeight,
                    type,
                    props.quality
                )
            }

            if (disposed || myToken !== jobToken) return

            const outName = updatedFile.name || "edited-image.jpg"
            const outFile = new File([finalBlob], outName, { type })


            await logCroppedFile(outFile, "UPPY_EDITOR_COMPLETE")

            emit("done", outFile)
            open.value = false
        } catch {
            // optional: handle toast di parent
        }
    })
}

watch(
    open,
    async (val) => {
        disposed = !val
        jobToken++

        if (val) {
            await nextTick()
            initUppy()

            if (props.file) {
                await loadFileToUppy(props.file)
            }
        } else {
            destroyUppy()
        }
    },
    { flush: "post" }
)

watch(
    () => props.file,
    async (f) => {
        if (!open.value) return
        if (!f) return
        await nextTick()
        await loadFileToUppy(f)
    }
)

onBeforeUnmount(() => {
    disposed = true
    jobToken++
    destroyUppy()
})
</script>

<template>
    <Dialog :open="open" @update:open="open = $event">
        <!-- <DialogHeader class="p-4 pb-2"> -->
        <!-- <DialogTitle>Resize & Crop Gambar</DialogTitle> -->

        <!-- </DialogHeader> -->
        <DialogContent class="max-w-[750px] p-0 overflow-hidden" @interactOutside.prevent @escapeKeyDown.prevent>
            <div class="ps-3 pt-2">
                <DialogHeader class="">
                    <!-- <DialogTitle class="text-base font-semibold"> -->
                    Crop & Resize
                    <!-- {{ props.title }} -->
                    <!-- </DialogTitle> -->

                </DialogHeader>

                <div class="flex items-center justify-end">
                    <!-- optional tombol edit/crop (kalau mau) -->
                    <!--
          <Button
            type="button"
            variant="secondary"
            size="sm"
            :disabled="!currentFileId"
            @click="openEditorNow"
          >
            Edit / Crop
          </Button>
          -->

                    <!-- <Button type="button" size="sm" :disabled="!currentFileId" @click="quickSaveAsIs">
                        Save
                    </Button>

                    <Button type="button" variant="secondary" size="sm" @click="cancelDialog">
                        Batal
                    </Button> -->
                </div>
            </div>

            <Separator />

            <div class="bg-warning -mt-5">
                <div ref="dashboardEl" class="uppy-wrap" />
            </div>
        </DialogContent>
    </Dialog>
</template>

<style>
/* =========================================================
    UPPY DARK MODE (ikut Tailwind `.dark` + shadcn CSS vars)
    - Ini global karena Uppy inject DOM sendiri
    - Tapi kita scope ke `.uppy-wrap` biar ga ganggu komponen lain
    ========================================================= */

.dark .uppy-wrap {
    color-scheme: dark;
}

/* panel utama */
.dark .uppy-wrap .uppy-Dashboard-inner,
.dark .uppy-wrap .uppy-DashboardContent-panel,
.dark .uppy-wrap .uppy-Dashboard-AddFiles,
.dark .uppy-wrap .uppy-ImageCropper-container {
    background: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
}

/* border + divider */
.dark .uppy-wrap .uppy-Dashboard-inner,
.dark .uppy-wrap .uppy-DashboardContent-bar,
.dark .uppy-wrap .uppy-DashboardContent-panel {
    border-color: hsl(var(--border)) !important;
}

/* top bar */
.dark .uppy-wrap .uppy-DashboardContent-bar {
    background: hsl(var(--background)) !important;
}

/* item list */
.dark .uppy-wrap .uppy-DashboardItem {
    background: hsl(var(--muted)) !important;
    border-color: hsl(var(--border)) !important;
}

.dark .uppy-wrap .uppy-DashboardItem-name,
.dark .uppy-wrap .uppy-DashboardItem-status,
.dark .uppy-wrap .uppy-DashboardContent-title,
.dark .uppy-wrap .uppy-DashboardContent-subtitle {
    color: hsl(var(--foreground)) !important;
}

/* tombol */
.dark .uppy-wrap .uppy-c-btn {
    background: hsl(var(--secondary)) !important;
    color: hsl(var(--secondary-foreground)) !important;
    border: 1px solid hsl(var(--border)) !important;
}

.dark .uppy-wrap .uppy-c-btn:hover {
    background: hsl(var(--accent)) !important;
    color: hsl(var(--accent-foreground)) !important;
}

.dark .uppy-wrap .uppy-c-btn-primary {
    background: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
    border-color: transparent !important;
}

/* icon/teks minor */
.dark .uppy-wrap .uppy-Dashboard-Item-action,
.dark .uppy-wrap .uppy-DashboardContent-back,
.dark .uppy-wrap .uppy-DashboardTab-btn {
    color: hsl(var(--muted-foreground)) !important;
}
</style>