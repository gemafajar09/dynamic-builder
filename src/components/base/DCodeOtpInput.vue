<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { computed, nextTick, ref, watch } from "vue";

defineOptions({ name: "DCodeOtpInput" });

interface Props {
  totalInput?: number;
  default?: string;
  label?: string;
}

interface Emit {
  (e: "updateOtp", val: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  totalInput: 6,
  default: "",
  label: "",
});

const emit = defineEmits<Emit>();

// simpan DOM input (HTMLInputElement) untuk focus control
const inputRefs = ref<(HTMLInputElement | null)[]>([]);
const digits = ref<string[]>([]);

// Fallback logic: if totalInput is falsy (0, null, etc) or < 1, defaults to 6
const inputCount = computed(() => {
  const n = Number(props.totalInput);
  return n && n > 0 ? n : 6;
});

const resetDigits = () => {
  digits.value = Array.from(
    { length: inputCount.value },
    (_, i) => props.default?.[i] ?? "",
  );
  emit("updateOtp", digits.value.join(""));
};

resetDigits();

watch(
  () => [props.totalInput, props.default],
  () => resetDigits(),
);

const focusAt = (idx: number) => {
  if (idx < 0 || idx >= inputCount.value) return;
  nextTick(() => inputRefs.value[idx]?.focus());
};

// Allow alphanumeric (A-Z, 0-9)
const sanitizeDigit = (v: string) => {
  return v.match(/[a-zA-Z0-9]/) ? v.match(/[a-zA-Z0-9]/)![0] : "";
};

const setDigit = (idx: number, v: string) => {
  digits.value[idx] = sanitizeDigit(v);
  emit("updateOtp", digits.value.join(""));
};

const handleKeyDown = (e: KeyboardEvent, idx: number) => {
  const key = e.key;
  const isDigit = /^[0-9]$/.test(key);
  const isLetter = /^[a-zA-Z]$/.test(key);

  if (key === "Backspace") {
    e.preventDefault();
    if (digits.value[idx]) {
      setDigit(idx, "");
      return;
    }
    if (idx > 0) {
      setDigit(idx - 1, "");
      focusAt(idx - 1);
    }
    return;
  }

  if (key === "ArrowLeft") {
    e.preventDefault();
    focusAt(idx - 1);
    return;
  }

  if (key === "ArrowRight") {
    e.preventDefault();
    focusAt(idx + 1);
    return;
  }

  if (isDigit || isLetter) {
    e.preventDefault();
    setDigit(idx, key);
    if (idx < inputCount.value - 1) focusAt(idx + 1);
    return;
  }

  // blok karakter lain (biar ga “tembus”)
  if (key.length === 1) e.preventDefault();
};

const handleInput = (e: Event, idx: number) => {
  const el = e.target as HTMLInputElement;
  const raw = el.value ?? "";
  const d = sanitizeDigit(raw);

  // paksa DOM cuma 1 digit angka
  el.value = d;
  setDigit(idx, d);

  if (d && idx < inputCount.value - 1) focusAt(idx + 1);
};

const handlePaste = (e: ClipboardEvent, idx: number) => {
  e.preventDefault();
  const text = e.clipboardData?.getData("text") ?? "";
  const cleanText = text.replace(/[^a-zA-Z0-9]/g, ""); // Alphanumeric only
  if (!cleanText) return;

  let cursor = idx;
  for (const ch of cleanText) {
    if (cursor >= inputCount.value) break;
    digits.value[cursor] = ch;
    cursor++;
  }
  emit("updateOtp", digits.value.join(""));
  focusAt(Math.min(cursor, inputCount.value - 1));
};

// NOTE: ref ke <Input> adalah component instance, tapi root-nya <input>,
// jadi kita ambil .$el sebagai HTMLInputElement
const bindInputRef = (index: number) => (comp: any) => {
  const el = (comp?.$el ?? null) as HTMLInputElement | null;
  inputRefs.value[index] = el;
};
</script>

<template>
  <div class="space-y-3">
    <!-- Header restored with label usage -->
    <h6 class="text-lg font-medium" v-if="props.label || inputCount">
      {{ props.label || `Type your ${inputCount} digit security code` }}
    </h6>

    <div class="flex flex-wrap items-center gap-2 sm:gap-4">
      <Input
        v-for="i in inputCount"
        :key="i"
        :ref="bindInputRef(i - 1)"
        :value="digits[i - 1] || ''"
        type="text"
        maxlength="1"
        autocomplete="one-time-code"
        aria-label="OTP digit"
        class="flex-1 w-auto min-w-8 max-w-14 aspect-square h-auto p-0 text-center text-lg sm:text-xl font-medium"
        @keydown="handleKeyDown($event, i - 1)"
        @input="handleInput($event, i - 1)"
        @paste="handlePaste($event, i - 1)"
      />
    </div>
  </div>
</template>
