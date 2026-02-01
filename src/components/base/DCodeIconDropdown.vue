<script setup lang="ts">
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as LucideIcons from "lucide-vue-next"
import { ChevronDown, Loader2 } from "lucide-vue-next"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue"

defineOptions({ name: "DCodeIconDropdown" })

const props = withDefaults(
    defineProps<{
        modelValue: string | null | undefined
        label?: string
        placeholder?: string
        disabled?: boolean
        required?: boolean
        clearable?: boolean
        columns?: number
        maxHeight?: string
        iconSize?: number
        pageSize?: number
    }>(),
    {
        placeholder: "Pilih icon…",
        disabled: false,
        required: false,
        clearable: true,
        columns: 4,
        maxHeight: "335px",
        iconSize: 20,
        pageSize: 120,
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", v: string | null): void
    (e: "clear"): void
}>()

const lucide = LucideIcons as Record<string, any>

const rootEl = ref<HTMLElement | null>(null)
const nativeInput = ref<HTMLInputElement | null>(null)

const open = ref(false)

const selected = computed(() => (props.modelValue ?? "").trim() || "")

const query = ref("")

const suppressOpenOnce = ref(false)

const iconsReady = ref(false)
const iconsLoading = ref(false)
const iconNames = shallowRef<string[]>([])
const limit = ref(props.pageSize)

const EXCLUDE = new Set([
    "default",
    "createLucideIcon",
    "LucideIcon",
    "Icon",
    "icons",
    "toKebabCase",
    "camelCase",
    "children",
    "IconNode",
])

const ensureIconsLoaded = async () => {
    if (iconsReady.value || iconsLoading.value) return
    iconsLoading.value = true
    await new Promise((r) => setTimeout(r, 0))

    const keys = Object.keys(lucide)
        .filter((k) => !EXCLUDE.has(k))
        .filter((k) => /^[A-Z]/.test(k))
        .filter((k) => typeof lucide[k] === "function" || (typeof lucide[k] === "object" && lucide[k]))
        .sort((a, b) => a.localeCompare(b))

    iconNames.value = keys
    iconsReady.value = true
    iconsLoading.value = false
}

const SelectedIconComp = computed(() => {
    if (!iconsReady.value) return null
    if (!selected.value) return null
    if (!iconNames.value.includes(selected.value)) return null
    return lucide[selected.value]
})

const inputText = ref("")

watch(selected, (val) => {
    if (!open.value) {
        inputText.value = val
    }
})

const inputReadonly = computed(() => !!selected.value && !open.value)

const filtered = computed(() => {
    if (!iconsReady.value) return []
    const q = (query.value ?? "").trim().toLowerCase()
    
    if (!q) return iconNames.value
    return iconNames.value.filter((n) => n.toLowerCase().includes(q))
})

const displayed = computed(() => filtered.value.slice(0, limit.value))

watch(
    () => query.value,
    () => {
        limit.value = props.pageSize
    }
)

const gridColsClass = computed(() => {
    const c = props.columns
    if (c <= 2) return "grid-cols-2"
    if (c === 3) return "grid-cols-3"
    if (c === 4) return "grid-cols-4"
    if (c === 5) return "grid-cols-5"
    if (c >= 8) return "grid-cols-8"
    return "grid-cols-6"
})

const rightPaddingClass = computed(() => {
    if (!props.clearable) return "pr-3"
    return "pr-12"
})

const leftPaddingClass = computed(() => (SelectedIconComp.value && !open.value ? "pl-12" : "pl-3"))

const focusInput = async () => {
    await nextTick()
    nativeInput.value?.focus()
}

const openDropdown = async (arg?: boolean | Event) => {
    if (props.disabled) return
    const shouldReset = arg === false ? false : true

    if (suppressOpenOnce.value) {
        suppressOpenOnce.value = false
        return
    }

    open.value = true
    await ensureIconsLoaded()
    
    if (shouldReset) {
        query.value = ""
        inputText.value = ""
    }
    
    limit.value = props.pageSize
    await focusInput()
}

const closeDropdown = () => {
    open.value = false
    query.value = ""
    inputText.value = selected.value
    limit.value = props.pageSize
}

const toggleDropdown = async () => {
    if (props.disabled) return
    if (open.value) closeDropdown()
    else await openDropdown()
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const onInput = async (e: Event) => {
    if (props.disabled) return
    
    emit("update:modelValue", null)
    
    if (!open.value) await openDropdown(false)

    if (debounceTimer) clearTimeout(debounceTimer)
    const v = inputText.value
    debounceTimer = setTimeout(() => {
        query.value = v
    }, 300)
}

const selectIcon = (name: string) => {
    if (props.disabled) return
    emit("update:modelValue", name)
    closeDropdown() 
    queueMicrotask(() => nativeInput.value?.blur())
}

const onClear = () => {
    if (props.disabled) return
    emit("update:modelValue", null)
    emit("clear")

    suppressOpenOnce.value = true
    closeDropdown()

    queueMicrotask(() => nativeInput.value?.focus())
}

const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
        e.preventDefault()
        closeDropdown()
        return
    }

    if (e.key === "Enter" && open.value) {
        const first = filtered.value[0]
        if (first) {
            e.preventDefault()
            selectIcon(first)
        }
    }
}

const onClickOutside = (e: MouseEvent) => {
    if (!open.value) return
    const t = e.target as Node
    if (rootEl.value && !rootEl.value.contains(t)) closeDropdown()
}

const onDropdownScroll = (e: Event) => {
    const el = e.target as HTMLElement
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (!nearBottom) return
    if (limit.value < filtered.value.length) {
        limit.value = Math.min(limit.value + props.pageSize, filtered.value.length)
    }
}

onMounted(() => {
    document.addEventListener("mousedown", onClickOutside)
    queueMicrotask(() => {
        nativeInput.value = rootEl.value?.querySelector("input") ?? null
    })
})

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", onClickOutside)
    if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
    <div ref="rootEl" class="w-full">
        <Label v-if="props.label" class="text-sm font-medium mb-1 block">
            {{ props.label }}
            <span v-if="props.required" class="ml-1 text-destructive">*</span>
        </Label>

        <div class="relative w-full">
            <div v-if="SelectedIconComp && !open"
                class="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <component :is="SelectedIconComp" :size="18" />
            </div>

            <Input v-model="inputText" :readonly="inputReadonly" :disabled="props.disabled"
                :placeholder="props.placeholder"
                class="w-full h-10 rounded-lg border bg-white dark:bg-neutral-900 text-foreground dark:text-gray-300 border-gray-300 dark:border-gray-700"
                :class="[
                    rightPaddingClass,
                    leftPaddingClass,
                    inputReadonly ? 'cursor-pointer select-none' : '',
                ]" @click="openDropdown" @focus="openDropdown" @input="onInput" @keydown="onKeyDown" />

            <div v-if="props.clearable" class="absolute inset-y-0 right-4 flex items-center">
                <button v-if="selected" type="button" class="text-muted-foreground hover:text-foreground transition"
                    @mousedown.prevent @click="onClear" title="Clear">
                    ✕
                </button>

                <button v-else type="button" class="text-muted-foreground hover:text-foreground transition-transform"
                    @mousedown.prevent @click="toggleDropdown" title="Open">
                    <ChevronDown class="h-4 w-4" />
                </button>
            </div>

            <div v-if="open" class="absolute z-50 mt-1 w-full rounded-xl border bg-white dark:bg-neutral-900 shadow-lg">
                <div class="p-2 overflow-auto" :style="{ maxHeight: props.maxHeight }" @scroll="onDropdownScroll">
                    <div v-if="iconsLoading" class="flex items-center justify-center py-10 text-muted-foreground gap-2">
                        <Loader2 class="h-4 w-4 animate-spin" />
                        <span class="text-sm">Loading icons…</span>
                    </div>

                    <div v-else-if="iconsReady && filtered.length === 0"
                        class="text-sm text-muted-foreground text-center">
                        Icon tidak ditemukan
                    </div>

                    <div v-else class="grid gap-2" :class="gridColsClass">
                        <button v-for="name in displayed" :key="name" type="button"
                            class="group rounded-lg border p-2 hover:bg-muted/40 transition"
                            :class="selected === name ? 'ring-1 ring-primary' : ''" @click="selectIcon(name)"
                            :title="name">
                            <div class="flex flex-col items-center gap-1">
                                <component :is="lucide[name]" :size="props.iconSize" />
                                <span class="text-[10px] text-muted-foreground truncate w-full text-center">
                                    {{ name }}
                                </span>
                            </div>
                        </button>
                    </div>

                    <div v-if="iconsReady && filtered.length > 0"
                        class="pt-2 text-[11px] text-muted-foreground text-center">
                        Showing {{ displayed.length }} / {{ filtered.length }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>