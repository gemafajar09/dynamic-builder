<template>
  <button
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
    :type="type || 'button'"
    @click="$emit('click', $event)"
  >
    <slot>
        <span v-if="text">{{ text }}</span>
        <span v-else>{{ label }}</span>
    </slot>
  </button>
</template>

<script setup>
defineProps({
  text: String,
  label: String,
  type: String
})
</script>
