<script setup lang="ts">
import { ref, watch } from "vue"

// shadcn-vue
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import {
    CalendarDate,
    getLocalTimeZone,
    type DateValue,
} from "@internationalized/date"

type Nullable<T> = T | null
type ReturnType = "date" | "iso" | "yyyy-mm-dd"

type RangeModel =
    | {
        start: Nullable<Date | string>
        end: Nullable<Date | string>
    }
    | null

type RangeValue = { start?: any; end?: any } | null

const props = withDefaults(
    defineProps<{
        modelValue: RangeModel
        placeholder?: string
        disabled?: boolean
        clearable?: boolean
        returnType?: ReturnType
        requireBoth?: boolean // kalau true: Apply wajib ada start+end
    }>(),
    {
        placeholder: "YYYY-MM-DD - YYYY-MM-DD",
        disabled: false,
        clearable: true,
        returnType: "yyyy-mm-dd",
        requireBoth: false,
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", v: RangeModel): void
    (e: "change", v: RangeModel): void
    (e: "invalid", message: string): void
}>()

const open = ref(false)

// committed (yang tampil saat popover tertutup)
const committedRange = ref<RangeValue>(null)
const committedText = ref("")

// draft (yang dipilih sebelum Apply)
const draftRange = ref<RangeValue>(null)
const draftText = ref("")

function pad2(n: number) {
    return String(n).padStart(2, "0")
}
function toYmd(dt: Date) {
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}
function toCalendarDate(dt: Date): DateValue {
    return new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()) as DateValue
}

function parseAnyToDate(v: unknown): Date | null {
    if (!v) return null
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v
    if (typeof v === "string") {
        const s = v.trim()
        if (!s) return null

        // YYYY-MM-DD
        const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (m1) {
            const dt = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]))
            return isNaN(dt.getTime()) ? null : dt
        }

        // DD/MM/YYYY
        const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (m2) {
            const dt = new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]))
            return isNaN(dt.getTime()) ? null : dt
        }

        // ISO / lainnya
        const dt = new Date(s)
        return isNaN(dt.getTime()) ? null : dt
    }
    return null
}

function convertOut(d: Date | null): Date | string | null {
    if (!d) return null
    d.setHours(0, 0, 0, 0)
    if (props.returnType === "iso") return d.toISOString()
    if (props.returnType === "yyyy-mm-dd") return toYmd(d)
    return d
}

function rangeText(r: RangeValue): string {
    const s = r?.start ? toYmd(r.start.toDate(getLocalTimeZone())) : ""
    const e = r?.end ? toYmd(r.end.toDate(getLocalTimeZone())) : ""
    if (s && e) return `${s} - ${e}`
    if (s && !e) return `${s} - `
    return ""
}

function syncCommittedFromModel() {
    const mv = props.modelValue
    const startDt = mv?.start ? parseAnyToDate(mv.start) : null
    const endDt = mv?.end ? parseAnyToDate(mv.end) : null

    let newRange: RangeValue = {
        start: startDt ? toCalendarDate(startDt) : undefined,
        end: endDt ? toCalendarDate(endDt) : undefined,
    }

    // rapihin kalau kosong dua-duanya
    if (!newRange.start && !newRange.end) newRange = null

    committedRange.value = newRange
    committedText.value = committedRange.value ? rangeText(committedRange.value) : ""
}

function resetDraftToCommitted() {
    draftRange.value = committedRange.value
    draftText.value = committedText.value
}

function splitRangeText(s: string): { a: string; b: string | null } {
    const raw = s.trim()
    if (!raw) return { a: "", b: null }

    // delimiter yang aman: " - " (pakai spasi) / " to " / " – "
    if (raw.includes(" - ")) {
        const [a, b] = raw.split(" - ")
        return { a: (a ?? "").trim(), b: (b ?? "").trim() || null }
    }
    if (raw.toLowerCase().includes(" to ")) {
        const [a, b] = raw.toLowerCase().split(" to ")
        return { a: (a ?? "").trim(), b: (b ?? "").trim() || null }
    }
    if (raw.includes(" – ")) {
        const [a, b] = raw.split(" – ")
        return { a: (a ?? "").trim(), b: (b ?? "").trim() || null }
    }

    // kalau user cuma input 1 tanggal
    return { a: raw, b: null }
}

/**
 * Ambil draftText -> isi draftRange (start/end).
 * Return false kalau invalid.
 */
function applyDraftTextToDraftRange(): boolean {
    const { a, b } = splitRangeText(draftText.value)

    if (!a && !b) {
        draftRange.value = null
        return true
    }

    const startDt = a ? parseAnyToDate(a) : null
    if (a && !startDt) {
        emit("invalid", "Format tanggal start tidak valid. Pakai YYYY-MM-DD atau DD/MM/YYYY.")
        return false
    }

    const endDt = b ? parseAnyToDate(b) : null
    if (b && !endDt) {
        emit("invalid", "Format tanggal end tidak valid. Pakai YYYY-MM-DD atau DD/MM/YYYY.")
        return false
    }

    const startVal = startDt ? toCalendarDate(startDt) : undefined
    const endVal = endDt ? toCalendarDate(endDt) : undefined

    // optional: kalau end < start, swap biar aman
    let newRange: RangeValue
    if (startDt && endDt && endDt.getTime() < startDt.getTime()) {
        newRange = { start: endVal, end: startVal }
    } else {
        newRange = { start: startVal, end: endVal }
    }
    draftRange.value = newRange

    // kalau kosong semua
    if (!draftRange.value.start && !draftRange.value.end) {
        draftRange.value = null
        draftText.value = ""
        return true
    }

    // normalize text
    draftText.value = rangeText(draftRange.value)
    return true
}

function emitCommit(r: RangeValue) {
    const start = r?.start ? r.start.toDate(getLocalTimeZone()) : null
    const end = r?.end ? r.end.toDate(getLocalTimeZone()) : null

    if (start) start.setHours(0, 0, 0, 0)
    if (end) end.setHours(0, 0, 0, 0)

    const out: RangeModel =
        start || end
            ? {
                start: convertOut(start),
                end: convertOut(end),
            }
            : null

    emit("update:modelValue", out)
    emit("change", out)
}

function onSelectDraft(v: any) {
    // shadcn-vue Calendar range biasanya ngasih { start, end }
    const r: RangeValue = v ? { start: v.start, end: v.end } : null
    draftRange.value = r

    // update text realtime sesuai pick
    draftText.value = r ? rangeText(r) : ""
}

function onApply() {
    // parse input manual dulu biar konsisten
    const ok = applyDraftTextToDraftRange()
    if (!ok) return

    const r = draftRange.value

    if (props.requireBoth) {
        if (!r?.start || !r?.end) {
            emit("invalid", "Pilih tanggal start dan end dulu sebelum Apply.")
            return
        }
    }

    // ✅ IMPORTANT FIX:
    // commit lokal dulu dari draft → input langsung tampil setelah Apply
    committedRange.value = r
    committedText.value = r ? rangeText(r) : ""

    // draft ikut committed biar tidak balik kosong
    draftRange.value = committedRange.value
    draftText.value = committedText.value

    // baru emit ke parent
    emitCommit(r)

    open.value = false
}

function onCancel() {
    resetDraftToCommitted()
    open.value = false
}

function onClear() {
    draftRange.value = null
    draftText.value = ""
    // jangan emit saat clear, biar user klik Apply (konsisten Apply/Cancel)
}

watch(
    () => props.modelValue,
    () => {
        syncCommittedFromModel()
        if (!open.value) resetDraftToCommitted()
    },
    { immediate: true }
)

watch(open, (v) => {
    if (v) resetDraftToCommitted()
})
</script>

<template>
    <Popover v-model:open="open">
        <PopoverTrigger as-child>
            <div class="relative w-full">
                <Input v-model="draftText" :disabled="disabled" :placeholder="placeholder" class="pr-20"
                    @focus="!disabled && (open = true)" @keydown.enter.prevent="applyDraftTextToDraftRange()"
                    @blur="applyDraftTextToDraftRange()" />

                <Button v-if="clearable && draftText" type="button" variant="ghost" size="icon"
                    class="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8" :disabled="disabled" @click="onClear">
                    ✕
                </Button>

                <Button type="button" variant="ghost" size="icon"
                    class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" :disabled="disabled"
                    @click="open = !open">
                    📅
                </Button>
            </div>
        </PopoverTrigger>

        <PopoverContent class="p-2 w-auto" align="start">
            <Calendar mode="range" :selected="draftRange ?? undefined" @update:selected="onSelectDraft" initial-focus />

            <div class="mt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" @click="onCancel">Cancel</Button>
                <Button type="button" @click="onApply">Apply</Button>
            </div>
        </PopoverContent>
    </Popover>
</template>
