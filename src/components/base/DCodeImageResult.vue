<script setup lang="ts">
import { Pencil, Trash2 } from "lucide-vue-next"
import { computed, onBeforeUnmount, ref, watch } from "vue"

import Card from "../ui/card/Card.vue"
import CardContent from "../ui/card/CardContent.vue"
import CardHeader from "../ui/card/CardHeader.vue"
import CardTitle from "../ui/card/CardTitle.vue"
import DCodeButton from "./DCodeButton.vue"

const props = withDefaults(
    defineProps<{
        file: File | null
        title?: string
        description?: string
        disabled?: boolean

        previewHeight?: number
        previewWidth?: number

        showEdit?: boolean
        showReplace?: boolean
        showRemove?: boolean
    }>(),
    {
        title: "Hasil Gambar",
        description: "",
        disabled: false,
        previewHeight: 190,
        previewWidth: 220,
        showEdit: true,
        showReplace: true,
        showRemove: true,
    }
)

const emit = defineEmits<{
    (e: "edit"): void
    (e: "replace"): void
    (e: "remove"): void
}>()

const previewUrl = ref<string | null>(null)

watch(
    () => props.file,
    (f) => {
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = f ? URL.createObjectURL(f) : null
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function humanSize(bytes: number) {
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    if (kb >= 1) return `${kb.toFixed(1)} KB`
    return `${bytes} B`
}

const fileMeta = computed(() => {
    if (!props.file) return null
    return {
        name: props.file.name,
        size: humanSize(props.file.size),
        type: props.file.type || "unknown",
    }
})
</script>

<template>
    <Card v-if="file" :class="disabled ? 'opacity-60 pointer-events-none' : ''">
        <CardHeader class="pb-2">
            <CardTitle class="text-sm font-semibold">
                {{ title }}
            </CardTitle>
            <div v-if="description" class="text-xs text-muted-foreground">
                {{ description }}
            </div>
        </CardHeader>

        <CardContent class="pt-2">
            <!-- ✅ group pindah ke wrapper gambar -->
            <div class="group relative rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border
               w-full transition-colors duration-200
               hover:border-primary/50 hover:bg-primary/5" :style="{ height: `${previewHeight}px` }">
                <img v-if="previewUrl" :src="previewUrl" alt="Preview" class="h-full w-full object-contain" />

                <!-- overlay buttons (tetap tampil) -->
                <div class="absolute top-2 inset-x-2 flex items-center justify-between">
                    <DCodeButton v-if="showEdit" :icon="Pencil" size="icon" variant="secondary" :disabled="disabled"
                        class="h-8 w-8 shadow transition-transform duration-200 group-hover:scale-[1.02]"
                        @click="emit('edit')" />

                    <DCodeButton v-if="showRemove" :icon="Trash2" size="icon" variant="destructive" :disabled="disabled"
                        class="h-8 w-8 shadow transition-transform duration-200 group-hover:scale-[1.02]"
                        @click="emit('remove')" />
                </div>

                <!-- ✅ INFO muncul hanya saat hover preview box -->
                <div class="absolute left-2 bottom-2 z-10 inline-block max-w-[calc(100%-16px)]
                 rounded-xl border px-3 py-2 shadow-lg backdrop-blur
                 opacity-0 translate-y-1 scale-[0.99]
                 transition-all duration-200
                 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
                 border-border/60 dark:border-border/50
                 bg-background/80 dark:bg-background/30">
                    <div class="text-[11px] text-foreground/90 space-y-1 whitespace-nowrap">
                        <div class="flex gap-2">
                            <span class="w-14 shrink-0 text-muted-foreground">Nama</span>
                            <span class="font-medium truncate">{{ fileMeta?.name }}</span>
                        </div>
                        <div class="flex gap-2">
                            <span class="w-14 shrink-0 text-muted-foreground">Ukuran</span>
                            <span class="font-medium">{{ fileMeta?.size }}</span>
                        </div>
                        <div class="flex gap-2">
                            <span class="w-14 shrink-0 text-muted-foreground">Tipe</span>
                            <span class="font-medium truncate">{{ fileMeta?.type }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
