<script setup lang="ts">
import { computed, useAttrs } from "vue";

// shadcn-vue dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";

// shadcn-vue button (opsional, dipakai di slot actions biasanya)

// lucide icon (sesuai dependencies kamu)
import * as icons from "lucide-vue-next";
import DCodeCard from "./DCodeCard.vue";

defineOptions({
  name: "DCodeDialog",
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    icon?: string // nama icon lucide, contoh: "CircleAlert", "Info", "X", "Shield"
    maxWidth?: string | number
    persistent?: boolean
    contentClass?: string
    contentStyle?: Record<string, any> | string
  }>(),
  {
    modelValue: false,
    title: "",
    icon: "",
    maxWidth: 500,
    persistent: true,
    contentClass: "p-5",
    contentStyle: () => ({}),
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void
}>()

const attrs = useAttrs()
const filteredAttrs = computed(() => {
  const { style, ...rest } = attrs
  return rest
})

const widthStyle = computed(() => {
  const mw =
    typeof props.maxWidth === "number" ? `${props.maxWidth}px` : props.maxWidth
  return { maxWidth: mw, width: "100%" }
})

// resolve lucide icon by string name
const IconComp = computed(() => {
  if (!props.icon) return null
  return (icons as any)[props.icon] ?? null
})

const onOpenChange = (open: boolean) => {
  // kalau persistent, cegah close (overlay click / esc)
  if (!open && props.persistent) {
    emit("update:modelValue", true)
    return
  }
  emit("update:modelValue", open)
}
</script>

<template>
  <Dialog :open="modelValue" @update:open="onOpenChange">
    <DialogContent v-bind="filteredAttrs" :style="widthStyle" class="p-0 overflow-hidden rounded-xl"
      @interact-outside="persistent ? $event.preventDefault() : null"
      @escape-key-down="persistent ? $event.preventDefault() : null">
      <!-- Content Wrapper -->
      <DCodeCard :padding="contentClass" border shadow class="w-full !rounded-xl !border-0" :level="1">
        <template #header>
          <div class="flex items-center gap-3">
            <component v-if="IconComp" :is="IconComp" class="h-5 w-5" />
            <DialogTitle class="text-base font-medium">
              {{ title }}
            </DialogTitle>
            <DialogDescription class="hidden">
              {{ title || 'Dialog Content' }}
            </DialogDescription>
          </div>
        </template>

        <template #actions>
          <slot name="header-append" />
        </template>

        <!-- Body -->
        <div :style="contentStyle">
          <slot />
        </div>

        <!-- Footer / Actions -->
        <template #footer v-if="$slots.actions">
          <div class="flex justify-end gap-3">
            <slot name="actions" />
          </div>
        </template>
      </DCodeCard>
    </DialogContent>
  </Dialog>
</template>
