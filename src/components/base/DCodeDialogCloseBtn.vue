<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import * as icons from "lucide-vue-next"

interface Props {
  /**
   * Nama icon dari lucide-vue-next
   * contoh: "X", "XCircle", "ChevronLeft"
   */
  icon?: string

  /**
   * ukuran icon (px)
   * contoh: "22" atau 22
   */
  iconSize?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  icon: "X",
  iconSize: 22,
})

const IconComp = computed(() => {
  return (icons as any)[props.icon] ?? (icons as any)["X"]
})
</script>

<template>
  <Button
    type="button"
    variant="secondary"
    size="icon"
    class="rounded-full shadow-sm"
  >
    <component :is="IconComp" :size="Number(iconSize)" />
  </Button>
</template>
