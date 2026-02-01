<template>
  <div class="dcode-card p-6 animate-slide-up" :style="{ animationDelay: `${delay}ms` }">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          {{ title }}
        </p>
        <p class="text-3xl font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {{ formattedValue }}
        </p>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" :class="[
            trend >= 0
              ? 'bg-success-100 text-success-700'
              : 'bg-danger-100 text-danger-700'
          ]">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              :class="{ 'rotate-180': trend < 0 }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {{ Math.abs(trend) }}%
          </span>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">
            vs bulan lalu
          </span>
        </div>
      </div>

      <div class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" :class="iconBgClass">
        <div v-html="icon" class="w-7 h-7" :class="iconColorClass"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '@/utils/helpers'
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  trend: number
  icon: string
  type?: 'primary' | 'success' | 'warning' | 'info'
  format?: 'currency' | 'number'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  format: 'number',
  delay: 0
})

const formattedValue = computed(() => {
  if (props.format === 'currency') {
    return formatCurrency(props.value)
  }
  return props.value.toLocaleString('id-ID')
})

const iconBgClass = computed(() => {
  const classes = {
    primary: 'bg-primary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    info: 'bg-secondary-100'
  }
  return classes[props.type]
})

const iconColorClass = computed(() => {
  const classes = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    info: 'text-secondary-600'
  }
  return classes[props.type]
})
</script>
