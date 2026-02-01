<script setup lang="ts">
import { computed } from 'vue'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Check, X } from 'lucide-vue-next'

interface Props {
  modelValue?: boolean
  label?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  loading?: boolean
  labelPosition?: 'left' | 'right'
  id?: string
  name?: string
  required?: boolean
  showTooltip?: boolean
  tooltipActiveText?: string
  tooltipInactiveText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
  disabled: false,
  size: 'medium',
  color: 'primary',
  loading: false,
  labelPosition: 'right',
  required: false,
  showTooltip: false,
  tooltipActiveText: 'Aktif',
  tooltipInactiveText: 'Tidak Aktif'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'change': [value: boolean]
}>()

const isChecked = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (!props.disabled && !props.loading) {
      emit('update:modelValue', value)
      emit('change', value)
    }
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-9 h-5'
    case 'large':
      return 'w-14 h-7'
    default:
      return 'w-11 h-6'
  }
})

const dotSizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-4 h-4'
    case 'large':
      return 'w-6 h-6'
    default:
      return 'w-5 h-5'
  }
})

const translateClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'translate-x-4'
    case 'large':
      return 'translate-x-7'
    default:
      return 'translate-x-5'
  }
})

const colorClasses = computed(() => {
  if (props.disabled) {
    return 'bg-gray-300'
  }

  if (!isChecked.value) {
    return 'bg-gray-200'
  }

  switch (props.color) {
    case 'success':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'danger':
      return 'bg-red-500'
    default:
      return 'bg-blue-500'
  }
})

const handleToggle = () => {
  isChecked.value = !isChecked.value
}

const tooltipText = computed(() => {
  return isChecked.value ? props.tooltipActiveText : props.tooltipInactiveText
})
</script>

<template>
  <div class="inline-flex items-center gap-3">
    <label
      v-if="label && labelPosition === 'left'"
      :for="id"
      class="text-sm font-medium text-gray-700 cursor-pointer"
      :class="{ 'opacity-50': disabled }"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <TooltipProvider>
      <Tooltip v-if="showTooltip" :delay-duration="200">
        <TooltipTrigger as-child>
          <button
            type="button"
            :id="id"
            :name="name"
            role="switch"
            :aria-checked="isChecked"
            :aria-label="label || 'Toggle switch'"
            :disabled="disabled || loading"
            :class="[
              sizeClasses,
              colorClasses,
              'relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              'hover:scale-105 active:scale-95',
              {
                'cursor-not-allowed opacity-50': disabled,
                'cursor-wait': loading,
                'cursor-pointer': !disabled && !loading
              }
            ]"
            @click="handleToggle"
          >
            <span
              :class="[
                dotSizeClasses,
                isChecked ? translateClasses : 'translate-x-0.5',
                'inline-block transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out',
                'hover:shadow-xl flex items-center justify-center'
              ]"
            >
              <span
                v-if="loading"
                class="absolute inset-0 flex items-center justify-center"
              >
                <svg
                  class="animate-spin h-3 w-3 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>

              <!-- Icon for checked/unchecked state -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="scale-0 rotate-90 opacity-0"
                enter-to-class="scale-100 rotate-0 opacity-100"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="scale-100 rotate-0 opacity-100"
                leave-to-class="scale-0 -rotate-90 opacity-0"
              >
                <Check
                  v-if="isChecked && !loading"
                  :class="[
                    size === 'small' ? 'w-2.5 h-2.5' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3',
                    'text-green-600 stroke-[3]'
                  ]"
                />
                <X
                  v-else-if="!isChecked && !loading"
                  :class="[
                    size === 'small' ? 'w-2.5 h-2.5' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3',
                    'text-gray-400 stroke-[3]'
                  ]"
                />
              </Transition>
            </span>
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          :side-offset="8"
          class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 px-3 py-2 rounded-lg text-sm font-medium shadow-xl border-0"
          :class="[
            isChecked
              ? 'bg-green-600 dark:bg-green-500 text-white'
              : 'bg-gray-700 dark:bg-gray-600 text-white'
          ]"
        >
          <span class="relative z-10 flex items-center gap-2">
            <span
              class="inline-block w-2 h-2 rounded-full animate-pulse"
              :class="isChecked ? 'bg-green-200' : 'bg-gray-300'"
            />
            {{ tooltipText }}
          </span>
        </TooltipContent>
      </Tooltip>

      <!-- Without tooltip -->
      <button
        v-else
        type="button"
        :id="id"
        :name="name"
        role="switch"
        :aria-checked="isChecked"
        :aria-label="label || 'Toggle switch'"
        :disabled="disabled || loading"
        :class="[
          sizeClasses,
          colorClasses,
          'relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'hover:scale-105 active:scale-95',
          {
            'cursor-not-allowed opacity-50': disabled,
            'cursor-wait': loading,
            'cursor-pointer': !disabled && !loading
          }
        ]"
        @click="handleToggle"
      >
        <span
          :class="[
            dotSizeClasses,
            isChecked ? translateClasses : 'translate-x-0.5',
            'inline-block transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out',
            'hover:shadow-xl flex items-center justify-center'
          ]"
        >
          <span
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center"
          >
            <svg
              class="animate-spin h-3 w-3 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>

          <!-- Icon for checked/unchecked state -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="scale-0 rotate-90 opacity-0"
            enter-to-class="scale-100 rotate-0 opacity-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="scale-100 rotate-0 opacity-100"
            leave-to-class="scale-0 -rotate-90 opacity-0"
          >
            <Check
              v-if="isChecked && !loading"
              :class="[
                size === 'small' ? 'w-2.5 h-2.5' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3',
                'text-green-600 stroke-[3]'
              ]"
            />
            <X
              v-else-if="!isChecked && !loading"
              :class="[
                size === 'small' ? 'w-2.5 h-2.5' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3',
                'text-gray-400 stroke-[3]'
              ]"
            />
          </Transition>
        </span>
      </button>
    </TooltipProvider>

    <label
      v-if="label && labelPosition === 'right'"
      :for="id"
      class="text-sm font-medium text-gray-700 cursor-pointer"
      :class="{ 'opacity-50': disabled }"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
  </div>
</template>
