<script setup lang="ts">
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApi } from "@/composables/useApi"
import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/vue"
import { ChevronDown } from "lucide-vue-next"
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue"

defineOptions({ name: "DCodeMultiSelectChips", inheritAttrs: false })

type AnyItem = any
type ApiOptions = Record<string, any>

const attrs = useAttrs()

const emit = defineEmits<{
    (e: "update:modelValue", v: any[]): void
    (e: "clear"): void
    (e: "max"): void
}>()

const props = withDefaults(
    defineProps<{
        modelValue: any[] | null | undefined

        // ✅ data source (optional)
        items?: AnyItem[]

        // ✅ endpoint mode (kalau mau fetch dari API)
        endpoint?: {
            apiUrl?: string
            apiMethod?: string // GET/POST/PUT/...
            apiOptions?: ApiOptions | (() => ApiOptions | undefined)
        }

        // ✅ fetch behavior
        autoFetchOnOpen?: boolean
        autoFetchOnMount?: boolean
        refreshOnOpen?: boolean // false = tidak fetch ulang setiap open

        // UI
        label?: string
        placeholder?: string
        disabled?: boolean
        clearable?: boolean
        searchable?: boolean
        searchPlaceholder?: string
        visible?: boolean
        skeleton?: boolean
        maxChips?: number | null

        // ✅ limit selection
        maxSelected?: number | null // null = unlimited

        // mapping
        itemTitle?: string | ((item: AnyItem) => string)
        itemValue?: string | ((item: AnyItem) => any)
        returnObject?: boolean

        // virtual + height
        virtual?: boolean
        itemHeight?: number

        /**
         * ✅ dropdown max rows (tinggi dropdown = min(count, maxRows) * itemHeight)
         * default 5 (sesuai request)
         */
        maxRows?: number

        overscan?: number

        // validation
        error?: string | null
        required?: boolean
    }>(),
    {
        items: () => [],

        endpoint: undefined,
        autoFetchOnOpen: true,
        autoFetchOnMount: false,
        refreshOnOpen: false,

        label: "",
        placeholder: "Pilih data…",
        disabled: false,
        clearable: false,
        searchable: false,
        searchPlaceholder: "Cari…",
        visible: true,
        skeleton: false,
        maxChips: 2,

        maxSelected: 3,

        itemTitle: "name",
        itemValue: "id",
        returnObject: false,

        virtual: true,
        itemHeight: 40,
        maxRows: 5,
        overscan: 6,

        error: null,
        required: false,
    }
)

// ========= basic computed =========
const label = computed(() => (props.label || (attrs.label as string | undefined)) ?? undefined)
const isVisible = computed(() => (props.visible !== undefined ? props.visible : true))

const uid = Math.random().toString(36).slice(2, 7)
const elementId = computed(() => {
    const token = (attrs.id as string | undefined) || label.value || "field"
    return `app-multiselect-${token}-${uid}`
})

const isRequired = computed(() => {
    if (props.required) return true
    const req = (attrs as any).required
    const ariaReq = (attrs as any)["aria-required"]
    const requiredByAttr = req === "" || req === true || req === "true"
    const requiredByAria = ariaReq === "true" || ariaReq === true
    return requiredByAttr || requiredByAria
})

const hasError = computed(() => !!props.error)

// ========= helpers =========
function getTitle(item: AnyItem): string {
    if (!item) return ""
    if (typeof props.itemTitle === "function") return props.itemTitle(item) ?? ""
    return String(item?.[props.itemTitle as any] ?? "")
}
function getValue(item: AnyItem): any {
    if (!item) return null
    if (typeof props.itemValue === "function") return props.itemValue(item)
    return item?.[props.itemValue as any]
}
function keyOf(item: AnyItem, fallback: number) {
    const v = getValue(item)
    return v ?? fallback
}

const normalizedModel = computed<any[]>(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

// ========= API mode (endpoint) =========
const isApiMode = computed(() => !!props.endpoint?.apiUrl)

const internalItems = ref<AnyItem[]>([])
const isLoadingOptions = ref(false)
const hasLoadedOnce = ref(false)

const apiOptionsResolved = computed<ApiOptions | undefined>(() => {
    const opt = props.endpoint?.apiOptions
    if (!opt) return undefined
    return typeof opt === "function" ? opt() : opt
})

const endpointKey = computed(() => {
    const url = props.endpoint?.apiUrl ?? ""
    const method = (props.endpoint?.apiMethod ?? "GET").toUpperCase()
    const optKey = JSON.stringify(apiOptionsResolved.value ?? null)
    return `${method} ${url} :: ${optKey}`
})

const effectiveItems = computed<AnyItem[]>(() => {
    return isApiMode.value ? internalItems.value : (props.items || [])
})

async function fetchOptions() {
    if (!isApiMode.value) return
    if (!props.endpoint?.apiUrl) return
    if (isLoadingOptions.value) return

    const { DCodeApi } = useApi() as any
    if (typeof DCodeApi !== "function") {
        console.error("[DCodeMultiSelectChips] useApi() must expose DCodeApi()")
        return
    }

    isLoadingOptions.value = true
    try {
        const res = await DCodeApi("", "", apiOptionsResolved.value, {
            _url: props.endpoint.apiUrl,
            _method: (props.endpoint.apiMethod || "GET").toUpperCase(),
        })

        const raw = (res as any)?.data ?? res
        // support: {status:true,data:[...]} OR {data:{data:[...]}} OR {data:[...]}
        const list = raw?.data ?? raw

        internalItems.value = Array.isArray(list) ? list : []
        hasLoadedOnce.value = true
    } catch (e: any) {
        console.error("[DCodeMultiSelectChips][fetchOptions] ERROR:", e)
        internalItems.value = []
    } finally {
        isLoadingOptions.value = false
    }
}

watch(
    () => endpointKey.value,
    () => {
        internalItems.value = []
        hasLoadedOnce.value = false
    }
)

onMounted(() => {
    if (props.autoFetchOnMount && isApiMode.value) void fetchOptions()
})

// ========= selected items =========
const selectedItems = computed<AnyItem[]>(() => {
    const mv = normalizedModel.value
    if (props.returnObject) return mv

    const map = new Map<any, AnyItem>()
    for (const it of effectiveItems.value) map.set(getValue(it), it)

    return mv.map((v) => map.get(v) ?? { [props.itemValue as any]: v, [props.itemTitle as any]: String(v) })
})

const displayChips = computed(() => {
    if (props.maxChips === null) return selectedItems.value
    return selectedItems.value.slice(0, props.maxChips)
})

function isSelected(item: AnyItem) {
    const mv = normalizedModel.value
    if (props.returnObject) {
        const v = getValue(item)
        return mv.some((x) => getValue(x) === v)
    }
    return mv.includes(getValue(item))
}

// ========= max selected =========
const maxSelectedNum = computed(() => {
    if (props.maxSelected === null || props.maxSelected === undefined) return null
    const n = Number(props.maxSelected)
    return Number.isFinite(n) && n > 0 ? n : null
})
const isMaxReached = computed(() => {
    const maxN = maxSelectedNum.value
    if (maxN === null) return false
    return normalizedModel.value.length >= maxN
})
function isItemDisabledByMax(item: AnyItem) {
    return !isSelected(item) && isMaxReached.value
}

// ========= available items (hide selected) =========
const selectedValueSet = computed(() => {
    const mv = normalizedModel.value
    const set = new Set<any>()
    if (props.returnObject) for (const x of mv) set.add(getValue(x))
    else for (const v of mv) set.add(v)
    return set
})

const availableItems = computed(() => {
    const set = selectedValueSet.value
    return (effectiveItems.value || []).filter((it) => !set.has(getValue(it)))
})

// ✅ FIX: kalau list belum ada, jangan dianggap "all selected"
const isAllSelected = computed(() => {
    const total = effectiveItems.value.length
    if (total === 0) return false
    return availableItems.value.length === 0
})

// ========= dropdown + floating =========
const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const isOpen = ref(false)
const q = ref("")
const scrollTop = ref(0)
const highlighted = ref(0)

const { floatingStyles } = useFloating(referenceEl, floatingEl, {
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
    middleware: [
        offset(8),
        flip(),
        shift({ padding: 8 }),
        size({
            apply({ rects, elements }) {
                Object.assign(elements.floating.style, {
                    width: `${rects.reference.width}px`,
                    "--floating-width": `${rects.reference.width}px`,
                })
            },
        }),
    ],
})
const floatingStyle = computed(() => floatingStyles.value as any)

const maxRows = computed(() => {
    const n = Number(props.maxRows)
    return Number.isFinite(n) && n > 0 ? n : 5
})

async function open() {
    if (props.disabled) return

    isOpen.value = true
    highlighted.value = 0

    requestAnimationFrame(() => {
        if (listEl.value) listEl.value.scrollTop = 0
        scrollTop.value = 0
    })

    if (isApiMode.value && props.autoFetchOnOpen) {
        const needFetch = props.refreshOnOpen ? true : !hasLoadedOnce.value
        if (needFetch && !isLoadingOptions.value) {
            await fetchOptions()
        }
    }
}
function close() {
    isOpen.value = false
}
function toggle() {
    isOpen.value ? close() : void open()
}

function onDocDown(e: MouseEvent) {
    if (!isOpen.value) return
    const t = e.target as Node
    if (referenceEl.value?.contains(t)) return
    if (floatingEl.value?.contains(t)) return
    close()
}

onMounted(() => document.addEventListener("mousedown", onDocDown))
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocDown))

// ========= choose / remove / clear =========
function choose(item: AnyItem) {
    if (props.disabled) return

    if (isItemDisabledByMax(item)) {
        emit("max")
        return
    }

    const mv = [...normalizedModel.value]

    if (props.returnObject) {
        const v = getValue(item)
        const exists = mv.some((x) => getValue(x) === v)
        if (exists) return
        emit("update:modelValue", [...mv, item])
    } else {
        const v = getValue(item)
        const exists = mv.includes(v)
        if (exists) return
        emit("update:modelValue", [...mv, v])
    }

    q.value = ""
    highlighted.value = 0
    requestAnimationFrame(() => {
        if (listEl.value) listEl.value.scrollTop = 0
        scrollTop.value = 0
    })
}

function removeItem(item: AnyItem) {
    if (props.disabled) return
    const mv = [...normalizedModel.value]
    if (props.returnObject) {
        const v = getValue(item)
        emit("update:modelValue", mv.filter((x) => getValue(x) !== v))
    } else {
        const v = getValue(item)
        emit("update:modelValue", mv.filter((x) => x !== v))
    }
}

function clear() {
    if (props.disabled) return
    emit("update:modelValue", [])
    emit("clear")
    close()
}

// ========= filter =========
const filteredItems = computed(() => {
    const s = q.value.trim().toLowerCase()
    const base = availableItems.value
    if (!s) return base
    return base.filter((it) => getTitle(it).toLowerCase().includes(s))
})
const filteredCount = computed(() => filteredItems.value.length)

watch(isOpen, (v) => {
    if (!v) q.value = ""
})

// ========= dropdown height (pas 5 item) =========
// - kalau all selected -> 1 row (biar ga ada space kosong)
// - kalau kosong -> 1 row untuk pesan
// - selain itu -> min(count, 5) rows
const listHeightPx = computed(() => {
    if (isAllSelected.value) return props.itemHeight
    const count = filteredCount.value
    const rows = count <= 0 ? 1 : Math.min(count, maxRows.value)
    return rows * props.itemHeight
})

// ========= virtual =========
const totalHeight = computed(() => (props.virtual ? filteredCount.value * props.itemHeight : 0))
const visibleCount = computed(() => {
    if (!props.virtual) return filteredCount.value
    // jumlah item yang dirender tetap aman (maxRows + overscan)
    return Math.ceil(listHeightPx.value / props.itemHeight) + props.overscan
})
const startIndex = computed(() => {
    if (!props.virtual) return 0
    const raw = Math.floor(scrollTop.value / props.itemHeight) - Math.floor(props.overscan / 2)
    return Math.max(0, raw)
})
const endIndex = computed(() => {
    if (!props.virtual) return filteredCount.value
    return Math.min(filteredCount.value, startIndex.value + visibleCount.value)
})
const offsetTop = computed(() => (props.virtual ? startIndex.value * props.itemHeight : 0))
const visibleItems = computed(() => {
    const arr = filteredItems.value
    return props.virtual ? arr.slice(startIndex.value, endIndex.value) : arr
})
function onScroll(e: Event) {
    const el = e.target as HTMLElement
    scrollTop.value = el.scrollTop
}

// ========= keyboard =========
function isHighlighted(idx: number) {
    return idx === highlighted.value
}
function ensureVisible(idx: number) {
    const el = listEl.value
    if (!el || !props.virtual) return
    const top = idx * props.itemHeight
    const bottom = top + props.itemHeight
    const viewTop = el.scrollTop
    const viewBottom = el.scrollTop + el.clientHeight
    if (top < viewTop) el.scrollTop = top
    else if (bottom > viewBottom) el.scrollTop = bottom - el.clientHeight
}
function move(delta: number) {
    const max = Math.max(0, filteredCount.value - 1)
    highlighted.value = Math.min(max, Math.max(0, highlighted.value + delta))
    ensureVisible(highlighted.value)
}
function selectHighlighted() {
    const item = filteredItems.value[highlighted.value]
    if (item) choose(item)
}

const showClear = computed(() => props.clearable && !props.disabled && selectedItems.value.length > 0)

// ========= border/ring style (lebih tipis) =========
const triggerActiveClass = computed(() => {
    // ✅ tipiskan focus: ring-[0.5px]
    if (hasError.value) return "border-red-500 ring-[0.5px] ring-red-500"
    if (isOpen.value) return "border-gray-700 ring-[0.5px] ring-gray-700 dark:border-gray-300 dark:ring-gray-300"
    return ""
})
</script>

<template>
    <div v-show="isVisible" class="flex flex-col gap-1 w-full" :class="attrs.class" :aria-busy="props.skeleton">
        <template v-if="props.skeleton">
            <div v-if="label" class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div class="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </template>

        <template v-else>
            <Label v-if="label" :for="elementId" class="text-sm font-medium">
                {{ label }}
                <span v-if="isRequired" class="ml-1 text-destructive">*</span>
            </Label>

            <div ref="referenceEl" class="relative">
                <Button :id="elementId" type="button" variant="outline"
                    class="w-full justify-between h-auto min-h-10 px-3 py-2 transition border"
                    :disabled="props.disabled" :class="[
                        'bg-white dark:bg-neutral-900 border-gray-300 dark:border-gray-700 text-foreground dark:text-gray-300',
                        triggerActiveClass,
                    ]" @click="toggle">
                    <div class="min-w-0 flex-1 text-left">
                        <div v-if="selectedItems.length" class="flex flex-wrap gap-1.5">
                            <Badge v-for="(it, idx) in displayChips" :key="`chip-${keyOf(it, idx)}`" variant="secondary"
                                class="gap-1">
                                <span class="max-w-[220px] truncate">{{ getTitle(it) }}</span>
                                <button v-if="!props.disabled" class="ml-1 opacity-70 hover:opacity-100"
                                    @click.stop="removeItem(it)" aria-label="Remove">
                                    ✕
                                </button>
                            </Badge>

                            <Badge v-if="props.maxChips !== null && selectedItems.length > props.maxChips"
                                variant="secondary">
                                +{{ selectedItems.length - (props.maxChips ?? 0) }}
                            </Badge>
                        </div>

                        <div v-else class="text-muted-foreground truncate">
                            {{ props.placeholder }}
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <button v-if="showClear" class="text-muted-foreground hover:text-foreground" @click.stop="clear"
                            aria-label="Clear">
                            ✕
                        </button>
                        <ChevronDown class="h-4 w-4 text-muted-foreground" />
                    </div>
                </Button>

                <Teleport to="body">
                    <div v-if="isOpen" ref="floatingEl" class="-mt-1 z-[9999] w-[var(--floating-width)] rounded-lg border shadow-lg overflow-hidden
                   bg-white dark:bg-neutral-900
                   border-gray-200 dark:border-gray-800" :style="floatingStyle">
                        <div v-if="props.searchable && !isAllSelected"
                            class="p-2 border-b border-gray-200 dark:border-gray-800">
                            <Input v-model="q" :placeholder="props.searchPlaceholder" class="h-10"
                                @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
                                @keydown.enter.prevent="selectHighlighted" @keydown.esc.prevent="close" />
                        </div>

                        <div ref="listEl" class="relative overflow-auto" :style="{ height: listHeightPx + 'px' }"
                            @scroll="onScroll">
                            <!-- ✅ all selected => show message (no extra bottom space) -->
                            <div v-if="isAllSelected"
                                class="h-full flex items-center justify-center px-3 text-sm text-muted-foreground">
                                All items have been selected
                            </div>

                            <template v-else>
                                <div v-if="props.virtual" :style="{ height: totalHeight + 'px' }" />

                                <div :class="props.virtual ? 'absolute left-0 top-0 w-full' : ''"
                                    :style="props.virtual ? { transform: `translateY(${offsetTop}px)` } : undefined">
                                    <button v-for="(item, i) in visibleItems" :key="String(keyOf(item, startIndex + i))"
                                        type="button"
                                        class="w-full px-3 text-left text-sm flex items-center justify-between gap-3"
                                        :style="{ height: props.itemHeight + 'px' }"
                                        :disabled="props.disabled || isItemDisabledByMax(item)" :class="[
                                            isItemDisabledByMax(item)
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                                            isHighlighted(startIndex + i) ? 'bg-neutral-50 dark:bg-neutral-800/60' : '',
                                            isSelected(item) ? 'font-semibold' : 'font-normal',
                                        ]" @click="choose(item)">
                                        <span class="truncate">{{ getTitle(item) }}</span>
                                        <span v-if="isSelected(item)"
                                            class="text-primary-600 dark:text-primary-400">✓</span>
                                    </button>
                                </div>

                                <div v-if="filteredCount === 0"
                                    class="h-full flex items-center justify-center text-sm text-muted-foreground">
                                    <span v-if="isLoadingOptions">Loading data…</span>
                                    <span v-else>Tidak ada data</span>
                                </div>
                            </template>
                        </div>
                    </div>
                </Teleport>
            </div>

            <p v-if="hasError" class="text-xs text-destructive">
                {{ props.error }}
            </p>
        </template>
    </div>
</template>
