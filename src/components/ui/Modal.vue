<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          @click="closeOnOverlay ? close() : null"></div>

        <!-- Modal Panel -->
        <div
          class="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl transition-all border border-neutral-100 dark:border-neutral-800"
          role="dialog" aria-modal="true">
          <!-- Header -->
          <div v-if="$slots.header || title"
            class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <slot name="header">
              <h3 class="text-lg font-medium text-neutral-900 dark:text-white leading-6">
                {{ title }}
              </h3>
            </slot>
            <button v-if="showCloseButton" @click="close"
              class="rounded-lg p-1 text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer"
            class="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";

interface Props {
  isOpen: boolean;
  title?: string;
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true,
  showCloseButton: true,
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

const close = () => {
  emit("close");
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .transform,
.modal-fade-leave-active .transform {
  transition: all 0.3s ease-out;
}

.modal-fade-enter-from .transform {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-fade-leave-to .transform {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
