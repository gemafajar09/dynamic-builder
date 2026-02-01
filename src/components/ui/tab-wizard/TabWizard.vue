<script setup lang="ts">
import { cn } from '@/lib/utils'
import { AlertCircle, BarChart3, Bell, Check, CheckCircle, FileText, Home, Mail, MapPin, Package, Phone, Settings, User } from 'lucide-vue-next'
import { computed, provide } from 'vue'

export interface TabWizardStep {
  id: string
  label: string
  icon?: string
  description?: string
  status?: 'pending' | 'completed' | 'active' | 'error'
  disabled?: boolean
}

interface Props {
  steps: TabWizardStep[]
  modelValue?: number | string
  class?: string
  showIcons?: boolean
  showDescription?: boolean
  variant?: 'line' | 'dot' | 'card'
  animationType?: 'slide' | 'fade' | 'scale'
  [key: string]: any  // Allow additional props to be passed to children
}

interface Emits {
  (e: 'update:modelValue', value: number | string): void
  (e: 'change', step: TabWizardStep, index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  showIcons: true,
  showDescription: true,
  variant: 'line',
  animationType: 'slide',
})

const emit = defineEmits<Emits>()

const currentStep = computed({
  get: () => {
    if (typeof props.modelValue === 'number') return props.modelValue
    return props.steps.findIndex(s => s.id === props.modelValue)
  },
  set: (index: number) => {
    if (typeof props.modelValue === 'number') {
      emit('update:modelValue', index)
    } else {
      emit('update:modelValue', props.steps[index].id)
    }
  },
})

const handleStepClick = (index: number, step: TabWizardStep) => {
  if (!step.disabled) {
    currentStep.value = index
    emit('change', step, index)
  }
}

const getStepStatus = (index: number, step: TabWizardStep) => {
  if (step.status) return step.status
  if (index < currentStep.value) return 'completed'
  if (index === currentStep.value) return 'active'
  return 'pending'
}

const getStepClasses = (index: number, step: TabWizardStep) => {
  const status = getStepStatus(index, step)
  const baseClasses = 'relative flex flex-col items-center cursor-pointer transition-all duration-300'

  const statusClasses = {
    completed: 'text-success-600 dark:text-success-400',
    active: 'text-primary-600 dark:text-primary-400',
    error: 'text-red-600 dark:text-red-400',
    pending: 'text-neutral-400 dark:text-neutral-600',
  }

  return cn(baseClasses, statusClasses[status], {
    'opacity-50 cursor-not-allowed': step.disabled,
  })
}

const getIndicatorClasses = (index: number, step: TabWizardStep) => {
  const status = getStepStatus(index, step)

  const baseClasses =
    'w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all duration-500 relative'

  const statusClasses = {
    completed:
      'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 scale-100',
    active:
      'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 scale-110 shadow-lg shadow-primary-500/30',
    error: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 scale-100',
    pending: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 scale-100',
  }

  return cn(baseClasses, statusClasses[status], {
    'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950 ring-primary-500':
      status === 'active',
  })
}

const getConnectionLineClasses = (index: number) => {
  const isCompleted = index < currentStep.value
  const isPartial = index === currentStep.value - 1

  return cn(
    'absolute top-6 h-1 transition-all duration-500 ease-out',
    {
      'bg-success-400 dark:bg-success-500': isCompleted,
      'bg-gradient-to-r from-success-400 to-neutral-300 dark:from-success-500 dark:to-neutral-600':
        isPartial,
      'bg-neutral-300 dark:bg-neutral-600': !isCompleted && !isPartial,
    }
  )
}

const iconMap: Record<string, any> = {
  'user': User,
  'mail': Mail,
  'map-pin': MapPin,
  'check-circle': CheckCircle,
  'phone': Phone,
  'home': Home,
  'file-text': FileText,
  'package': Package,
  'settings': Settings,
  'bell': Bell,
  'bar-chart': BarChart3,
}

// Provide context untuk child components
provide('tabWizardContext', {
  currentStep,
  ...props, // Pass semua props ke children
})
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <!-- Wizard Header -->
    <div class="w-full">
      <!-- Steps Container -->
      <div class="relative flex items-center justify-between w-full px-2">
        <!-- Connection Lines -->
        <template v-if="steps.length > 1">
          <div v-for="(step, index) in steps.slice(0, -1)" :key="`line-${index}`"
            :class="getConnectionLineClasses(index)" :style="{
              width: `calc((100% - ${steps.length * 48}px) / ${steps.length - 1} + 24px)`,
              left: `calc(${index} * (100% - ${(steps.length - 1) * 48}px) / ${steps.length - 1} + 24px)`,
            }" />
        </template>

        <!-- Steps -->
        <div v-for="(step, index) in steps" :key="step.id" :class="getStepClasses(index, step)"
          @click="handleStepClick(index, step)">
          <!-- Indicator -->
          <div :class="getIndicatorClasses(index, step)">
            <!-- Checkmark for completed -->
            <Check v-if="getStepStatus(index, step) === 'completed'" class="w-6 h-6" stroke-width="3" />

            <!-- Error Icon -->
            <AlertCircle v-else-if="getStepStatus(index, step) === 'error'" class="w-6 h-6" stroke-width="2" />

            <!-- Custom Icon or Step Number -->
            <template v-else-if="step.icon && iconMap[step.icon]">
              <component :is="iconMap[step.icon]" class="w-6 h-6" />
            </template>
            <span v-else class="text-lg font-medium">
              {{ index + 1 }}
            </span>

            <!-- Pulse Animation for Active Step -->
            <div v-if="getStepStatus(index, step) === 'active'"
              class="absolute inset-0 rounded-full animate-pulse bg-primary-500/20" />
          </div>

          <!-- Step Label -->
          <div class="mt-3 text-center">
            <p :class="cn('text-sm font-medium transition-colors duration-300', {
              'font-semibold': getStepStatus(index, step) === 'active',
            })
              ">
              {{ step.label }}
            </p>

            <!-- Description -->
            <p v-if="showDescription && step.description"
              class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[100px]">
              {{ step.description }}
            </p>

            <!-- Status Badge -->
            <div v-if="getStepStatus(index, step) !== 'pending' && getStepStatus(index, step) !== 'active'" :class="cn('mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full', {
              'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300':
                getStepStatus(index, step) === 'completed',
              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300':
                getStepStatus(index, step) === 'error',
            })
              ">
              {{ getStepStatus(index, step) === 'completed' ? '✓' : '!' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Slot -->
    <div class="mt-8">
      <slot :current-step="steps[currentStep]" :current-index="currentStep" :props="props" />
    </div>
  </div>
</template>

<style scoped>
/* Smooth animations for transitions */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
