<template>
  <div class="d-form-container">
    <h2 v-if="config.title" class="text-2xl font-bold mb-2">{{ config.title }}</h2>
    <p v-if="config.description" class="text-muted-foreground mb-6">{{ config.description }}</p>

    <form @submit.prevent="handleSubmit">
      <div v-for="section in config.sections" :key="section.key" class="d-section mb-8 pb-4 border-b">
        <h3 v-if="section.title" class="text-xl font-semibold mb-4">{{ section.title }}</h3>
        
        <div class="grid gap-4" :style="gridStyle(section.layoutColumns || 1)">
          <div 
            v-for="field in section.fields" 
            :key="field.key"
            :class="[field.column === 'half' ? 'col-span-1' : 'col-span-full']"
          >
            <component
              :is="resolveComponent(field.component)"
              v-bind="field.props"
              :modelValue="formData[field.model]"
              @update:modelValue="(val) => formData[field.model] = val"
              :label="field.props.label || 'No Label'"
              :id="field.key"
            />
          </div>
        </div>
      </div>

      <div class="flex gap-4 justify-end mt-4">
        <component
          v-for="action in config.actions"
          :key="action.key"
          :is="resolveComponent(action.component)"
          v-bind="action"
          :text="action.label" 
          @click="handleAction(action)"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import DCodeTextField from '../../components/base/DCodeTextField.vue'
import DCodeButton from '../../components/base/DCodeButton.vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'action'])

const formData = ref({})

watch(() => props.config, (newConfig) => {
  if (newConfig && newConfig.sections) {
    const data = {}
    newConfig.sections.forEach(section => {
      section.fields.forEach(field => {
        data[field.model] = field.value || ''
      })
    })
    formData.value = data
  }
}, { immediate: true })

const componentMap = {
  'DCodeTextField': DCodeTextField,
  'DCodeButton': DCodeButton,
  'button': DCodeButton
}

function resolveComponent(name) {
  return componentMap[name] || DCodeTextField 
}

function gridStyle(cols) {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
  }
}

async function handleSubmit() {
  const payload = { ...formData.value }
  
  if (props.config.submitEndpoint) {
      try {
          const response = await fetch(props.config.submitEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          })
          emit('submit', { data: payload, response })
      } catch (error) {
          console.error(error)
      }
  } else {
      emit('submit', payload)
  }
  
  const event = new CustomEvent('form-submit', {
      detail: payload,
      bubbles: true,
      composed: true
  })
}

function handleAction(action) {
  if (action.type === 'submit') {
    return
  }
  emit('action', action)
  if (action.key === 'cancel') {
     emit('cancel')
  }
}
</script>

<style scoped>
.d-form-container {
  width: 100%;
}
</style>
