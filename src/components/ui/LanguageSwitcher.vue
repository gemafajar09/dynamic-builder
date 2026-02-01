<template>
  <div class="relative" ref="languageRef">

    <button @click.stop="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
      :title="$t('common.selectLanguage')">
      <svg class="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200 hidden sm:inline">
        {{ currentLanguage }}
      </span>

      <svg class="w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200"
        :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Language Dropdown -->
    <transition name="dropdown">

      <div v-if="showDropdown" @click.stop
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-strong border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
        <div class="p-2">
          <button v-for="lang in availableLanguages" :key="lang.code" @click="changeLanguage(lang.code)"
            class="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors duration-150" :class="[
              currentLocale === lang.code

                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200',
            ]">
            <span class="text-2xl">{{ lang.flag }}</span>
            <div class="flex-1 text-left">
              <p class="text-sm font-medium">{{ lang.name }}</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ lang.nativeName }}
              </p>
            </div>

            <svg v-if="currentLocale === lang.code" class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">

import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}


const { locale, t } = useI18n();

const showDropdown = ref(false);
const languageRef = ref<HTMLElement | null>(null);

const availableLanguages: Language[] = [
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
];

const currentLocale = computed(() => locale.value);

const currentLanguage = computed(() => {
  const lang = availableLanguages.find((l) => l.code === currentLocale.value);
  return lang ? lang.code.toUpperCase() : "ID";
});

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const closeDropdown = () => {
  showDropdown.value = false;
};

const changeLanguage = (langCode: string) => {
  locale.value = langCode;
  localStorage.setItem("locale", langCode);
  closeDropdown();
};

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (languageRef.value && !languageRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.dropdown-enter-active {
  animation: dropdown-in 0.2s ease-out;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease-in;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}
</style>
