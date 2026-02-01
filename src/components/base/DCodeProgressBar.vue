<template>
    <transition name="fade">
        <div v-if="uiStore.isApiLoading" class="fixed top-0 left-0 right-0 z-[10000] h-[3px]">
            <div class="h-full bg-primary-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] transition-all duration-300 ease-out"
                :style="{ width: `${uiStore.apiProgress}%` }"></div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
