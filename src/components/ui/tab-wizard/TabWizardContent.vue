<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  animation?: 'slide' | 'fade' | 'scale'
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animation: 'slide',
  isActive: true,
})

// Inject context dari parent TabWizard
const tabWizardContext = inject('tabWizardContext', {}) as any
</script>

<template>
  <div
    :class="
      cn(
        'transition-all duration-500 ease-out',
        {
          'animate-in fade-in slide-in-from-right-4': props.animation === 'slide' && props.isActive,
          'animate-in fade-in': props.animation === 'fade' && props.isActive,
          'animate-in fade-in zoom-in-95': props.animation === 'scale' && props.isActive,
          'animate-out fade-out slide-out-to-left-4': props.animation === 'slide' && !props.isActive,
          'animate-out fade-out': props.animation === 'fade' && !props.isActive,
          'animate-out fade-out zoom-out-95': props.animation === 'scale' && !props.isActive,
          'hidden': !props.isActive,
        },
        props.class
      )
    "
  >
    <!-- Pass parent context ke slot -->
    <slot :context="tabWizardContext" />
  </div>
</template>
