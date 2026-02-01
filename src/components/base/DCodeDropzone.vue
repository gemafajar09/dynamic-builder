<script setup lang="ts">
import { computed, ref } from "vue"

// shadcn-vue
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PickMode = "single" | "multiple"

const props = withDefaults(
    defineProps<{
        label?: string
        hint?: string

        accept?: string
        maxSizeMb?: number
        mode?: PickMode

        disabled?: boolean
        showSelected?: boolean

        /** ✅ NEW: error dari parent (wrapper) */
        error?: string | null
    }>(),
    {
        label: "Upload File",
        hint: "Drag & drop file di sini atau klik area ini",
        accept: "image/*",
        maxSizeMb: 2,
        mode: "single",
        disabled: false,
        showSelected: true,
        error: null,
    }
)

const emit = defineEmits<{
    (e: "picked", file: File): void
    (e: "picked:multiple", files: File[]): void
    (e: "error", message: string): void
}>()

const fileInputEl = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMsg = ref<string | null>(null)

const lastFileName = ref<string | null>(null)
const lastFileSize = ref<number | null>(null)

const acceptLabel = computed(() => props.accept || "file/*")

/** ✅ NEW: yang ditampilkan di UI (prioritas error dari parent) */
const displayError = computed(() => props.error ?? errorMsg.value)

function browse() {
    if (props.disabled) return
    fileInputEl.value?.click()
}

function humanSize(bytes: number) {
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    if (kb >= 1) return `${kb.toFixed(1)} KB`
    return `${bytes} B`
}

function validateFile(f: File): string | null {
    if (!f) return "File tidak valid"

    if (props.accept?.includes("image/") && !f.type.startsWith("image/")) {
        return "Hanya file gambar yang diizinkan"
    }

    const maxBytes = (props.maxSizeMb ?? 2) * 1024 * 1024
    if (f.size > maxBytes) {
        return `Ukuran file terlalu besar. Maks ${props.maxSizeMb}MB`
    }

    return null
}

function setLastFile(f: File) {
    lastFileName.value = f.name
    lastFileSize.value = f.size
}

function pickFiles(files: File[]) {
    // ✅ clear error internal (external error di-handle parent)
    errorMsg.value = null
    if (!files.length) return

    if (props.mode === "single") {
        const f = files[0]
        const err = validateFile(f)
        if (err) {
            errorMsg.value = err
            emit("error", err)
            return
        }
        if (props.showSelected) setLastFile(f)
        emit("picked", f)
        return
    }

    const ok: File[] = []
    for (const f of files) {
        const err = validateFile(f)
        if (err) {
            errorMsg.value = err
            emit("error", err)
            return
        }
        ok.push(f)
    }

    if (ok.length) {
        if (props.showSelected) setLastFile(ok[0])
        emit("picked:multiple", ok)
    }
}

function onPickFiles(e: Event) {
    const input = e.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    pickFiles(files)
    input.value = ""
}

function onDragEnter() {
    if (props.disabled) return
    isDragging.value = true
}
function onDragOver() {
    if (props.disabled) return
    isDragging.value = true
}
function onDragLeave() {
    isDragging.value = false
}
function onDrop(e: DragEvent) {
    if (props.disabled) return
    isDragging.value = false

    const files = Array.from(e.dataTransfer?.files ?? [])
    const filtered =
        props.accept?.includes("image/") ? files.filter((f) => f.type.startsWith("image/")) : files

    pickFiles(filtered)
}


const acceptPretty = computed(() =>
    (props.accept || "file/*")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => (s === "image/*" ? "IMAGE" : s.replace(/^image\//, "").replace(/^\./, "")))
        .join(", ")
)

const maxSizeLabel = computed(() => `${props.maxSizeMb ?? 0}MB`)

</script>

<template>
    <Card :class="disabled ? 'opacity-60' : ''">
        <CardHeader class="pb-2">
            <CardTitle class="text-sm font-semibold">
                {{ label }}
            </CardTitle>
        </CardHeader>

        <CardContent class="pt-2">
            <div class="flex justify-center items-center rounded-xl border-2 border-dashed transition cursor-pointer select-none"
                :class="[
                    isDragging ? 'border-primary bg-primary/10 -translate-y-[1px]' : 'border-border bg-muted/30',
                    disabled ? 'cursor-not-allowed' : 'hover:border-primary/60 hover:bg-primary/5',
                ]" style="min-height: 190px" @click="browse" @dragenter.prevent="onDragEnter"
                @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
                <div class="h-full w-full p-6 flex flex-col items-center justify-center text-center gap-2">
                    <div class="text-sm font-medium">Drag & drop file di sini</div>
                    <div class="text-xs text-muted-foreground">atau klik area ini untuk memilih file</div>
                    <div class="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="secondary" class="text-[11px]">
                            Allowed: {{ acceptPretty }}
                        </Badge>
                        <Badge variant="secondary" class="text-[11px]">
                            Max: {{ props.maxSizeMb }}MB
                        </Badge>
                    </div>
                    <Badge v-if="showSelected && lastFileName" variant="secondary" class="mt-2">
                        {{ lastFileName }} • {{ lastFileSize ? humanSize(lastFileSize) : "" }}
                    </Badge>
                </div>

                <input ref="fileInputEl" type="file" class="hidden" :accept="accept" :multiple="mode === 'multiple'"
                    @change="onPickFiles" />
            </div>

            <!-- ✅ sekarang error dari wrapper juga tampil di sini -->
            <Alert v-if="displayError" variant="destructive" class="mt-3">
                <AlertDescription class="text-sm">
                    {{ displayError }}
                </AlertDescription>
            </Alert>
        </CardContent>
    </Card>
</template>
