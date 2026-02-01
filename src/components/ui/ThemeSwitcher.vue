<template>
  <div class="relative" ref="containerRef">
    <button @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:shadow-sm"
      :title="'Ubah Tema'">
      <component :is="currentIcon" :size="20" class="transition-transform duration-200"
        :class="isDropdownOpen ? 'rotate-12' : ''" />
      <span class="text-sm font-medium hidden sm:inline">
        {{ currentThemeLabel }}
      </span>
    </button>

    <!-- Dropdown Menu -->
    <Transition enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95 -translate-y-2"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 -translate-y-2">
      <div v-if="isDropdownOpen"
        class="absolute right-0 mt-3 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden"
        style="
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        " @click.stop>
        <div class="p-2">
          <div class="px-3 py-2 mb-1">
            <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Pilih Tema
            </p>
          </div>
          <button v-for="option in themeOptions" :key="option.value" @click="selectTheme(option.value)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group"
            :class="{
              'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 shadow-sm':
                uiStore.theme === option.value,
              'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700':
                uiStore.theme !== option.value,
            }">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200" :class="{
              'bg-white dark:bg-neutral-700 shadow-sm':
                uiStore.theme === option.value,
              'bg-neutral-100 dark:bg-neutral-700/50 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-600':
                uiStore.theme !== option.value,
            }">
              <component :is="option.icon" :size="18" :class="{
                'text-blue-600 dark:text-blue-400':
                  uiStore.theme === option.value,
                'text-neutral-600 dark:text-neutral-400':
                  uiStore.theme !== option.value,
              }" />
            </div>
            <div class="flex-1 text-left">
              <p class="font-medium">{{ option.label }}</p>
              <p class="text-xs opacity-75 mt-0.5">{{ option.description }}</p>
            </div>
            <Check v-if="uiStore.theme === option.value" :size="18"
              class="text-blue-600 dark:text-blue-400 transition-all duration-200" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { Check, Monitor, Moon, Sun } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";

const uiStore = useUiStore();
const isDropdownOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const themeOptions = [
  {
    value: "light" as const,
    label: "Terang",
    description: "Mode terang",
    icon: Sun,
  },
  {
    value: "dark" as const,
    label: "Gelap",
    description: "Mode gelap",
    icon: Moon,
  },
  {
    value: "auto" as const,
    label: "Sistem",
    description: "Ikuti sistem",
    icon: Monitor,
  },
];

const currentIcon = computed(() => {
  const option = themeOptions.find((opt) => opt.value === uiStore.theme);
  return option?.icon || Monitor;
});

const currentThemeLabel = computed(() => {
  const option = themeOptions.find((opt) => opt.value === uiStore.theme);
  return option?.label || "Sistem";
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectTheme = (theme: "light" | "dark" | "auto") => {
  uiStore.setTheme(theme);
  isDropdownOpen.value = false;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
