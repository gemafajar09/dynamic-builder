<script setup lang="ts">
import { inject } from 'vue';

// Inject context dari parent TabWizard
const context = inject('tabWizardContext', {}) as any

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
        {{ title }}
      </h3>
      <p v-if="description" class="text-neutral-600 dark:text-neutral-400">
        {{ description }}
      </p>
    </div>

    <!-- Context info (untuk debugging) -->
    <div class="text-xs text-neutral-500 dark:text-neutral-500 mt-4">
      Current Step: {{ context.currentStep }} | Total Steps: {{ context.steps?.length }}
    </div>

    <!-- Slot untuk child content -->
    <slot />
  </div>
</template>
