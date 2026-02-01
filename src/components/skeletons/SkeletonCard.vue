<template>
  <div class="dcode-card p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Skeleton shape="circle" :width="48" :height="48" />
      <div class="flex-1 space-y-2">
        <Skeleton :width="'60%'" :height="16" />
        <Skeleton :width="'40%'" :height="12" />
      </div>
    </div>

    <!-- Content Lines -->
    <div class="space-y-2">
      <Skeleton v-for="i in lines" :key="i" :width="i === lines ? '70%' : '100%'" :height="12" />
    </div>

    <!-- Footer (optional) -->
    <div v-if="showFooter" class="flex gap-3 pt-2">
      <Skeleton :width="100" :height="36" rounded="0.5rem" />
      <Skeleton :width="100" :height="36" rounded="0.5rem" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from './Skeleton.vue';

interface Props {
  lines?: number
  showFooter?: boolean
}

withDefaults(defineProps<Props>(), {
  lines: 3,
  showFooter: false
})
</script>
