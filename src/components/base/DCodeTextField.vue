<template>
  <div class="flex flex-col gap-1 w-full" :class="$attrs.class">
    <label v-if="label" class="text-sm font-medium">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative w-full">
        <input
            :type="type || 'text'"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            :placeholder="placeholder"
            :disabled="disabled"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
    </div>

    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  error: String,
  placeholder: String,
  type: String,
  required: Boolean,
  disabled: Boolean
})
defineEmits(['update:modelValue'])
</script>
