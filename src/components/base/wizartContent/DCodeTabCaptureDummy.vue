<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { computed } from "vue"

export type CaptureItem = {
    id: string
    title: string
    noRef: string
    startDate: string
    endDate: string
    beforeUrl?: string
    afterUrl?: string
}

const props = withDefaults(
    defineProps<{
        items?: CaptureItem[]
    }>(),
    {
        items: undefined,
    }
)

const dummy: CaptureItem[] = [
    {
        id: "1",
        title: "Isi Form Permintaan Kombinasi",
        noRef: "SKBF2512140015",
        startDate: "14-12-2025 11:22:06",
        endDate: "14-12-2025 11:22:07",
        // taruh gambar dummy kamu sendiri / placeholder
        beforeUrl: "https://placehold.co/900x450?text=Before+URL",
        afterUrl: "https://placehold.co/900x450?text=After+URL",
    },
    {
        id: "2",
        title: "Pengisian Captcha dan Submit",
        noRef: "SKBF2512140015",
        startDate: "14-12-2025 11:22:08",
        endDate: "14-12-2025 11:22:17",
        beforeUrl: "https://placehold.co/900x450?text=Before+URL",
        afterUrl: "https://placehold.co/900x450?text=After+URL",
    },
]

const list = computed(() => props.items ?? dummy)
</script>

<template>
    <div class="space-y-6">
        <Card v-for="it in list" :key="it.id" class="w-full">
            <CardHeader class="pb-3">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle class="text-base font-semibold">{{ it.title }}</CardTitle>
                        <CardDescription>Capture Data.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent class="pt-0">
                <!-- rows like detail -->
                <div class="rounded-lg border bg-background">
                    <div class="grid grid-cols-2 gap-6 px-4 py-3 text-sm border-b">
                        <div class="text-muted-foreground">No Ref</div>
                        <div class="font-medium">{{ it.noRef }}</div>
                    </div>

                    <div class="grid grid-cols-2 gap-6 px-4 py-3 text-sm border-b">
                        <div class="text-muted-foreground">Start Date</div>
                        <div class="font-medium">{{ it.startDate }}</div>
                    </div>

                    <div class="grid grid-cols-2 gap-6 px-4 py-3 text-sm">
                        <div class="text-muted-foreground">End Date</div>
                        <div class="font-medium">{{ it.endDate }}</div>
                    </div>
                </div>

                <Separator class="my-5" />

                <!-- Before / After images -->
                <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div class="space-y-2">
                        <div class="text-sm text-muted-foreground">Before URL</div>
                        <div class="overflow-hidden rounded-lg border bg-muted/10">
                            <img v-if="it.beforeUrl" :src="it.beforeUrl" class="w-full h-auto object-contain"
                                alt="Before URL" />
                            <div v-else
                                class="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                                Tidak ada gambar
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-sm text-muted-foreground">After URL</div>
                        <div class="overflow-hidden rounded-lg border bg-muted/10">
                            <img v-if="it.afterUrl" :src="it.afterUrl" class="w-full h-auto object-contain"
                                alt="After URL" />
                            <div v-else
                                class="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                                Tidak ada gambar
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
