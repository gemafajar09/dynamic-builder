<template>
    <nav aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center text-sm md:text-base">
            <li v-for="(item, index) in items" :key="index" class="flex items-center ">
                <component :is="item.to ? 'router-link' : 'span'" :to="item.to" :class="[
                    'inline-flex items-center gap-1.5 transition-all duration-200 rounded-lg  font-medium',
                    item.to
                        ? 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
                        : 'dark:text-gray-100 bg-primary-50 dark:bg-primary-900/30 text-primary-700',
                ]">
                    <!-- Icon dengan custom color support -->
                    <component v-if="item.icon || (index === 0 && showHomeIcon)" :is="item.icon || HomeIcon"
                        :size="iconSize" :class="[
                            'flex-shrink-0',
                            item.to
                                ? 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                : 'text-primary-600 dark:text-primary-400',
                            item.iconClass || ''
                        ]" :stroke-width="strokeWidth" />

                    <!-- Text label -->
                    <span class="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
                        {{ item.label }}
                    </span>
                </component>

                <!-- Separator -->
                <component v-if="index < items.length - 1" :is="separatorIcon" :size="separatorSize"
                    class="mx-1.5 text-gray-300 dark:text-gray-700 flex-shrink-0" />
            </li>
        </ol>
    </nav>
</template>

<script setup lang="ts">
import { ChevronRight, Home, Slash, type LucideIcon } from 'lucide-vue-next'

interface BreadcrumbItem {
    label: string
    to?: string | object
    icon?: LucideIcon
    iconClass?: string
}

interface Props {
    items: BreadcrumbItem[]
    showHomeIcon?: boolean
    iconSize?: number
    separatorSize?: number
    separatorType?: 'chevron' | 'slash'
    strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
    showHomeIcon: true,
    iconSize: 18,
    separatorSize: 16,
    separatorType: 'chevron',
    strokeWidth: 2,
})

const HomeIcon = Home
const separatorIcon = props.separatorType === 'slash' ? Slash : ChevronRight
</script>