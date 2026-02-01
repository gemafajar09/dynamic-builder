<template>
    <div class="transition-shadow duration-300 dcode-card" :class="[
        levelClasses,
        padding,
        { 'shadow-md': shadow },
        { 'border-transparent': !border },
        { 'border-neutral-200 dark:border-neutral-800': border && level === 1 },
        { 'border-neutral-300 dark:border-neutral-700': border && level !== 1 }
    ]">
        <!-- Header -->
        <div v-if="title || $slots.header || $slots.actions" class="flex items-center justify-between mb-4">
            <div class="flex flex-col gap-1">
                <slot name="header">
                    <h3 v-if="title" class="text-lg font-semibold text-neutral-900 dark:text-neutral-50 leading-tight">
                        {{ title }}
                    </h3>
                    <p v-if="subtitle" class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ subtitle }}
                    </p>
                </slot>
            </div>
            <div v-if="$slots.actions" class="flex items-center gap-2">
                <slot name="actions" />
            </div>
        </div>

        <!-- Body -->
        <div class="relative z-10">
            <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    level?: 1 | 2 | 3
    title?: string
    subtitle?: string
    shadow?: boolean
    border?: boolean
    padding?: string
}

const props = withDefaults(defineProps<Props>(), {
    level: 1,
    shadow: false,
    border: true,
    padding: 'p-6'
})

const levelClasses = computed(() => {
    switch (props.level) {
        case 2:
            return 'bg-neutral-50 dark:bg-neutral-800'
        case 3:
            return 'bg-neutral-100 dark:bg-neutral-700'
        case 1:
        default:
            return 'bg-white dark:bg-neutral-900'
    }
})
</script>
