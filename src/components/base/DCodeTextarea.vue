<script lang="ts" setup>
import { Label } from "@/components/ui/label"
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue"

defineOptions({ name: "DCodeTextarea", inheritAttrs: false })

const attrs = useAttrs()

type TextCaseMode =
  | "none"
  | "uppercase"
  | "lowercase"
  | "titlecase"
  | "sentencecase"

type ValueType = "free" | "number" | "letter" | "letternumber"

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | null): void
  (e: "clear"): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined

    clearable?: boolean
    hideClearWhenEmpty?: boolean

    textCase?: TextCaseMode
    applyTextCaseToValue?: boolean

    valueType?: ValueType
    allowSpaces?: boolean

    allowChars?: string | string[]

    pattern?: RegExp

    visible?: boolean
    skeleton?: boolean

    showCharCount?: boolean
    returnNumber?: boolean

    error?: string | null
  }>(),
  {
    hideClearWhenEmpty: true,
    textCase: "none",
    applyTextCaseToValue: true,
    valueType: "free",
    allowSpaces: true,
    visible: true,
    skeleton: false,
    showCharCount: true,
    returnNumber: false,
    error: null,
  }
)

const label = computed(() => attrs.label as string | undefined)
const isVisible = computed(() => (props.visible !== undefined ? props.visible : true))

const uid = Math.random().toString(36).slice(2, 7)
const elementId = computed(() => {
  const token = (attrs.id as string | undefined) || label.value || "field"
  return `app-textarea-${token}-${uid}`
})

const isRequired = computed(() => {
  const req = (attrs as any).required
  const ariaReq = (attrs as any)["aria-required"]
  const requiredByAttr = req === "" || req === true || req === "true"
  const requiredByAria = ariaReq === "true" || ariaReq === true
  return requiredByAttr || requiredByAria
})

const textareaAttrs = computed(() => {
  const {
    label: _label,
    class: _class,
    id: _id,
    required: _required,
    "aria-required": _ariaRequired,
    ...rest
  } = attrs as Record<string, any>
  return rest
})

const maxLen = computed(() => {
  const ml = (attrs as any).maxlength
  const n =
    typeof ml === "number"
      ? ml
      : typeof ml === "string"
        ? parseInt(ml, 10)
        : NaN
  return Number.isFinite(n) && n > 0 ? n : -1
})

const clampByMaxLength = (val: string) => {
  return maxLen.value > 0 ? val.slice(0, maxLen.value) : val
}

const isEmpty = computed(() => {
  const v = props.modelValue
  return v === null || v === undefined || String(v).length === 0
})

const showClear = computed(() => {
  if (!props.clearable) return false
  if (!props.hideClearWhenEmpty) return true
  return !isEmpty.value
})

const localValue = ref(String(props.modelValue ?? ""))

watch(
  () => props.modelValue,
  (v) => {
    const nv = String(v ?? "")
    if (nv !== localValue.value) localValue.value = nv
  }
)

const isComposing = ref(false)
const isMutatingDom = ref(false)

const toTitleCase = (s: string) =>
  s
    .split(/(\s+)/)
    .map((part) => {
      if (part.trim() === "") return part
      const lower = part.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join("")

const toSentenceCase = (s: string) => {
  const t = s.toLowerCase()
  const idx = t.search(/\p{L}/u)
  if (idx < 0) return t
  return t.slice(0, idx) + t.charAt(idx).toUpperCase() + t.slice(idx + 1)
}

const applyCase = (s: string) => {
  switch (props.textCase) {
    case "uppercase":
      return s.toUpperCase()
    case "lowercase":
      return s.toLowerCase()
    case "titlecase":
      return toTitleCase(s)
    case "sentencecase":
      return toSentenceCase(s)
    case "none":
    default:
      return s
  }
}

const cssTextTransform = computed(() => {
  switch (props.textCase) {
    case "uppercase":
      return "uppercase"
    case "lowercase":
      return "lowercase"
    default:
      return "none"
  }
})

const toCharSet = (v?: string | string[]) => {
  if (!v) return null
  const str = Array.isArray(v) ? v.join("") : v
  if (!str) return null
  return new Set([...str])
}
const allowSet = computed(() => toCharSet(props.allowChars))

const testChar = (re: RegExp, ch: string) => {
  re.lastIndex = 0
  return re.test(ch)
}

const isAllowedByValueTypeChar = (ch: string) => {
  if (ch === "\n") return props.valueType !== "number"

  if (props.valueType === "free") return true

  const isSpace = ch === " "
  const isDigit = /[0-9]/.test(ch)
  const isLetter = /\p{L}/u.test(ch)
  const isNum = /\p{N}/u.test(ch)

  if (props.valueType === "number") return isDigit

  if (props.valueType === "letter") {
    return isLetter || (props.allowSpaces && isSpace)
  }

  if (props.valueType === "letternumber") {
    return isLetter || isNum || (props.allowSpaces && isSpace)
  }

  return true
}

const applyCharRestrictions = (s: string) => {
  let out = ""
  for (const ch of s) {
    const extraAllowed = !!allowSet.value && allowSet.value.has(ch)
    if (props.pattern && !extraAllowed && !testChar(props.pattern, ch)) continue
    if (!extraAllowed && !isAllowedByValueTypeChar(ch)) continue

    out += ch
  }
  return out
}

const normalize = (raw: string) => {
  const a = applyCharRestrictions(raw)
  const b = props.applyTextCaseToValue ? applyCase(a) : a
  return clampByMaxLength(b)
}

let domEl: HTMLTextAreaElement | null = null

const toEmittedValue = (s: string): string | number | null => {
  if (s === "") return null

  if (props.valueType === "number" && props.returnNumber) {
    const stripped = s.replace(/\n/g, "")
    const n = Number(stripped)
    return Number.isFinite(n) ? n : null
  }

  return s
}

const setValue = (nextVal: string) => {
  localValue.value = nextVal
  emit("update:modelValue", toEmittedValue(nextVal))
}

const replaceDomValue = (el: HTMLTextAreaElement, nextVal: string) => {
  const v = clampByMaxLength(nextVal)

  isMutatingDom.value = true
  el.value = v
  setValue(v)
  queueMicrotask(() => (isMutatingDom.value = false))
}

const insertAtCursor = (el: HTMLTextAreaElement, text: string) => {
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length

  if (maxLen.value > 0) {
    const currentAfterReplace = el.value.length - (end - start)
    const remaining = maxLen.value - currentAfterReplace
    if (remaining <= 0) return
    text = text.slice(0, remaining)
  }

  el.setRangeText(text, start, end, "end")
  replaceDomValue(el, normalize(el.value))
}

const onBeforeInput = (e: InputEvent) => {
  if (!domEl) return
  if (isComposing.value) return
  if (isMutatingDom.value) return

  if (!e.inputType?.startsWith("insert")) return

  const data = (e as any).data as string | null
  if (data == null) return

  const cleaned = normalize(data)
  if (cleaned === data) return

  e.preventDefault()
  if (cleaned.length > 0) insertAtCursor(domEl, cleaned)
}

const onPaste = (e: ClipboardEvent) => {
  if (!domEl) return
  if (isComposing.value) return
  if (isMutatingDom.value) return

  const text = e.clipboardData?.getData("text") ?? ""
  const cleaned = normalize(text)

  if (cleaned !== text) {
    e.preventDefault()
    if (cleaned.length > 0) insertAtCursor(domEl, cleaned)
  }
}

const onInput = async (e: Event) => {
  if (!domEl) return
  if (isComposing.value) return
  if (isMutatingDom.value) return

  const el = e.target as HTMLTextAreaElement
  const raw = el.value ?? ""
  const nextVal = normalize(raw)

  if (nextVal !== raw) {
    const start = el.selectionStart ?? nextVal.length
    const end = el.selectionEnd ?? nextVal.length
    replaceDomValue(el, nextVal)
    await nextTick()
    try {
      el.setSelectionRange(start, end)
    } catch { }
  } else {
    setValue(nextVal)
  }
}

const onCompStart = () => (isComposing.value = true)
const onCompEnd = () => {
  isComposing.value = false
  if (!domEl) return
  const raw = domEl.value ?? ""
  const nextVal = normalize(raw)
  if (nextVal !== raw) replaceDomValue(domEl, nextVal)
  else setValue(nextVal)
}

onMounted(() => {
  domEl = document.getElementById(elementId.value) as HTMLTextAreaElement | null
  if (!domEl) return

  domEl.addEventListener("beforeinput", onBeforeInput as any)
  domEl.addEventListener("paste", onPaste)
  domEl.addEventListener("input", onInput)
  domEl.addEventListener("compositionstart", onCompStart)
  domEl.addEventListener("compositionend", onCompEnd)

  const raw = domEl.value ?? ""
  const nextVal = normalize(raw)
  if (nextVal !== raw) replaceDomValue(domEl, nextVal)
  else setValue(nextVal)
})

onBeforeUnmount(() => {
  if (!domEl) return
  domEl.removeEventListener("beforeinput", onBeforeInput as any)
  domEl.removeEventListener("paste", onPaste)
  domEl.removeEventListener("input", onInput)
  domEl.removeEventListener("compositionstart", onCompStart)
  domEl.removeEventListener("compositionend", onCompEnd)
  domEl = null
})

const handleClear = () => {
  localValue.value = ""
  if (domEl) domEl.value = ""
  emit("update:modelValue", null)
  emit("clear")
}

const currentLength = computed(() => localValue.value.length)
const showCounter = computed(() => {
  if (!props.showCharCount) return false
  return maxLen.value > 0
})
const showCounterFocus = computed(() => showCounter.value && currentLength.value > 0)
const counterText = computed(() => `${currentLength.value} / ${maxLen.value}`)

const hasError = computed(() => !!props.error)

const rows = computed(() => {
  const r = (attrs as any).rows
  const n = typeof r === "number" ? r : parseInt(String(r ?? ""), 10)
  return Number.isFinite(n) && n > 0 ? n : 3
})
const skeletonStyle = computed(() => {
  const h = rows.value * 24 + 16
  return { height: `${h}px` }
})
</script>

<template>
  <div v-show="isVisible" class="flex flex-col gap-1 w-full" :class="attrs.class" :aria-busy="props.skeleton">
    <template v-if="props.skeleton">
      <div v-if="label" class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div class="w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" :style="skeletonStyle" />
    </template>

    <template v-else>
      <Label v-if="label" :for="elementId" class="text-sm font-medium">
        {{ label }}
        <span v-if="isRequired" class="ml-1 text-destructive">*</span>
      </Label>

      <div class="relative w-full group">
        <textarea :id="elementId" :value="localValue" v-bind="textareaAttrs"
          :style="{ textTransform: cssTextTransform }"
          class="flex min-h-[120px] w-full pr-10 rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900 text-foreground dark:text-gray-300 border-gray-300 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          :class="hasError ? 'border-destructive focus-visible:ring-destructive' : ''" />

        <div v-if="showClear" class="absolute top-1 right-2">
          <button type="button" class="text-muted-foreground hover:text-foreground text-sm leading-none"
            aria-label="Clear textarea" @click="handleClear">
            ✕
          </button>
        </div>

        <!-- counter ala TextField -->
        <p v-if="showCounterFocus && !hasError" class="absolute top-full right-0 z-10
                 text-[11px] text-gray-500 dark:text-gray-400
                 opacity-0 transition-opacity pointer-events-none
                 group-focus-within:opacity-100">
          {{ counterText }}
        </p>
      </div>

      <p v-if="hasError" class="text-xs text-destructive">
        {{ props.error }}
      </p>
    </template>
  </div>
</template>
