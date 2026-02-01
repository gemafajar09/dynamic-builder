<template>
  <div class="dcode-card">
    <!-- Table Header -->
    <div class="p-6 border-b border-neutral-200">
      <div class="flex items-center justify-between">
        <Skeleton :width="200" :height="24" />
        <Skeleton :width="120" :height="36" rounded="0.5rem" />
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="dcode-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">
              <Skeleton :width="'80%'" :height="14" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row">
            <td v-for="col in columns" :key="col">
              <Skeleton :width="'90%'" :height="16" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="p-6 border-t border-neutral-200 flex items-center justify-between">
      <Skeleton :width="150" :height="14" />
      <div class="flex gap-2">
        <Skeleton :width="40" :height="40" rounded="0.5rem" :count="5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from './Skeleton.vue';

interface Props {
  rows?: number
  columns?: number
}

withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 5
})
</script>
