<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { VueDatePicker } from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"

import { enUS, id as idLocale } from "date-fns/locale"
import { computed, onBeforeUnmount, onMounted, ref, toRef, useAttrs } from "vue"

import {
    getCancelVariantByTone,
    getSelectVariantByTone,
    type Tone,
    useVueDatePickerToneForced,
} from "@/utils/datePIckerColor"

type SingleModel = string | null
type RangeModel = [string, string] | null

defineOptions({ name: "DCodeDatePicker", inheritAttrs: false })
const attrs = useAttrs()

const props = withDefaults(
    defineProps<{
        modelValue: SingleModel | RangeModel
        range?: boolean
        autoRangeDays?: number | null
        disablePast?: boolean
        maxDaysAhead?: number | null
        placeholder?: string
        disabled?: boolean
        clearable?: boolean
        displayFormat?: string
        modelType?: string
        locale?: "id" | "en"
        placement?:
        | "top" | "top-start" | "top-end"
        | "right" | "right-start" | "right-end"
        | "bottom" | "bottom-start" | "bottom-end"
        | "left" | "left-start" | "left-end"
        prependInner?: string
        error?: string | null
        selectLabel?: string
        cancelLabel?: string
        tone?: Tone
    }>(),
    {
        range: false,
        autoRangeDays: null,
        disablePast: false,
        maxDaysAhead: null,
        placeholder: "Pilih tanggal",
        disabled: false,
        clearable: true,
        displayFormat: "dd/MM/yyyy",
        modelType: "yyyy-MM-dd",
        locale: "en",
        placement: "bottom-start",
        prependInner: undefined,
        error: null,
        selectLabel: "Select",
        cancelLabel: "Cancel",
        tone: "primary",
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", v: SingleModel | RangeModel): void
    (e: "change", v: SingleModel | RangeModel): void
    (e: "clear"): void
}>()

const label = computed(() => (attrs.label as string | undefined) ?? undefined)
const isRequired = computed(() => {
    const req = (attrs as any).required
    const ariaReq = (attrs as any)["aria-required"]
    return req === "" || req === true || req === "true" || ariaReq === "true" || ariaReq === true
})
const hasError = computed(() => !!props.error)

const inner = computed({
    get: () => props.modelValue as any,
    set: (v) => {
        emit("update:modelValue", v as any)
        emit("change", v as any)
    },
})

const resolvedLocale = computed(() => (props.locale === "en" ? enUS : idLocale))
const multiCalendars = computed(() => (props.range ? 2 : false))

const rangeConfig = computed(() => {
    if (!props.range) return false as const
    const cfg: Record<string, any> = { partialRange: false }
    if (props.autoRangeDays && props.autoRangeDays > 0) cfg.autoRange = props.autoRangeDays
    return cfg
})

const startOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}
const endOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
}
const addDays = (d: Date, days: number) => {
    const x = new Date(d)
    x.setDate(x.getDate() + days)
    return x
}

const effectiveMinDate = computed(() => (props.disablePast ? startOfDay(new Date()) : undefined))
const effectiveMaxDate = computed(() => {
    if (props.maxDaysAhead && props.maxDaysAhead > 0) return endOfDay(addDays(new Date(), props.maxDaysAhead))
    return undefined
})

const dpRef = ref<any>(null)
function handleClearBySlot(onClear?: () => void) {
    onClear?.()
    emit("clear")
}

/** ✅ DARK ikut Tailwind (.dark) */
const isDark = ref(false)
let darkObs: MutationObserver | null = null
onMounted(() => {
    const el = document.documentElement
    const sync = () => (isDark.value = el.classList.contains("dark"))
    sync()
    darkObs = new MutationObserver(sync)
    darkObs.observe(el, { attributes: true, attributeFilter: ["class"] })
})
onBeforeUnmount(() => {
    darkObs?.disconnect()
    darkObs = null
})

/** ✅ tone dipisah (paksa .dp__theme_light & .dp__theme_dark) */
useVueDatePickerToneForced(toRef(props, "tone") as any)

/** ✅ tone -> button variant */
const selectVariant = computed(() => getSelectVariantByTone(props.tone as Tone))
const cancelVariant = computed(() => getCancelVariantByTone(props.tone as Tone))
</script>

<template>
    <div class="flex flex-col gap-1 w-full" :class="attrs.class">
        <Label v-if="label" class="text-sm font-medium">
            {{ label }}
            <span v-if="isRequired" class="ml-1 text-destructive">*</span>
        </Label>

        <VueDatePicker ref="dpRef" v-model="inner" :dark="isDark" :range="rangeConfig" :multi-calendars="multiCalendars"
            :disabled="disabled" :clearable="false" text-input :enable-time-picker="false"
            :time-config="{ enableTimePicker: false }" :auto-apply="false"
            :action-row="{ showPreview: true, showNow: false }" :locale="resolvedLocale" :model-type="modelType"
            :formats="{ input: displayFormat }" :min-date="effectiveMinDate" :max-date="effectiveMaxDate"
            :floating="{ placement, offset: 8, arrow: false, flip: false, shift: true }" :teleport="true">
            <template
                #dp-input="{ value, onInput, onEnter, onTab, onBlur, onFocus, onKeypress, onPaste, onClear, toggleMenu }">
                <div class="relative w-full group">
                    <div v-if="prependInner" class="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                        <span>{{ prependInner }}</span>
                    </div>

                    <Input :modelValue="value" :placeholder="placeholder" :disabled="disabled" autocomplete="off"
                        readonly @click="toggleMenu()" @focus="onFocus()" @blur="onBlur()" @input="onInput($event)"
                        @keydown.enter="onEnter($event)" @keydown.tab="onTab($event)" @keypress="onKeypress($event)"
                        @paste="onPaste()" :class="[
                            'w-full h-10 flex items-center gap-2 rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900 text-foreground dark:text-gray-300 border-gray-300 dark:border-gray-700 focus-within:ring-1 focus-within:ring-white',
                            prependInner ? 'pl-10' : '',
                            (clearable && value && !disabled) ? 'pr-10' : '',
                            hasError ? 'border-destructive focus:ring-destructive focus-visible:ring-destructive focus-visible:ring-[0.5px]' : '',
                        ]" />

                    <!-- <div v-if="clearable && value && !disabled" class="absolute inset-y-0 right-3 flex items-center">
                        <button type="button" class="text-muted-foreground hover:text-foreground text-lg leading-none"
                            aria-label="Clear date" @click.stop="handleClearBySlot(onClear)">
                            ✕
                        </button>
                    </div> -->
                </div>
            </template>

            <template #action-buttons="{ selectDate, selectionDisabled }">
                <div class="flex items-center justify-end gap-2 px-2 pb-2">
                    <Button type="button" variant="ghost" size="sm" @click="dpRef?.closeMenu()">
                        {{ cancelLabel }}
                    </Button>

                    <Button type="button" variant="default" size="sm" :disabled="selectionDisabled"
                        @click="selectDate()">
                        {{ selectLabel }}
                    </Button>
                </div>
            </template>
        </VueDatePicker>

        <p v-if="hasError" class="text-xs text-destructive">
            {{ props.error }}
        </p>
    </div>
</template>
