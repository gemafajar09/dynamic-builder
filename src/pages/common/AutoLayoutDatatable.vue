<template>
  <div class="d-datatable-container">
    <div v-if="config.titleID" class="d-title mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">{{ config.titleID }}</h2>
      <div v-if="config.action && config.action.length" class="flex gap-2">
           <component 
             v-for="act in config.action" 
             :key="act.key"
             :is="resolveComponent(act.component)"
             :text="act.label"
             v-bind="act"
             @click="handleTopAction(act)"
           />
      </div>
    </div>

    <!-- Filters placeholder -->
    <div v-if="config.filter && config.filter.length" class="mb-4 p-4 border rounded-md">
        <h3 class="font-semibold mb-2">Filters</h3>
        <div class="grid grid-cols-2 gap-4">
             <!-- Simplified filter rendering -->
             <div v-for="f in config.filter" :key="f.key" class="border p-2">
                 {{ f.label }} ({{ f.type }})
             </div>
        </div>
    </div>

    <table class="w-full border-collapse border">
      <thead>
        <tr class="bg-gray-100">
          <th v-for="header in config.headers" :key="header.key" class="border p-2 text-left">
            {{ header.text }}
          </th>
          <th v-if="hasRowActions" class="border p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.id" @click="handleRowClick(row)" class="hover:bg-gray-50">
          <td v-for="header in config.headers" :key="header.key" class="border p-2">
            {{ row[header.value] }}
          </td>
          <td v-if="hasRowActions" class="border p-2">
             <div class="flex gap-2">
                <button @click.stop="handleRowAction('edit', row)" class="text-blue-500 underline">Edit</button>
                <button @click.stop="handleRowAction('delete', row)" class="text-red-500 underline">Delete</button>
             </div>
          </td>
        </tr>
        <tr v-if="data.length === 0 && !loading">
            <td :colspan="config.headers.length + (hasRowActions ? 1 : 0)" class="border p-4 text-center">
                No data available
            </td>
        </tr>
        <tr v-if="loading">
             <td :colspan="config.headers.length + (hasRowActions ? 1 : 0)" class="border p-4 text-center">
                Loading...
            </td>
        </tr>
      </tbody>
    </table>

    <div v-if="config.pagination" class="flex justify-between items-center mt-4">
       <button :disabled="currentPage <= 1" @click="changePage(currentPage - 1)" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
       <span>Page {{ currentPage }}</span>
       <button @click="changePage(currentPage + 1)" class="px-3 py-1 border rounded">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DCodeButton from '../../components/base/DCodeButton.vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['action', 'row-click'])

const data = ref([])
const currentPage = ref(1)
const loading = ref(false)

const hasRowActions = true

async function fetchData() {
    // if (!props.config.endpoint) return
    loading.value = true
    try {
        // Imitate network delay
        await new Promise(r => setTimeout(r, 500))
        
        // Mock data
        data.value = [
            { id: 1, name: 'Product A', code: 'P001', category: 'Category 1' },
            { id: 2, name: 'Product B', code: 'P002', category: 'Category 2' },
            { id: 3, name: 'Product C', code: 'P003', category: 'Category 1' },
        ]
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})

watch(() => props.config, () => {
    fetchData()
})

const componentMap = {
    'button': DCodeButton,
    'DCodeButton': DCodeButton
}

function resolveComponent(name) {
    return componentMap[name] || 'button'
}

function handleTopAction(action) {
    emit('action', { type: 'top', ...action })
}

function handleRowAction(actionKey, row) {
    emit('action', { type: 'row', key: actionKey, row })
}

function handleRowClick(row) {
    emit('row-click', row)
}

function changePage(page) {
    currentPage.value = page
    fetchData()
}
</script>

<style scoped>
.hover\:bg-gray-50:hover { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.text-blue-500 { color: #3b82f6; }
.text-red-500 { color: #ef4444; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
</style>
