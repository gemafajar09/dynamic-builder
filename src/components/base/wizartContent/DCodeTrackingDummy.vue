<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
    Asterisk,
    Check,
    ChevronDown,
    Flag,
    Loader2,
} from "lucide-vue-next"
import { computed, ref } from "vue"

type TrackingStatus = "processing" | "waiting" | "success" | "done"

export type TrackingStep = {
    id: string
    title: string
    refNo?: string
    startAt?: string
    endAt?: string
    status: TrackingStatus
    detail?: string
    showDetailButton?: boolean
}

const props = withDefaults(
    defineProps<{
        title?: string
        subtitle?: string
        steps?: TrackingStep[]
    }>(),
    {
        title: "Tracking",
        subtitle: "Tracking Data.",
        steps: undefined,
    }
)

const dummySteps: TrackingStep[] = [
    {
        id: "process",
        title: "Process Slik",
        refNo: "SKBF2512140015",
        startAt: "14-12-2025 10:58:54",
        endAt: "14-12-2025 10:58:54",
        status: "processing",
    },
    {
        id: "waiting",
        title: "Waiting For Slik",
        refNo: "SKBF2512140015",
        startAt: "14-12-2025 10:58:54",
        endAt: "14-12-2025 11:22:17",
        status: "waiting",
        showDetailButton: true,
        detail:
            "Dummy detail:\n- Request queued\n- Robot assigned\n- Waiting response from SLIK\n- ETA: 2-5 minutes",
    },
    {
        id: "check",
        title: "Check If Slik Found",
        refNo: "SKBF2512140015",
        startAt: "14-12-2025 11:22:17",
        endAt: "14-12-2025 11:22:17",
        status: "success",
    },
    {
        id: "finish",
        title: "Finishing Task",
        refNo: "SKBF2512140015",
        startAt: "14-12-2025 11:22:17",
        endAt: "14-12-2025 11:22:17",
        status: "done",
    },
]

const steps = computed(() => props.steps ?? dummySteps)

const openDetailId = ref<string | null>("waiting")

const toggleDetail = (id: string) => {
    openDetailId.value = openDetailId.value === id ? null : id
}

const iconByStatus = (s: TrackingStatus) => {
    if (s === "processing") return ChevronDown
    if (s === "waiting") return Asterisk
    if (s === "success") return Check
    return Flag
}

const iconClassByStatus = (s: TrackingStatus) => {
    if (s === "processing") return "text-primary"
    if (s === "waiting") return "text-amber-500"
    if (s === "success") return "text-sky-500"
    return "text-emerald-500"
}

const ringClassByStatus = (s: TrackingStatus) => {
    if (s === "processing") return "border-primary/40 bg-primary/5"
    if (s === "waiting") return "border-amber-500/40 bg-amber-500/5"
    if (s === "success") return "border-sky-500/40 bg-sky-500/5"
    return "border-emerald-500/40 bg-emerald-500/5"
}
</script>

<template>
    <div class="w-full">
        <!-- Header (Tracking + subtitle) -->
        <div class="mb-6">
            <div class="text-lg font-semibold text-foreground">{{ title }}</div>
            <div class="text-sm text-muted-foreground">{{ subtitle }}</div>
        </div>

        <!-- Timeline -->
        <div class="space-y-10">
            <div v-for="(s, idx) in steps" :key="s.id" class="flex items-start gap-6">
                <!-- Left: icon + vertical line -->
                <div class="relative flex w-10 flex-col items-center">
                    <!-- icon circle -->
                    <div class="flex h-9 w-9 items-center justify-center rounded-full border"
                        :class="ringClassByStatus(s.status)">
                        <component :is="iconByStatus(s.status)" class="h-4 w-4" :class="iconClassByStatus(s.status)" />
                    </div>

                    <!-- vertical line (except last) -->
                    <div v-if="idx !== steps.length - 1" class="mt-2 h-full w-px bg-muted/40"
                        style="min-height: 86px" />
                </div>

                <!-- Right: content -->
                <div class="min-w-0 flex-1">
                    <!-- title -->
                    <div class="text-[15px] font-semibold italic text-primary">
                        {{ s.title }}
                    </div>

                    <!-- meta -->
                    <div class="mt-3 space-y-3 text-sm text-muted-foreground">
                        <div v-if="s.refNo" class="pl-0">{{ s.refNo }}</div>
                        <div v-if="s.startAt">{{ s.startAt }}</div>
                        <div v-if="s.endAt">{{ s.endAt }}</div>
                    </div>

                    <!-- Show Detail button -->
                    <div v-if="s.showDetailButton" class="mt-4">
                        <Button variant="outline" size="sm" class="h-9 rounded-lg px-4" @click="toggleDetail(s.id)">
                            <span class="mr-2">
                                {{ openDetailId === s.id ? "Hide Detail" : "Show Detail" }}
                            </span>
                            <Loader2 v-if="s.status === 'waiting'" class="h-4 w-4 animate-spin" />
                        </Button>

                        <!-- detail box -->
                        <div v-if="openDetailId === s.id && s.detail"
                            class="mt-3 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-line">
                            {{ s.detail }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
