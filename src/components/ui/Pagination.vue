<template>
  <div class="flex items-center justify-between py-4">
    <!-- Info Text -->
    <div class="text-sm text-neutral-600">
      Menampilkan
      <span class="font-medium text-neutral-900">{{ startItem }}</span>
      -
      <span class="font-medium text-neutral-900">{{ endItem }}</span>
      dari
      <span class="font-medium text-neutral-900">{{ totalItems }}</span>
      data
    </div>

    <!-- Pagination Controls -->
    <div class="flex items-center gap-2">
      <!-- Previous Button -->
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
        class="px-3 py-2 rounded-lg border transition-all duration-200" :class="[
          currentPage === 1
            ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
            : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400',
        ]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Page Numbers -->
      <div class="flex items-center gap-1">
        <button v-for="page in visiblePages" :key="page" @click="goToPage(page)"
          class="min-w-[2.5rem] h-10 px-3 rounded-lg font-medium text-sm transition-all duration-200" :class="[
            page === currentPage
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-100',
          ]">
          {{ page }}
        </button>
      </div>

      <!-- Next Button -->
      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
        class="px-3 py-2 rounded-lg border transition-all duration-200" :class="[
          currentPage === totalPages
            ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
            : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400',
        ]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

interface Emits {
  (e: "update:page", page: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const startItem = computed(() => {
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize;
  return end > props.totalItems ? props.totalItems : end;
});

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, props.currentPage - half);
  let end = Math.min(props.totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return;
  }
  emit("update:page", page);
};
</script>
