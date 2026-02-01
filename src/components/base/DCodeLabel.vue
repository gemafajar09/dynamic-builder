<template>
  <span
    :class="[
      'inline-flex items-center font-medium transition-all duration-200',
      sizeClasses,
      variantClasses,
      roundedClasses,
      { 'gap-1.5': $slots.icon || icon || closable },
      { 'cursor-pointer hover:shadow-md': clickable },
      customClass
    ]"
    @click="handleClick"
  >
    <!-- Icon Slot (Optional) -->
    <span v-if="$slots.icon || icon" :class="iconSizeClasses">
      <slot name="icon">
        <component v-if="icon" :is="icon" />
      </slot>
    </span>

    <!-- Label Text -->
    <span class="leading-none">
      <slot>{{ text }}</slot>
    </span>

    <!-- Close Button (Optional) -->
    <button
      v-if="closable"
      type="button"
      :class="['hover:opacity-70 transition-opacity', iconSizeClasses]"
      @click.stop="handleClose"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  icon?: any
  closable?: boolean
  clickable?: boolean
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  variant: 'primary',
  size: 'md',
  rounded: 'md',
  closable: false,
  clickable: false,
  customClass: ''
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  close: []
}>()

// Size Classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  return sizes[props.size]
})

// Icon Size Classes
const iconSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  return sizes[props.size]
})

// Variant Classes
const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-blue-500 text-white shadow-sm hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white shadow-sm hover:bg-gray-600',
    success: 'bg-green-500 text-white shadow-sm hover:bg-green-600',
    warning: 'bg-yellow-500 text-white shadow-sm hover:bg-yellow-600',
    danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
    info: 'bg-cyan-500 text-white shadow-sm hover:bg-cyan-600',
    dark: 'bg-gray-800 text-white shadow-sm hover:bg-gray-900',
    light: 'bg-gray-100 text-gray-800 shadow-sm hover:bg-gray-200',
    outline: 'border-2 border-blue-500 text-blue-500 bg-transparent hover:bg-blue-50'
  }
  return variants[props.variant]
})

// Rounded Classes
const roundedClasses = computed(() => {
  const rounded = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }
  return rounded[props.rounded]
})

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
