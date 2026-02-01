<script setup lang="ts">
import type { PaginationListItemProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import type { ButtonVariants } from "@/components/ui/button";
import { reactiveOmit } from "@vueuse/core";
import { PaginationListItem } from "reka-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const props = withDefaults(
  defineProps<
    PaginationListItemProps & {
      size?: ButtonVariants["size"];
      class?: HTMLAttributes["class"];
      isActive?: boolean;
    }
  >(),
  {
    size: "icon",
  }
);

const delegatedProps = reactiveOmit(props, "class", "size", "isActive");
</script>

<template>
  <PaginationListItem
    data-slot="pagination-item"
    v-bind="delegatedProps"
    :class="
      cn(
        buttonVariants({
          variant: 'ghost',
          size,
        }),
        isActive
          ? 'bg-[#0056a1] dark:bg-[#003d75] text-white hover:bg-[#0056a1]/90 dark:hover:bg-[#003d75]/90 hover:text-white'
          : '',
        props.class
      )
    "
  >
    <slot />
  </PaginationListItem>
</template>
