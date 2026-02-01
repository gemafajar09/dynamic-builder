<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform opacity-0 scale-75 translate-y-4"
    enter-to-class="transform opacity-100 scale-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="transform opacity-100 scale-100 translate-y-0"
    leave-to-class="transform opacity-0 scale-75 translate-y-4"
  >
    <button
      v-if="isVisible"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      :title="'Scroll ke Atas'"
      aria-label="Scroll to top"
    >
      <div class="relative w-full h-full flex items-center justify-center">
        <!-- Icon Arrow Up with Animation -->
        <svg
          class="w-6 h-6 md:w-7 md:h-7 transform transition-transform duration-300 group-hover:-translate-y-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>

        <!-- Ripple Effect on Hover -->
        <span
          class="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        ></span>

        <!-- Progress Ring (Optional) -->
        <svg
          class="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            class="text-white/30"
            stroke-dasharray="283"
            stroke-dashoffset="0"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            class="text-white transition-all duration-300"
            stroke-dasharray="283"
            :stroke-dashoffset="progressOffset"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const isVisible = ref(false)
const scrollProgress = ref(0)

// Calculate progress ring offset
const progressOffset = computed(() => {
  const circumference = 283
  return circumference - (scrollProgress.value / 100) * circumference
})

// Handle scroll event
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight

  // Show button after scrolling 300px
  isVisible.value = scrollTop > 300

  // Calculate scroll progress percentage
  scrollProgress.value = (scrollTop / scrollHeight) * 100
}

// Smooth scroll to top
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Additional pulse animation on first appearance */
@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

button:hover {
  animation: pulse-ring 1.5s infinite;
}
</style>
