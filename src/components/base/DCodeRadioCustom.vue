<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
    modelValue: string | number
    value: string | number
    title: string
    icon?: Component
    width?: string
    height?: string
}

const props = withDefaults(defineProps<Props>(), {
    width: 'w-full',
    height: 'min-h-[160px]',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void
}>()

const onChange = () => {
    emit('update:modelValue', props.value)
}
</script>

<template>
    <label class="cursor-pointer block">
        <input type="radio" class="hidden peer" :checked="modelValue === value" @change="onChange" />

        <div :class="[
            width,
            height,
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 text-center',
            'transition-all duration-300 ease-out',
            'border-gray-200 bg-white',
            'hover:-translate-y-1 hover:shadow-lg hover:border-blue-300',
            'peer-checked:border-blue-500',
            'peer-checked:bg-blue-50',
            'peer-checked:ring-2 peer-checked:ring-blue-200',
            'peer-checked:scale-[1.02]'
        ]">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg
               bg-gray-100 text-gray-500
               transition-colors duration-300
               peer-checked:bg-blue-100
               peer-checked:text-blue-600" :class="{ 'opacity-0': !icon }">
                <component v-if="icon" :is="icon" class="h-6 w-6" />
            </div>

            <p class="font-medium text-gray-800 transition-colors duration-300
               peer-checked:text-blue-700">
                {{ title }}
            </p>
        </div>
    </label>
</template>
