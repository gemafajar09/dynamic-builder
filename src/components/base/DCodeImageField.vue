<script setup lang="ts">
import { computed, ref, watch } from "vue"

import DCodeDropzone from "@/components/base/DCodeDropzone.vue"
import DCodeImageCropperDialog from "@/components/base/DCodeImageCropperDialog.vue"
import DCodeImageResult from "@/components/base/DCodeImageResult.vue"

type Nullable<T> = T | null

const props = withDefaults(
    defineProps<{
        /** v-model */
        modelValue: Nullable<File>

        /** UI Dropzone */
        label?: string
        hint?: string
        disabled?: boolean

        /**
         * contoh pemakaian:
         * allowed-types="jpg,jpeg,png"
         * (di dalam component jadi: ['.jpg','.jpeg','.png'])
         */
        allowedTypes?: string | null

        /**
         * fallback accept (dipakai kalau allowedTypes kosong)
         * contoh: "image/*" atau "image/jpeg,image/png"
         */
        accept?: string

        /** ukuran file input (MB) */
        minSizeMb?: number | null
        maxSizeMb?: number

        /** UI Result */
        title?: string
        description?: string
        previewWidth?: number
        previewHeight?: number

        /** Cropper Config */
        aspectRatio?: number | null
        outputWidth?: number | null
        outputHeight?: number | null
        quality?: number
        autoOpenEditor?: boolean

        /** OPTIONAL: validasi dimensi gambar input (pixel) */
        minWidth?: number | null
        minHeight?: number | null
        maxWidth?: number | null
        maxHeight?: number | null

        /** API Configuration for Direct Upload */
        endpoint?: {
            apiMethod?: string
            apiUrl?: string
        }

        editUseOriginal?: boolean
    }>(),
    {
        modelValue: null,

        label: "Upload Gambar",
        hint: "Drag & drop atau klik area ini",
        disabled: false,

        allowedTypes: null,
        accept: "image/*",

        minSizeMb: null,
        maxSizeMb: 2,

        title: "Hasil Gambar",
        description: "",
        previewWidth: 360,
        previewHeight: 220,

        aspectRatio: null,
        outputWidth: null,
        outputHeight: null,
        quality: 0.92,
        autoOpenEditor: true,

        minWidth: null,
        minHeight: null,
        maxWidth: null,
        maxHeight: null,

        editUseOriginal: false,
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", v: Nullable<File>): void
    (e: "error", message: string): void
    (e: "uploaded", payload: any): void
}>()

const resultFile = computed({
    get: () => props.modelValue,
    set: (v) => emit("update:modelValue", v),
})

const cropOpen = ref(false)
const sourceFile = ref<Nullable<File>>(null)
const originalFile = ref<Nullable<File>>(null)

/** ✅ alert internal untuk wrapper (biar extension error kelihatan) */
const fieldError = ref<string | null>(null)
function setError(msg: string) {
    fieldError.value = msg
    emit("error", msg)
}
function clearError() {
    fieldError.value = null
}

/** =========================
 *  allowedTypes parsing
 *  ========================= */

const allowedTypesArray = computed<string[]>(() => {
    const raw = (props.allowedTypes ?? "").trim()
    if (!raw) return []

    const tokens = raw
        .split(/[,\s;]+/g)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

    return tokens.map((t) => {
        if (t.includes("/")) return t          // mime "image/png"
        if (t.startsWith(".")) return t        // ".png"
        return `.${t}`                         // "png" -> ".png"
    })
})

function getExt(name: string) {
    const i = name.lastIndexOf(".")
    return i >= 0 ? name.slice(i).toLowerCase() : ""
}

/**
 * ✅ accept untuk Dropzone:
 * - kalau allowedTypes ada -> gunakan ext/mime aja (JANGAN image/* biar strict)
 * - kalau kosong -> fallback props.accept (default image/*)
 */
const resolvedAccept = computed(() => {
    if (allowedTypesArray.value.length) {
        const exts = allowedTypesArray.value.filter((t) => t.startsWith("."))
        const mimes = allowedTypesArray.value.filter((t) => t.includes("/"))
        return [...mimes, ...exts].join(",")
    }
    return props.accept || "image/*"
})

const typesLabel = computed(() => {
    if (allowedTypesArray.value.length) return allowedTypesArray.value.join(", ")
    return props.accept || "image/*"
})

function isAllowedType(file: File) {
    // kalau allowedTypes ada -> strict ke list itu
    if (allowedTypesArray.value.length) {
        const mime = (file.type || "").toLowerCase()
        const ext = getExt(file.name)

        return allowedTypesArray.value.some((t) => {
            if (t.includes("/")) return mime === t
            if (t.startsWith(".")) return ext === t
            return ext === `.${t}`
        })
    }

    // kalau allowedTypes kosong -> minimal harus image/*
    const accept = (props.accept || "image/*").toLowerCase()
    if (accept.includes("image/")) {
        return (file.type || "").toLowerCase().startsWith("image/")
    }

    // fallback: kalau accept bukan image/*, anggap lolos
    return true
}

function bytesFromMb(mb: number) {
    return mb * 1024 * 1024
}

async function getImageSize(file: File): Promise<{ w: number; h: number } | null> {
    if (!file.type?.startsWith("image/")) return null

    return await new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ w: img.naturalWidth, h: img.naturalHeight })
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(null)
        }
        img.src = url
    })
}

async function validatePickedFile(file: File): Promise<string | null> {
    if (!file) return "File tidak valid"

    // ✅ type check
    if (!isAllowedType(file)) {
        return `only Allowed: ${typesLabel.value}`
    }

    // ✅ size check
    if (props.minSizeMb != null && file.size < bytesFromMb(props.minSizeMb)) {
        return `Ukuran file terlalu kecil. Minimal ${props.minSizeMb}MB`
    }
    if (props.maxSizeMb != null && file.size > bytesFromMb(props.maxSizeMb)) {
        return `Ukuran file terlalu besar. Maks ${props.maxSizeMb}MB`
    }

    // ✅ dimensi (optional)
    const needDimCheck =
        props.minWidth != null ||
        props.minHeight != null ||
        props.maxWidth != null ||
        props.maxHeight != null

    if (needDimCheck) {
        const dim = await getImageSize(file)
        if (!dim) return "Gagal membaca dimensi gambar"

        if (props.minWidth != null && dim.w < props.minWidth) return `Lebar gambar minimal ${props.minWidth}px`
        if (props.minHeight != null && dim.h < props.minHeight) return `Tinggi gambar minimal ${props.minHeight}px`
        if (props.maxWidth != null && dim.w > props.maxWidth) return `Lebar gambar maksimal ${props.maxWidth}px`
        if (props.maxHeight != null && dim.h > props.maxHeight) return `Tinggi gambar maksimal ${props.maxHeight}px`
    }

    return null
}

/** =========================
 *  flow
 *  ========================= */

function openCrop(file: File) {
    if (props.disabled) return
    sourceFile.value = file
    cropOpen.value = true
}

async function onPicked(file: File) {
    if (props.disabled) return
    clearError()

    const err = await validatePickedFile(file)
    if (err) {
        setError(err) // ✅ sekarang pasti muncul alert
        return
    }

    originalFile.value = file
    openCrop(file)
}

// Direct Upload Logic
import { useApi } from "@/composables/useApi"
import { useToast } from "@/composables/useToast"
const { DCodeApi } = useApi() as any
const toast = useToast()

const isUploading = ref(false)


type UploadedDoc = {
    id?: number
    mime?: string
    server?: string
    url?: string
    fullUrl?: string
}

const uploadedDoc = ref<UploadedDoc | null>(null)

function joinUrl(server?: string, path?: string) {
    if (!server || !path) return null
    return server.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "")
}

function pickUploadedDoc(raw: any): UploadedDoc | null {
    const payload = raw?.data ?? raw
    const doc = payload?.data?.[0]
    if (!doc) return null
    const fullUrl = joinUrl(doc.server, doc.url)
    return { ...doc, fullUrl: fullUrl ? encodeURI(fullUrl) : null }
}


async function uploadFile(file: File) {
    if (!props.endpoint?.apiUrl) {
        resultFile.value = file
        return
    }

    if (typeof DCodeApi !== "function") {
        setError("useApi() must expose DCodeApi()")
        return
    }

    try {
        isUploading.value = true

        const formData = new FormData()
        formData.append("doc", file)

        const method = (props.endpoint.apiMethod || "POST").toUpperCase()
        const url = props.endpoint.apiUrl

        // ✅ INI pola yang benar di project kamu (sesuai contoh multiselect)
        const res = await DCodeApi("", "", formData, {
            _url: url,
            _method: method,
            withCredentials: true,

            // ✅ paksa axios jangan ngunci application/json
            transformRequest: [(data: any, headers: any) => {
                // hapus Content-Type biar browser set multipart boundary otomatis
                if (headers) {
                    delete headers["Content-Type"]
                    delete headers["content-type"]
                }
                return data
            }],
        })



        const raw = (res as any)?.data ?? res
        const doc = pickUploadedDoc(raw)

        // ✅ simpan file utk preview (modelValue tetap File)
        resultFile.value = file

        // ✅ kalau butuh response BE
        emit("uploaded", raw)
    } catch (e: any) {
        console.error("Upload Error", e)
        toast.error("Upload Failed", e?.message || "Unknown error")
        setError(e?.message || "Upload Failed")
    } finally {
        isUploading.value = false
    }
}


async function onCropDone(file: File) {
    clearError()
    // Check if we need to upload
    if (props.endpoint?.apiUrl) {
        await uploadFile(file)
    } else {
        resultFile.value = file
    }

    cropOpen.value = false
    sourceFile.value = null
}


function onCropCancel() {
    cropOpen.value = false
    sourceFile.value = null
}

async function onEdit() {
    if (!resultFile.value) return
    clearError()

    const baseFile = props.editUseOriginal
        ? (originalFile.value ?? resultFile.value)
        : resultFile.value

    const err = await validatePickedFile(baseFile)
    if (err) {
        setError(err)
        return
    }

    openCrop(baseFile)
}

function onRemove() {
    clearError()
    resultFile.value = null
    sourceFile.value = null
    cropOpen.value = false
    originalFile.value = null
}

watch(
    () => props.modelValue,
    (v) => {
        if (v && !originalFile.value) originalFile.value = v
        if (!v) originalFile.value = null
    },
    { immediate: true }
)

</script>

<template>
    <div class="space-y-3">
        <DCodeDropzone v-if="!resultFile" :label="label" :hint="hint" :accept="resolvedAccept" :maxSizeMb="maxSizeMb"
            :disabled="disabled" @picked="onPicked" :error="fieldError" @error="(msg) => setError(msg)" />

        <!-- ✅ Alert internal wrapper (extension, dimensi, dll) -->
        <!-- <div v-if="fieldError"
            class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {{ fieldError }}
        </div> -->

        <DCodeImageResult v-else :file="resultFile" :title="label" :description="description"
            :preview-width="previewWidth" :disabled="disabled" :show-edit="true" :show-remove="true"
            :show-replace="false" @edit="onEdit" @remove="onRemove" :aspect-ratio="16 / 9" />

        <DCodeImageCropperDialog v-model="cropOpen" :file="sourceFile" :title="title" :description="description"
            :auto-open-editor="autoOpenEditor" :aspect-ratio="aspectRatio" :output-width="outputWidth"
            :output-height="outputHeight" :quality="quality" @done="onCropDone" @cancel="onCropCancel" />
    </div>
</template>
