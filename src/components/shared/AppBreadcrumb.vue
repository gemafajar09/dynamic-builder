<template>
    <Breadcrumb :items="breadcrumbs" />
</template>

<script setup lang="ts">
import Breadcrumb from '@/components/ui/Breadcrumb.vue';
import { useBreadcrumbs } from '@/composables/useBreadcrumbs';

const { breadcrumbs } = useBreadcrumbs()
</script>
