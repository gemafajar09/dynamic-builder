<template>
  <Sheet>
    <SheetTrigger as-child>
      <slot name="trigger">
        <Button variant="outline" class="gap-2">
          <Search class="w-4 h-4" />
          <span>Pencarian</span>
        </Button>
      </slot>
    </SheetTrigger>
    <SheetContent class="flex flex-col h-full">
      <SheetHeader class="flex-shrink-0">
        <SheetTitle>{{ title }}</SheetTitle>
        <SheetDescription>
          {{ description }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-hidden">
        <slot></slot>
      </div>

      <SheetFooter class="flex-shrink-0">
        <slot name="footer"></slot>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-vue-next";

interface Props {
  title?: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  title: "Filter Data",
  description: "Masukan parameter pencarian untuk memfilter data.",
});
</script>
