<template>
  <div class="flex flex-col items-center justify-center w-full h-full relative">
    <!-- Background Decoration -->
    <div class="absolute inset-0 z-0 opacity-10 dark:opacity-5 pointer-events-none">
      <img src="@/assets/images/circuit-1.png" alt="Circuit Background" class="w-full h-full object-cover" />
    </div>

    <div class="w-full max-w-3xl p-8 relative z-10 transition-transform duration-300 hover:scale-105">
      <LottieAnimation :animationData="LoaderAnimation" :loop="true" :autoPlay="true" class="w-full h-full" />
    </div>
    <h1 class="text-4xl font-semibold">Credit Bureau Automation System</h1>
    <h1 class="text-2xl font-medium">Now Loading...</h1>
  </div>
</template>

<script setup lang="ts">
import LoaderAnimation from "@/assets/loader/Live chatbot.json";
</script>
