<template>
    <div class="space-y-6">
        <div v-for="sec in sections" :key="sec.id" class="space-y-3">
            <!-- Header line -->
            <div class="flex items-center gap-6 text-sm text-muted-foreground">
                <div class="font-medium">
                    Identitas:
                    <span class="ml-2 text-foreground">{{ sec.identity ?? "-" }}</span>
                </div>
                <div class="font-medium">
                    Total Skor:
                    <span class="ml-2 text-foreground">{{ totalScore(sec) }}</span>
                </div>
            </div>

            <DataTable :columns="columns" :items="sec.rows" :has-actions="false" permission-base="/" />

            <!-- <div class="flex items-center gap-6 text-sm text-muted-foreground">
                <div class="font-medium">
                    Identitas:
                    <span class="ml-2 text-foreground">{{ sec.identity ?? "-" }}</span>
                </div>
                <div class="font-medium">
                    Total Skor:
                    <span class="ml-2 text-foreground">{{ totalScore(sec) }}</span>
                </div>
            </div> -->
        </div>
    </div>
</template>

<script setup lang="ts">
import DataTable from "@/components/ui/DataTable.vue"
import type { TableColumn } from "@/types"
import { computed } from "vue"

export type ScoringRow = {
    parameter: string
    matchStatus: "MATCH" | "NOTMATCH" | "-" | string
    applicationData: string
    resultSlik: string
    score: number | string
}

export type ScoringSection = {
    id: string
    identity?: string
    rows: ScoringRow[]
}

const props = withDefaults(
    defineProps<{
        sections?: ScoringSection[]
    }>(),
    {
        sections: undefined,
    }
)

const dummySections: ScoringSection[] = []

const sections = computed(() => props.sections ?? dummySections)

const columns = computed<TableColumn[]>(() => [])

const totalScore = (sec: ScoringSection) => {
    return (sec.rows || []).reduce((sum, r) => {
        const n = typeof r.score === "number" ? r.score : Number(r.score)
        return Number.isFinite(n) ? sum + n : sum
    }, 0)
}
</script>
