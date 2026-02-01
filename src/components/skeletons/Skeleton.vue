<template>
  <div
    v-for="index in count"
    :key="index"
    class="skeleton-base"
    :class="[
      shapeClass,
      animateClass,
      customClass
    ]"
    :style="skeletonStyle"
    role="status"
    aria-label="Loading..."
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ShapeType = 'rectangle' | 'circle' | 'text' | 'avatar'
type AnimationType = 'pulse' | 'wave' | 'none'

interface Props {
  width?: string | number
  height?: string | number
  shape?: ShapeType
  animate?: AnimationType
  rounded?: string
  count?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  shape: 'rectangle',
  animate: 'pulse',
  rounded: '',
  count: 1,
  className: ''
})

// Convert number to px, keep string as is
const toPx = (value: string | number): string => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

// Skeleton styles
const skeletonStyle = computed(() => {
  const styles: Record<string, string> = {}
  
  // Base dimensions
  styles.width = toPx(props.width)
  styles.height = toPx(props.height)
  
  // Custom rounded
  if (props.rounded) {
    styles.borderRadius = props.rounded
  }
  
  return styles
})

// Shape class
const shapeClass = computed(() => {
  const shapes: Record<ShapeType, string> = {
    rectangle: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
    avatar: 'rounded-full'
  }
  return shapes[props.shape]
})

// Animation class
const animateClass = computed(() => {
  const animations: Record<AnimationType, string> = {
    pulse: 'skeleton-pulse',
    wave: 'skeleton-wave',
    none: ''
  }
  return animations[props.animate]
})

// Custom class
const customClass = computed(() => props.className)
</script>

<style scoped>
.skeleton-base {
  @apply bg-neutral-200 overflow-hidden;
  display: inline-block;
}

/* Pulse Animation */
.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Wave Animation */
.skeleton-wave {
  background: linear-gradient(
    90deg,
    #e5e5e5 0%,
    #f0f0f0 20%,
    #f0f0f0 40%,
    #e5e5e5 100%
  );
  background-size: 200% 100%;
  animation: skeleton-wave 1.5s ease-in-out infinite;
}

@keyframes skeleton-wave {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
