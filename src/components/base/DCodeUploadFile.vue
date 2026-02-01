<template>
    <div class="dcode-upload-file">
        <label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
        <div
            class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <UploadCloud class="w-8 h-8 text-gray-400 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium text-primary-600">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500 mt-1" v-if="accept">
                {{ accept }}
            </p>
            <input type="file" class="hidden" @change="handleFileChange" :accept="accept" />
        </div>
        <p v-if="errorMessage" class="text-xs text-red-600 mt-1">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
import { UploadCloud } from 'lucide-vue-next';

const props = defineProps<{
    label?: string
    accept?: string
    errorMessage?: string
    modelValue?: any
}>()

const emit = defineEmits(['update:modelValue'])

const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
        emit('update:modelValue', file)
    }
}
</script>
