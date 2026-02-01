<template>
  <Modal :is-open="isOpen" :title="$t('auth.sessionTimeoutTitle', 'Session Timeout Warning')" :close-on-overlay="false"
    :show-close-button="false">
    <div class="flex flex-col items-center text-center space-y-4">
      <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
        <Clock class="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      </div>

      <p class="text-neutral-600 dark:text-neutral-300">
        {{
          $t(
            "auth.sessionTimeoutMessage",
            "You have been inactive for a while. For security reasons, you will be automatically logged out in:"
          )
        }}
      </p>

      <div class="text-4xl font-semibold font-mono text-blue-600 dark:text-blue-400">
        {{ formatTime(timeLeft) }}
      </div>

      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        {{ $t("auth.sessionTimeoutAction", "Do you want to stay connected?") }}
      </p>
    </div>

    <template #footer>
      <button @click="emit('logout')"
        class="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
        {{ $t("common.logout", "Logout") }}
      </button>
      <button @click="emit('extend')"
        class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
        {{ $t("common.stayConnected", "Stay Connected") }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { Clock } from "lucide-vue-next";
import Modal from "./Modal.vue";

interface Props {
  isOpen: boolean;
  timeLeft: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "extend"): void;
  (e: "logout"): void;
}>();

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};
</script>
