<script lang="ts" setup>
import { Check, Minus } from "lucide-vue-next";
import { computed, ref, useAttrs, watch } from "vue";
import Label from "../ui/label/Label.vue";

defineOptions({ name: "DCodeChekbox", inheritAttrs: false })

const attrs = useAttrs()

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean | null): void
    (e: "change", value: boolean | null): void
}>()

const props = withDefaults(
    defineProps<{
        modelValue?: boolean | null
        visible?: boolean
        skeleton?: boolean
        indeterminate?: boolean
        disabled?: boolean
    }>(),
    {
        visible: true,
        skeleton: false,
        indeterminate: false,
        disabled: false
    }
)

const label = computed(() => attrs.label as string | undefined)
const placeholder = computed(() => attrs.placeholder as string | undefined)
const title = computed(() => attrs.title as string | undefined)
const isVisible = computed(() => props.visible !== undefined ? props.visible : true)
const isRequired = computed(() =>
    attrs.required === '' || attrs.required === true || attrs.required === 'true'
)

const uid = Math.random().toString(36).slice(2, 7)
const elementId = computed(() => {
    const token = (attrs.id as string | undefined) || label.value || "checkbox"
    return `dcode-checkbox-${token}-${uid}`
})

const checkboxAttrs = computed(() => {
    const {
        label: _label,
        class: _class,
        id: _id,
        placeholder: _placeholder,
        title: _title,
        required: _required,
        ...rest
    } = attrs as Record<string, any>

    return {
        ...rest,
        disabled: props.disabled || rest.disabled
    }
})

const localValue = ref<boolean>(!!props.modelValue)

watch(
    () => props.modelValue,
    (newValue) => {
        // console.log(`[DCodeCheckbox] modelValue changed for ${attrs.label || 'unknown'}:`, newValue)
        localValue.value = !!newValue
    },
    { immediate: true }
)

const toggle = () => {
    if (props.disabled) return

    const nextValue = !localValue.value
    localValue.value = nextValue
    emit("update:modelValue", nextValue)
}

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        toggle()
    }
}
</script>

<template>
    <div v-show="isVisible" class="" :class="[
        attrs.class,
        { 'opacity-60 cursor-not-allowed': disabled }
    ]" :aria-busy="skeleton">
        <template v-if="skeleton">
            <div v-if="label" class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div class="flex items-center gap-2.5">
                <div class="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                <div class="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
        </template>

        <template v-else >
            <div class="flex items-center gap-2.5">
                
                <div class="flex items-start gap-2.5 group" :class="{ 'cursor-pointer': !disabled }" @click="toggle"
                    @keydown="handleKeydown" tabindex="0" role="checkbox" :aria-checked="localValue"
                    :aria-disabled="disabled" :aria-label="placeholder || title || label">
    
                    <div class="h-4 w-4 shrink-0 rounded-sm border shadow-sm transition-colors flex items-center justify-center mt-0.5"
                        :class="[
                            localValue || indeterminate
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900',
                            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        ]">
                        <Check v-if="localValue && !indeterminate" class="h-3 w-3 text-white" stroke-width="3" />
                        <Minus v-else-if="indeterminate" class="h-3 w-3 text-white" stroke-width="3" />
                    </div>
    
                    <label v-if="placeholder || title" :for="elementId"
                        class="text-sm leading-relaxed select-none transition-colors" :class="[
                            disabled
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 cursor-pointer group-hover:text-gray-900 dark:group-hover:text-gray-100'
                        ]">
                        {{ placeholder || title }}
                    </label>
                </div>

                <Label v-if="label" :for="elementId"
                    class="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                    {{ label }}
                    <span v-if="isRequired" class="ml-1 text-red-500 dark:text-red-400" aria-label="required">
                        *
                    </span>
                </Label>
            </div>
        </template>
    </div>
</template>

<style scoped>
[role="checkbox"]:focus-visible {
    outline: 2px solid rgb(59 130 246);
    outline-offset: 2px;
    border-radius: 0.25rem;
}

.group {
    transition: all 0.15s ease-in-out;
}
</style>
