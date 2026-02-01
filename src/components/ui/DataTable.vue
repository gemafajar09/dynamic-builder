<template>
  <div class="dcode-card animate-slide-up">
    
    <div
      class="px-4 py-2 bg-primary-700 dark:bg-primary-900 border-b border-primary-500/30 dark:border-primary-900/50 rounded-t-xl relative z-30">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div v-if="!nested" class="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 max-w-2xl">
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            <Input v-model="searchQuery" :placeholder="t('common.search') + '...'"
              class="pl-9 h-9 bg-white/95 dark:bg-zinc-800/95 border-white/30 dark:border-neutral-700/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
              @keyup.enter="handleGlobalSearch" />
          </div>

          <div class="relative" v-if="filtersConfig.length > 0">
            <DataFilterSheet>
              <template #trigger>
                <DCodeButton variant="secondary" :icon="SlidersHorizontal"
                  :tooltip="t('common.advanceSearch') || 'Advance Search'"
                  class="gap-2 h-9 w-full sm:w-auto justify-center bg-white/95 dark:bg-zinc-800/95 text-neutral-700 dark:text-neutral-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-white/30 dark:border-neutral-700/50 shadow-sm backdrop-blur-sm text-xs font-medium" />
              </template>

              <div class="flex flex-col h-full">
                <slot name="filter-form" :filters="filters">
                  <div v-if="filtersConfig.length > 0" class="flex-1 overflow-y-auto py-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                      <template v-for="(field, idx) in sortedFiltersConfig" :key="idx">
                        <div :class="getColumnClass(field.column)">
                          <DynamicFilterField :field="field" v-model="filters[field.model]" />
                        </div>
                      </template>
                    </div>
                  </div>
                </slot>

                <div v-if="filtersConfig.length > 0"
                  class="sticky bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-neutral-200 dark:border-neutral-700 p-4 flex gap-2">
                  <Button variant="outline" @click="resetFilters" :disabled="isLoading" class="flex-1 w-full">
                    {{ t('common.reset') }}
                  </Button>
                  <Button @click="handleApplyFilter" :disabled="isLoading" class="flex-1 w-full">
                    {{ t('common.search') }}
                  </Button>
                </div>
              </div>

              <template #footer>
                <div class="flex justify-end gap-2 w-full">
                  <slot name="filter-footer" :fetch="fetchData" :reset="resetFilters"></slot>
                </div>
              </template>
            </DataFilterSheet>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap" :class="{ 'w-full justify-between': nested }">
          <span v-if="nested" class="font-medium text-sm text-neutral-600 dark:text-neutral-400">
          </span>

          <DCodeButton v-if="!nested" variant="secondary" :icon="RefreshCw" :text="t('common.refresh')"
            :tooltip="t('common.refresh')"
            class="gap-2 h-9 bg-white/95 dark:bg-zinc-800/95 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-zinc-800 border border-white/30 dark:border-neutral-700/50 shadow-sm backdrop-blur-sm text-xs font-medium"
            @click="handleRefresh" :disabled="isLoading">
            <template #icon>
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
            </template>
          </DCodeButton>

          <template v-for="(headerAction, idx) in visibleHeaderActions" :key="idx">
            <DCodeButton :icon="getIconComponent(headerAction.icon)" :text="headerAction.label"
              :tooltip="headerAction.tooltip" :variant="headerAction.variant" :bg-color="headerAction.bgColor"
              :text-color="headerAction.textColor"
              class="gap-2 h-9 shadow-lg shadow-primary-500/20 border-none text-xs font-medium"
              @click="handleHeaderAction(headerAction)" />
          </template>

          <slot name="header-actions"></slot>
        </div>
      </div>
    </div>

    <div class="overflow-auto custom-scrollbar relative max-h-[calc(100vh-17rem)]">
      <table class="dcode-table w-full">
        <thead class="bg-primary-700 dark:bg-primary-900 sticky top-0 z-20 shadow-sm">
          <tr>
            <th v-for="column in columns" :key="column.key" :class="[
              column.align ? `text-${column.align.toLowerCase()}` : '',
              column.sortable ? 'cursor-pointer select-none' : '',
              'px-3 py-2 text-xs font-black text-white dark:text-neutral-100 uppercase tracking-wider transition-colors duration-150',
            ]" :style="column.width ? { width: column.width } : {}" @click="column.sortable && handleSort(column.key)">
                <div v-if="column.type === 'CHECKBOX'" class="flex items-center justify-center w-full">
                  <DCodeChekbox
                    :model-value="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @update:model-value="(checked: boolean | null) => toggleSelectAll(!!checked)"
                    @click.stop
                  />
                </div>
                <div v-else class="flex items-center gap-2 w-full" :class="getHeaderAlignment(column.align)">
                  <span>{{ column.label }}</span>
                </div>
            </th>
            <th v-if="showActionsColumn"
              class="px-3 py-2 text-xs font-medium text-white dark:text-neutral-100 uppercase tracking-wider">
              <div class="flex items-center justify-center w-full">
                {{ t("common.actions") }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-zinc-900 divide-y divide-neutral-200 dark:divide-neutral-700">
          <template v-if="isLoading">
            <tr v-for="skeletonRow in currentPerPage" :key="`skeleton-${skeletonRow}`">
              <td v-for="column in columns" :key="column.key"
                :class="[column.align ? `text-${column.align.toLowerCase()}` : 'text-left', 'px-3 py-0.5']">
                <div
                  class="bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 animate-shimmer"
                  :class="[
                    ['badge', 'BADGE'].includes(column.type) || column.condition
                      ? 'h-5 rounded-full w-20'
                      : 'h-4 rounded-md',
                    column.align?.toLowerCase() === 'center' ? 'mx-auto' : '',
                    column.align?.toLowerCase() === 'right' ? 'ml-auto' : '',
                  ]" :style="{
                    width:
                      ['badge', 'BADGE'].includes(column.type) || column.condition ? undefined : getSkeletonWidth(column),
                    backgroundSize: '200% 100%',
                  }"></div>
              </td>
              <td v-if="hasActions" class="px-3 py-0.5">
                <div class="flex items-center justify-center gap-1.5">
                  <div class="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse"></div>
                  <div class="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse delay-75"></div>
                  <div class="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse delay-150"></div>
                </div>
              </td>
            </tr>
          </template>

          <tr v-else-if="displayData.length === 0">
            <td :colspan="columns.length + (showActionsColumn ? 1 : 0)" class="text-center py-16">
              <div class="flex flex-col items-center gap-4">
                <div class="flex items-center justify-center">
                  <Vue3Lottie :animationData="Animation10" :height="120" :width="120" />
                </div>
                <div>
                  <p class="text-base font-medium text-neutral-700 dark:text-neutral-300">
                    {{ isFiltered ? t("dataTable.noSearchResults") : t("dataTable.noData") }}
                  </p>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {{ isFiltered ? t("dataTable.tryChangingKeywords") : t("dataTable.noDataAdded") }}
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <template v-else v-for="(row, index) in displayData" :key="index">
            <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150">
              <td v-for="column in columns" :key="column.key" :class="[
                column.align ? `text-${column.align}` : 'text-left',
                'px-3 py-0.5 text-sm text-neutral-900 dark:text-neutral-100',
              ]">
                <slot :name="`cell-${column.key}`" :row="row" :value="resolvePath(row, column.key)">
                  <template v-if="column.type === 'CHECKBOX'">
                    <div class="flex items-center justify-center">
                      <DCodeChekbox
                        :model-value="isRowSelected(row)"
                        @update:model-value="(checked: boolean | null) => toggleRowSelection(row, !!checked)"
                        @click.stop
                      />
                    </div>
                  </template>

                  <template v-else-if="column.type === 'badge' || column.type === 'BADGE' || column.condition">
                    <div class="flex items-center gap-1.5 flex-wrap md:flex-nowrap"
                      :class="[column.align ? `justify-${column.align}` : 'justify-start']">
                      <Badge :variant="getBadgeConfig(row, column).variant" :class="[
                        getBadgeConfig(row, column).class,
                        'whitespace-nowrap truncate max-w-[150px] inline-block',
                      ]">
                        {{ getBadgeConfig(row, column).label }}
                      </Badge>
                    </div>
                  </template>

                  <template v-else-if="column.key === 'no'">
                    {{ (currentPage - 1) * currentPerPage + index + 1 }}
                  </template>
                  <template v-else-if="column.type === 'date' || column.type === 'DATE'">
                    {{ resolvePath(row, column.key) ? formatDate(resolvePath(row, column.key), 'long') : '-' }}
                  </template>
                  <template v-else>
                    {{ column.format ? column.format(resolvePath(row, column.key)) : resolvePath(row, column.key) }}
                  </template>
                </slot>
              </td>
              <td v-if="showActionsColumn" class="px-3 py-0.5 !text-center">
                <slot name="actions" :row="row" :buttons="getRowActionButtons(row)" :getButtonColor="getButtonColor"
                  :getIconComponent="getIconComponent">
                  <div v-if="getRowActionButtons(row).length > 0" class="flex items-center justify-center gap-1.5">
                    <div v-for="(button, btnIndex) in getRowActionButtons(row)" :key="btnIndex" class="group relative">
                      <DCodeButton :tooltip="button.tooltip || button.label" :icon="getIconComponent(button.icon)"
                        size="icon" :variant="button.variant || 'ghost'" :bg-color="getButtonColor(button, row)"
                        @click="handleRowAction(button, row)" />
                    </div>
                  </div>
                </slot>
              </td>
            </tr>
            <tr v-if="$slots['expanded-row']" class="bg-zinc-50/50 dark:bg-zinc-800/30">
              <td :colspan="columns.length + (showActionsColumn ? 1 : 0)" class="px-0 py-0">
                <slot name="expanded-row" :row="row" :index="index"></slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="!isLoading && displayData.length > 0 && (showPagination && paginationEnabled)"
      class="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      <div class="flex items-center gap-4">
        <Select :model-value="String(currentPerPage)" @update:model-value="(v) => handlePerPageSelect(Number(v))">
          <SelectTrigger class="h-8 w-[70px] bg-white dark:bg-zinc-800 border-neutral-200 dark:border-neutral-700">
            <SelectValue :placeholder="String(currentPerPage)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in perPageOptions" :key="size" :value="String(size)">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="h-5 w-px bg-zinc-300 dark:bg-zinc-600"></div>

        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          Showing <span class="text-neutral-900 dark:text-neutral-100 font-medium">{{ startItem }}</span> to
          <span class="text-neutral-900 dark:text-neutral-100 font-medium">{{ endItem }}</span> of
          <span class="text-neutral-900 dark:text-neutral-100 font-medium">{{ totalItems }}</span> items
        </span>
      </div>

      <div class="flex-shrink-0">
        <Pagination :total="totalItems" :items-per-page="currentPerPage" :sibling-count="1" show-edges
          :page="currentPage" @update:page="handlePageChange" class="scale-90 origin-right">
          <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <PaginationFirst
              class="w-8 h-8 p-0 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronsLeft class="h-4 w-4" />
            </PaginationFirst>
            <PaginationPrevious
              class="w-8 h-8 p-0 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 hover:bg-zinc-100 dark:hover:bg-zinc-700  disabled:cursor-not-allowed">
              <ChevronLeft class="h-4 w-4" />
            </PaginationPrevious>
            <template v-for="(item, index) in items">
              <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
                <Button class="w-8 h-8 p-0 text-sm" :variant="item.value === currentPage ? 'default' : 'outline'"
                  :disabled="item.value === currentPage" @click="handlePageChange(item.value)">
                  {{ item.value }}
                </Button>
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>
            <PaginationNext
              class="w-8 h-8 p-0 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 hover:bg-zinc-100 dark:hover:bg-zinc-700  disabled:cursor-not-allowed">
              <ChevronRight class="h-4 w-4" />
            </PaginationNext>
            <PaginationLast
              class="w-8 h-8 p-0 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 hover:bg-zinc-100 dark:hover:bg-zinc-700  disabled:cursor-not-allowed">
              <ChevronsRight class="h-4 w-4" />
            </PaginationLast>
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <DCodeDialog v-model="confirmDialogOpen" :title="confirmDialogTitle" icon="AlertCircle" :max-width="450"
      :persistent="false">
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          {{ confirmDialogMessage }}
        </p>
      </div>

      <template #actions>
        <Button variant="outline" @click="closeConfirmDialog">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="confirmAction">
          {{ t('common.yes') }}
        </Button>
      </template>
    </DCodeDialog>

    <DCodeDialog v-model="customActionDialogOpen" :title="activeAction?.label || 'Action'" icon="AlertCircle" :max-width="450">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-1">
        <template v-for="(field, idx) in (activeAction?.fieldActionCustom || activeAction?.fieldActionGlobal || [])" :key="idx">
          <div :class="getColumnClass(field.column)" v-if="!field.isHidden">
            <DynamicFilterField :field="field" v-model="customActionFormData[field.model]" />
          </div>
        </template>
      </div>

      <template #actions>
        <Button variant="outline" @click="customActionDialogOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="handleCustomActionSave">
          {{ t('common.save') }}
        </Button>
      </template>
    </DCodeDialog>
  </div>
</template>

<script setup lang="ts">
import Animation10 from "@/assets/loader/Animation10.json";
import DCodeChekbox from "@/components/base/DCodeChekbox.vue";
import DCodeButton from "@/components/base/DCodeButton.vue";
import DCodeDialog from "@/components/base/DCodeDialog.vue";
import { formatDate } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataFilterSheet from "@/components/ui/DataFilterSheet.vue";
import DynamicFilterField from "@/components/ui/DynamicFilterField.vue";
import { Input } from "@/components/ui/input";
import { onUnmounted } from 'vue';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/composables/useApi";
import { useMenuMetadata } from "@/composables/useMenuMetadata";
import { useSocket } from "@/composables/useSocket";
import { socketPath } from "@/config/socketEndpoint";
import type { SortConfig, TableColumn } from "@/types";
import { hasActionAccess } from "@/utils/permission";
import { useRoute, useRouter } from "vue-router";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  SquarePen,
  ToggleLeft,
  Trash2
} from "lucide-vue-next";
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import * as LucideIcons from "lucide-vue-next";

const Vue3Lottie = defineAsyncComponent(() =>
  import("vue3-lottie").then((mod) => mod.Vue3Lottie)
);

const { t, locale } = useI18n();

interface Props {
  columns?: TableColumn[];
  data?: any[]; 
  perPage?: number;
  loading?: boolean;
  hasActions?: boolean;
  nested?: boolean; 
  apiModule?: string;
  apiAction?: string; 
  apiMethod?: string;
  apiUrl?: string;
  permissionBase?: string; 
  apiParams?: Record<string, any>;
  socketEndpoint?: string; 
  socketParams?: Record<string, any>;
  configKey?: string; 
  tableConfig?: any;
  dynamicColumns?: boolean; 
  searchApiEndpoint?: string; 
  enableQuickSearch?: boolean; 
  showPagination?: boolean; 
  ignorePermissions?: boolean;
}

interface Emits {
  (e: "update:search", search: string): void;
  (e: "update:sort", sort: SortConfig): void;
  (e: "update:page", page: number): void;
  (e: "update:page", page: number): void;
  (e: "create"): void;
  (e: "export"): void;
  (e: "export"): void;
  (e: "action", payload: { action: string; row: any; selection?: any[] }): void;
  (e: "update:selection", selection: any[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 10,
  loading: false,
  hasActions: false,
  nested: false,
  apiAction: "list",
  apiParams: () => ({}),
  data: () => [],
  columns: () => [],
  dynamicColumns: false,
  enableQuickSearch: true,
  showPagination: true,
  ignorePermissions: false,
});

const emit = defineEmits<Emits>();
const { api, apiUrl } = useApi();
const socket = useSocket();
const route = useRoute();
const router = useRouter();
const { activeMenu } = useMenuMetadata();

const searchQuery = ref("");
const currentPage = ref(1);
const currentPerPage = ref(props.perPage);
const sortConfig = ref<SortConfig>({
  key: "",
  direction: "asc",
});

const internalData = ref<any[]>([]);
const internalLoading = ref(false);
const totalData = ref(0);
const filters = ref<Record<string, any>>({});
const dynamicColumnsData = ref<TableColumn[]>([]);
const tableConfig = ref<any>(null);
const paginationEnabled = ref(true);
const actionButtons = ref<any[]>([]);
const headerActions = ref<any[]>([]);
const filtersConfig = ref<any[]>([]);
const confirmDialogOpen = ref(false);
const customActionDialogOpen = ref(false);
const customActionFormData = ref<Record<string, any>>({});
const pendingAction = ref<{ button: any; row: any } | null>(null);
const activeAction = ref<any>(null);
const activeRow = ref<any>(null);

const selectedIds = ref<any[]>([]);

const isAllSelected = computed(() => {
  if (displayData.value.length === 0) return false;
  
  const currentPageIds = displayData.value
      .map((row: any) => {
          const checkboxCol = columns.value.find(c => c.type === 'CHECKBOX');
          const key = checkboxCol?.keyCheckbox || 'id';
          return row[key];
      })
      .filter((id: any) => id !== undefined && id !== null);

  if (currentPageIds.length === 0) return false;

  return currentPageIds.every(id => selectedIds.value.includes(id));
});

const isIndeterminate = computed(() => {
  if (displayData.value.length === 0) return false;
  
  const checkboxCol = columns.value.find(c => c.type === 'CHECKBOX');
  const key = checkboxCol?.keyCheckbox || 'id';

  const currentPageIds = displayData.value
      .map((row: any) => row[key])
      .filter((id: any) => id !== undefined && id !== null);

  const selectedCount = currentPageIds.filter(id => selectedIds.value.includes(id)).length;
  return selectedCount > 0 && selectedCount < currentPageIds.length;
});

const isRowSelected = (row: any) => {
  const checkboxCol = columns.value.find(c => c.type === 'CHECKBOX');
  const key = checkboxCol?.keyCheckbox || 'id';
  const id = row[key];
  return id !== undefined && selectedIds.value.includes(id);
};

const toggleSelectAll = (checked: boolean) => {
  const checkboxCol = columns.value.find(c => c.type === 'CHECKBOX');
  const key = checkboxCol?.keyCheckbox || 'id';

  const currentPageIds = displayData.value
    .map((row: any) => row[key])
    .filter((id: any) => id !== undefined && id !== null);

  if (checked) {
    const uniqueIds = new Set([...selectedIds.value, ...currentPageIds]);
    selectedIds.value = Array.from(uniqueIds);
  } else {
    selectedIds.value = selectedIds.value.filter(
      (id) => !currentPageIds.includes(id)
    );
  }
};

const toggleRowSelection = (row: any, checked: boolean) => {
  const checkboxCol = columns.value.find(c => c.type === 'CHECKBOX');
  const key = checkboxCol?.keyCheckbox || 'id';
  const id = row[key];

  if (id === undefined || id === null) return;

  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id);
    }
  } else {
    selectedIds.value = selectedIds.value.filter(existingId => existingId !== id);
  }
};

watch(selectedIds, (newVal) => {
  emit("update:selection", newVal);

  // Logika untuk menangani update fieldActionGlobal saat multiple selection
  // Jika checkbox checkall aktif atau nilai checkbox yang terpilih lebih dari satu
  const isMultiSelect = isAllSelected.value || newVal.length > 1;

  if (headerActions.value?.length) {
    headerActions.value.forEach((action: any) => {
      if (action.fieldActionGlobal?.length) {
        action.fieldActionGlobal.forEach((field: any) => {
          const endpoint = action.endpoint || action.propsActionGlobal?.endpointPropAction || action.propsActionGlobal;
          const idKeyParam = endpoint?.keyParam?.[0];

          const isIdField = (idKeyParam && field.model === idKeyParam) || 
                           (!idKeyParam && /^(id|ids|idAuditTrail)/i.test(field.model));

          if (isIdField && isMultiSelect) {
            
            if (field.model) {
              customActionFormData.value[field.model] = newVal;
            }
          }
        });
      }
    });
  }
}, { deep: true });

const getValidString = (val: any) => (val && typeof val === 'string' && val.trim()) ? val : undefined;
const effectiveApiModule = computed(() => getValidString(tableConfig.value?.endpoint?.apiModule) || getValidString(tableConfig.value?.endpointGlobal?.apiModule) || props.apiModule);
const effectiveApiAction = computed(() => getValidString(tableConfig.value?.endpoint?.apiAction) || getValidString(tableConfig.value?.endpointGlobal?.apiAction) || props.apiAction);
const effectiveApiMethod = computed(() => getValidString(tableConfig.value?.endpoint?.apiMethod) || getValidString(tableConfig.value?.endpointGlobal?.apiMethod) || props.apiMethod || 'POST');
const effectiveApiUrl = computed(() => getValidString(tableConfig.value?.endpoint?.apiUrl) || getValidString(tableConfig.value?.endpointGlobal?.apiUrl) || props.apiUrl);

const effectivePermissionPath = computed(() => {
  if (props.permissionBase) return props.permissionBase;
  if (route.meta.permissionPath) return route.meta.permissionPath as string;
  return route.path;
});


const sortedFiltersConfig = computed(() => {
  if (!filtersConfig.value || filtersConfig.value.length === 0) return [];
  return [...filtersConfig.value].sort((a, b) => (a.seq || 0) - (b.seq || 0));
});

const getColumnClass = (columnType?: string): string => {
  if (!columnType) return 'col-span-1';

  const type = columnType.toLowerCase();
  const columnMap: Record<string, string> = {
    'full': 'col-span-1 md:col-span-2', 
    'half': 'col-span-1', 
    'third': 'col-span-1',
    'two-thirds': 'col-span-1 md:col-span-2',
    'two_thirds': 'col-span-1 md:col-span-2',
  };

  return columnMap[type] || 'col-span-1';
};

const loadConfig = () => {
  let config = null;

  if (props.tableConfig) {
    config = props.tableConfig;
  }

  if (config) {
    tableConfig.value = config;

    if (config.headers) {
      dynamicColumnsData.value = config.headers.map((h: any) => {
        if (h.key === 'action' || h.custom?.type === 'ACTION' || h.custom?.type === 'action') {
          const actions = h.custom?.actionCustom || h.custom?.action;
          if (actions) {
            actionButtons.value = actions.map((a: any) => {
              const props = a.propsActionCustom || a.props || {};
              const customMsg = a.propCustomMessage || {};
              return {
                permission: a.permission,
                label: locale.value === 'id' ? props.labelID : props.labelEN,
                tooltip: locale.value === 'id' ? (props.tooltipID || props.labelID) : (props.tooltipEN || props.labelEN),
                icon: props.icon,
                variant: props.variant || 'ghost',
                bgColor: props.bgColor,
                action: props.actionType || props.key,
                route: props.route,
                path: props.path,
                endpoint: props.endpointPropAction,
                requiredCondition: a.requiredCondition || false,
                propCustomCondition: a.propCustomCondition || [],
                openDialog: a.openDialog || false,
                fieldActionCustom: (a.fieldActionCustom || []).map((f: any) => {
                  const props = f.propsFieldCustom || f.propsFieldGlobal || f.props || {};
                  return {
                    ...f,
                    props: { ...props, endpoint: props.endpointComponent || props.endpoint }
                  };
                }),
                requireConfirm: a.requireConfirm || props.requireConfirm || false,
                confirmTitle: locale.value === 'id' ? (customMsg.titleID || props.confirmTitleID || 'Konfirmasi') : (customMsg.titleEN || props.confirmTitleEN || 'Confirm'),
                confirmMessage: locale.value === 'id' ? (customMsg.messageID || props.confirmMessageID || 'Apakah Anda yakin?') : (customMsg.messageEN || props.confirmMessageEN || 'Are you sure?'),
              };
            });
          }
          return null;
        }

        let colCondition = undefined;
        const conditions = h.custom?.conditionBadge || h.custom?.condition;
        if ((h.custom?.type === 'BADGE' || h.custom?.type === 'badge') && conditions) {
          colCondition = conditions.map((c: any) => ({
            value: c.value,
            label: locale.value === 'id' ? c.labelID : c.labelEN,
            color: c.color,
            variant: c.variant
          }));
        }

        return {
          key: h.key,
          label: locale.value === 'id' ? h.labelID : h.labelEN,
          width: h.width,
          align: h.align,
          sortable: true,
          type: h.custom?.type,
          condition: colCondition,
          keyCheckbox: h.custom?.keyCheckbox 
        };
      }).filter((c: any) => c !== null);
    }

    const rawFilters = config.filters || config.filter;
    if (rawFilters && Array.isArray(rawFilters)) {
      filtersConfig.value = rawFilters.map((f: any) => ({
        ...f,
        props: f.propsFilters || f.props || {}
      }));
      filtersConfig.value.forEach((field: any) => {
        filters.value[field.model] = '';
      });
    }

    const rawActions = config.actionGlobal || config.action;
    if (rawActions && Array.isArray(rawActions)) {
      headerActions.value = rawActions.map((a: any) => {
        const props = a.propsActionGlobal || a.props || {};
        return {
          permission: a.permission,
          label: locale.value === 'id' ? (props.labelID || 'Action') : (props.labelEN || 'Action'),
          tooltip: locale.value === 'id' ? (props.tooltipID || props.labelID) : (props.tooltipEN || props.labelEN),
          icon: props.icon,
          variant: props.variant || 'default',
          bgColor: props.bgColor,
          textColor: props.textColor,
          route: props.route,
          path: props.path,
          endpoint: props.endpointPropAction || a.endpoint,
          openDialog: a.openDialog || false,
          fieldActionGlobal: (a.fieldActionGlobal || a.field || []).map((f: any) => {
            const props = f.propsFieldGlobal || f.props || {};
            return {
              ...f,
              props: { ...props, endpoint: props.endpointComponent || props.endpoint }
            };
          })
        };
      });
    }

    if (config.pagination !== undefined) {
      paginationEnabled.value = config.pagination;
    }
  }
};

watch(() => props.tableConfig, () => {
  loadConfig();
}, { deep: true, immediate: true });

const columns = computed<TableColumn[]>(() => {
  if (props.dynamicColumns || props.configKey || props.tableConfig) {
    return dynamicColumnsData.value;
  }
  return props.columns || [];
});

const showActionsColumn = computed(() => {
  return props.hasActions || actionButtons.value.length > 0;
});

const isLoading = computed(() =>
  (effectiveApiModule.value || effectiveApiUrl.value || props.socketEndpoint) ? internalLoading.value : props.loading
);
const isApiMode = computed(() => !!effectiveApiModule.value || !!effectiveApiUrl.value);
const isSocketMode = computed(() => !!props.socketEndpoint);

const socketEventConfig = computed(() => {
  if (!props.socketEndpoint) return null;
  return resolvePath(socketPath, props.socketEndpoint);
});

const availableActions = computed(() => {
  if (!activeMenu.value || !activeMenu.value.actions) return [];
  return activeMenu.value.actions.filter((a: any) => a.checked);
});

const hasAction = (actionCode: string): boolean => {
  return availableActions.value.some((a: any) => a.code === actionCode);
};

const canCreate = computed(() => {
  if (effectivePermissionPath.value) {
    return hasActionAccess(effectivePermissionPath.value, "CREATE");
  }
  return hasAction("CREATE");
});

const canExport = computed(() => {
  if (effectivePermissionPath.value) {
    return hasActionAccess(effectivePermissionPath.value, "EXPORT");
  }
  return hasAction("EXPORT");
});

const checkVisibilityCondition = (button: any, row: any): boolean => {
  if (!button.visibilityCondition) return true;

  const { field, operator, value } = button.visibilityCondition;
  const fieldValue = resolvePath(row, field);

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'notEquals':
      return fieldValue !== value;
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'greaterThan':
      return fieldValue > value;
    case 'lessThan':
      return fieldValue < value;
    case 'contains':
      return String(fieldValue).includes(String(value));
    default:
      return true;
  }
};

const visibleHeaderActions = computed(() => {
  if (headerActions.value.length === 0) {
    return headerActions.value;
  }

  return headerActions.value.filter((action: any) => {
    if (props.ignorePermissions) return true; 
    if (!action.permission) return true; 

    if (effectivePermissionPath.value) {
      return hasActionAccess(effectivePermissionPath.value, action.permission);
    }

    return hasAction(action.permission);
  });
});

const visibleActionButtons = computed(() => {
  if (actionButtons.value.length === 0) {
    return actionButtons.value;
  }

  return actionButtons.value.filter((button: any) => {
    if (props.ignorePermissions) return true; 
    if (!button.permission) return true; 

    if (effectivePermissionPath.value) {
      return hasActionAccess(effectivePermissionPath.value, button.permission);
    }

    return hasAction(button.permission);
  });
});

const getRowActionButtons = (row: any) => {
  return visibleActionButtons.value.filter((button: any) =>
    checkVisibilityCondition(button, row)
  );
};

const getButtonColor = (button: any, row: any): string => {
  if (button.requiredCondition && button.propCustomCondition?.length > 0) {
    const fieldValue = resolvePath(row, 'status');
    const condition = button.propCustomCondition.find((c: any) => c.value === fieldValue);
    if (condition) return condition.bgColor || button.bgColor || 'primary';
  }

  if (!button.dynamicColor || !button.colorCondition) {
    return button.bgColor || 'primary';
  }

  const fieldValue = resolvePath(row, button.colorCondition.field);
  const condition = button.colorCondition.conditions?.find((c: any) => c.value === fieldValue);

  return condition?.bgColor || button.bgColor || 'primary';
};

const getHeaderAlignment = (align: string | undefined) => {
  const a = (align || 'left').toLowerCase();
  if (a === 'center') return 'justify-center';
  if (a === 'right') return 'justify-end';
  return 'justify-start';
};

const iconMap: Record<string, any> = {
  ToggleLeft,
  SquarePen,
  Trash2,
  Eye,
  CheckCircle,
  Plus,
  Download,
  RefreshCw,
  Search,
  SlidersHorizontal
};

const getIconComponent = (iconName: string) => {
  if (!iconName) return null;
  if ((LucideIcons as any)[iconName]) {
    return (LucideIcons as any)[iconName];
  }
  return iconMap[iconName] || null;
};

const displayData = computed(() => {
  if (isApiMode.value || isSocketMode.value) {
    return internalData.value.map((item, idx) => ({
      ...item,
      no: (currentPage.value - 1) * currentPerPage.value + idx + 1,
    }));
  }
  return paginatedData.value;
});

const totalItems = computed(() => {
  if (isApiMode.value || isSocketMode.value) return totalData.value;
  return filteredData.value.length;
});

const startItem = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * currentPerPage.value + 1;
});

const endItem = computed(() => {
  const end = currentPage.value * currentPerPage.value;
  return end > totalItems.value ? totalItems.value : end;
});

const resolvePath = (object: any, path: string) => {
  if (!object || !path) return undefined;
  if (path in object) return object[path];
  return path.split('.').reduce((acc, part) => acc && acc[part], object);
};

const filteredData = computed(() => {
  if (isApiMode.value || isSocketMode.value) return [];
  if (!searchQuery.value) return props.data;

  const query = searchQuery.value.toLowerCase();
  return props.data.filter((row) => {
    return columns.value.some((column) => {
      const value = resolvePath(row, column.key);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(query);
    });
  });
});

const sortedData = computed(() => {
  if (isApiMode.value || isSocketMode.value) return [];
  if (!sortConfig.value.key) return filteredData.value;

  const sorted = [...filteredData.value].sort((a, b) => {
    const aValue = resolvePath(a, sortConfig.value.key);
    const bValue = resolvePath(b, sortConfig.value.key);

    if (aValue === bValue) return 0;

    let comparison = 0;
    if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.value.direction === "asc" ? comparison : -comparison;
  });

  return sorted;
});

const paginatedData = computed(() => {
  if (isApiMode.value || isSocketMode.value) return [];
  const start = (currentPage.value - 1) * currentPerPage.value;
  const end = start + currentPerPage.value;
  return sortedData.value.slice(start, end).map((item, idx) => ({
    ...item,
    no: start + idx + 1,
  }));
});

const isFiltered = computed(() => {
  if (isApiMode.value || isSocketMode.value) {
    return Object.values(filters.value).some((val) => !!val);
  }
  return !!searchQuery.value;
});

const perPageOptions = [10, 25, 50, 100];

const handleGlobalSearch = () => {
  if (isApiMode.value || isSocketMode.value) {
    filters.value = { ...filters.value, keyword: searchQuery.value };
    currentPage.value = 1;
    fetchData();
  }
};

let searchDebounceTimer: NodeJS.Timeout;
const handleQuickSearch = () => {
  if (!props.enableQuickSearch) return;

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    handleGlobalSearch();
  }, 500);
};

let fetchDebounceTimer: NodeJS.Timeout;
const debouncedFetchData = () => {
  clearTimeout(fetchDebounceTimer);
  fetchDebounceTimer = setTimeout(() => {
    if (isApiMode.value || isSocketMode.value) fetchData();
  }, 1000);
};

watch(searchQuery, () => {
  if (props.enableQuickSearch && (isApiMode.value || isSocketMode.value)) {
    handleQuickSearch();
  }
});

const fetchData = async () => {
  if ((!isApiMode.value && !isSocketMode.value) || (!effectiveApiModule.value && !effectiveApiUrl.value && !props.socketEndpoint)) return;

  try {
    internalLoading.value = true;

    const params: Record<string, any> = {
      page: currentPage.value,
      perPage: currentPerPage.value,
      ...filters.value, 
      ...props.apiParams,
      ...props.socketParams,
    };

    if (searchQuery.value) {
      params.keyword = searchQuery.value;
    }

    Object.keys(params).forEach((key) => {
      if (
        params[key] === "" ||
        params[key] === null ||
        params[key] === undefined
      ) {
        delete params[key];
      }
    });

    if (isSocketMode.value && socketEventConfig.value) {
      if (!socket.isConnected()) {
        socket.init();
      }
      socket.emit(socketEventConfig.value.emit, params);
      return;
    }

    let response: any;
    if (effectiveApiModule.value) {
      response = await api(effectiveApiModule.value, effectiveApiAction.value, params);
    } else if (effectiveApiUrl.value) {
      response = await apiUrl(effectiveApiUrl.value, effectiveApiMethod.value, params);
    }

    handleResponseData(response);

  } catch (e) {
    console.error("DataTable fetch error", e);
    internalLoading.value = false;
  }
};

const handleResponseData = (response: any) => {
  console.log('DataTable handleResponseData:', response);
  if (response) {
    if (props.dynamicColumns && response.columns && Array.isArray(response.columns)) {
      dynamicColumnsData.value = response.columns.map((col: any) => ({
        key: col.key || col.field || col.name,
        label: col.label || col.header || col.name,
        width: col.width,
        align: col.align || 'LEFT',
        sortable: col.sortable !== false,
        type: col.type,
        condition: col.condition,
        format: col.format,
      }));
    }

    if (response.data && Array.isArray(response.data)) {
      internalData.value = response.data;
      if (response.totalData) totalData.value = response.totalData;
      else if (response.maxPage)
        totalData.value = response.maxPage * currentPerPage.value;
      else totalData.value = response.data.length * (response.maxPage || 1);

    } else if (Array.isArray(response)) {
      internalData.value = response;
      totalData.value = response.length;
    } else if (response.users) {
      internalData.value = response.users;
      totalData.value = response.users.length;
    } else if (response.items && Array.isArray(response.items)) {
      internalData.value = response.items;
      totalData.value = response.total || response.totalItems || response.items.length;
    } else if (response.list && Array.isArray(response.list)) {
      internalData.value = response.list;
      totalData.value = response.total || response.list.length;
    } else if (response.rows && Array.isArray(response.rows)) {
      internalData.value = response.rows;
      totalData.value = response.count || response.total || response.rows.length;
    } else if (response.result && Array.isArray(response.result)) {
      internalData.value = response.result;
      totalData.value = response.total || response.count || response.result.length;
    } else {
      console.warn('DataTable: Unknown response format', response);
      internalData.value = [];
      totalData.value = 0;
    }
  }
  internalLoading.value = false;
}

const handleSocketResult = (response: any) => {
  handleResponseData(response);
};

watch(() => props.socketEndpoint, (newVal, oldVal) => {
  if (oldVal) {
    const oldConfig = resolvePath(socketPath, oldVal);
    if (oldConfig) socket.off(oldConfig.listen, handleSocketResult);
  }
  if (newVal) {
    const newConfig = resolvePath(socketPath, newVal);
    if (newConfig) {
      
      if (!socket.getInstance()) {
        socket.init();
      }
      socket.on(newConfig.listen, handleSocketResult);
    }
  }
}, { immediate: true });

onUnmounted(() => {
  if (socketEventConfig.value) {
    socket.off(socketEventConfig.value.listen, handleSocketResult);
  }
  clearTimeout(searchDebounceTimer);
  clearTimeout(fetchDebounceTimer);
});

const resetFilters = () => {
  Object.keys(filters.value).forEach(key => {
    filters.value[key] = '';
  });
  searchQuery.value = "";
  currentPage.value = 1;
  fetchData();
};

const handleApplyFilter = () => {
  currentPage.value = 1;
  fetchData();
};

const getBadgeConfig = (row: any, column: TableColumn) => {
  const val = resolvePath(row, column.key);
  let config = {
    variant: "secondary" as any,
    class: "",
    label: val,
  };

  if (column.condition) {
    const match = column.condition.find((c) => {
      const compare = (a: any, b: any) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.toLowerCase().trim() === b.toLowerCase().trim();
        }
        return a == b;
      };

      if (typeof val === "object" && val !== null) {
        return compare(c.value, val.code) || compare(c.value, val.id);
      }
      return compare(c.value, val);
    });

    if (match) {
      if (match.variant) {
        config.variant = match.variant;
      }
      config.label =
        match.label || (typeof val === "object" ? val.name || val.code : val);

      if (match.color) {
        const colorKey = match.color.toLowerCase();
        const isOutline = config.variant === "outline";
        const solidColors: Record<string, string> = {
          success: "bg-green-500 hover:bg-green-600 border-transparent text-white shadow",
          warning: "bg-yellow-500 hover:bg-yellow-600 border-transparent text-white shadow",
          info: "bg-blue-500 hover:bg-blue-600 border-transparent text-white shadow",
        };
        const outlineColors: Record<string, string> = {
          success: "text-green-600 border-green-600 hover:bg-green-50",
          warning: "text-yellow-600 border-yellow-600 hover:bg-yellow-50",
          info: "text-blue-600 border-blue-600 hover:bg-blue-50",
          danger: "text-red-600 border-red-600 hover:bg-red-50",
          destructive: "text-red-600 border-red-600 hover:bg-red-50",
          primary: "text-primary-600 border-primary-600 hover:bg-primary-50",
          secondary: "text-neutral-600 border-neutral-600 hover:bg-zinc-50",
        };
        const nativeVariants: Record<string, string> = {
          danger: "destructive",
          secondary: "secondary",
          primary: "default",
        };

        if (isOutline) {
          if (outlineColors[colorKey]) {
            config.class = outlineColors[colorKey];
          }
        } else {
          if (nativeVariants[colorKey]) {
            config.variant = nativeVariants[colorKey];
          } else if (solidColors[colorKey]) {
            config.class = solidColors[colorKey];
          }
        }
      }
    } else {
      config.label = typeof val === "object" ? val?.name || val?.code || "-" : val;
    }
  } else {
    config.label = typeof val === "object" ? val?.name || val?.code || "-" : val;
  }
  return config;
};

const handleSort = (key: string) => {
  if (sortConfig.value.key === key) {
    sortConfig.value.direction =
      sortConfig.value.direction === "asc" ? "desc" : "asc";
  } else {
    sortConfig.value.key = key;
    sortConfig.value.direction = "asc";
  }
  emit("update:sort", sortConfig.value);
};

const handlePageChange = (page: number) => {
  if (page === currentPage.value) return;
  currentPage.value = page;
  if (isApiMode.value || isSocketMode.value) {
    fetchData();
  }
  emit("update:page", page);
};

const handlePerPageSelect = (size: number) => {
  currentPerPage.value = size;
  currentPage.value = 1;
  if (isApiMode.value || isSocketMode.value) {
    fetchData();
  }
};

const getSkeletonWidth = (column: TableColumn) => {
  const randomVariation = Math.random() * 15 + 75;
  if (column.width) {
    const widthNum = parseInt(column.width);
    if (widthNum < 100)
      return `${Math.floor(widthNum * (Math.random() * 0.2 + 0.7))}px`;
    return `${randomVariation}%`;
  }
  return `${randomVariation}%`;
};

const handleRefresh = () => {
  searchQuery.value = "";
  filters.value = {};
  currentPage.value = 1;
  fetchData();
};

const handleHeaderAction = (action: any) => {
  if (action.route) {
    if (action.path) {
      const routeKey = action.route.startsWith('/') ? action.route : '/' + action.route
      sessionStorage.setItem(`layout_${routeKey}`, action.path)
    }
    router.push(action.route);
  } else if (action.openDialog) {
    activeAction.value = action;
    activeRow.value = null;
    
    customActionFormData.value = {};
    const fields = action.fieldActionGlobal || action.field || [];
    if (fields.length) {
      fields.forEach((f: any) => {
        const endpoint = action.endpoint || action.propsActionGlobal?.endpointPropAction || action.propsActionGlobal;
        const idKeyParam = (endpoint?.keyParam && endpoint.keyParam.length > 0) ? endpoint.keyParam[0] : null;

        if (idKeyParam && f.model === idKeyParam) {
             customActionFormData.value[f.model] = selectedIds.value;
        } else if (!idKeyParam && /^(id|ids|idAuditTrail)/i.test(f.model)) {
             customActionFormData.value[f.model] = selectedIds.value;
        } else {
             if (!customActionFormData.value[f.model]) {
                customActionFormData.value[f.model] = '';
             }
        }
      });
    }
    customActionDialogOpen.value = true;
  } else {
    emit('action', { action: action.propsActionCustom?.key || action.key || 'create', row: null, selection: selectedIds.value });
  }
};

const handleRowAction = (button: any, row: any) => {
  if (button.requireConfirm) {
    pendingAction.value = { button, row };
    confirmDialogOpen.value = true;
    return;
  }

  if (button.openDialog) {
    activeAction.value = button;
    activeRow.value = row;
    customActionFormData.value = {};
    const checkboxCol = columns.value.find(c => c.type === 'CHECKBOX');
    const idKey = checkboxCol?.keyCheckbox || 'id';

    if (button.fieldActionCustom) {
      button.fieldActionCustom.forEach((f: any) => {
        if (/^(id|ids|idAuditTrail)/i.test(f.model)) {
            customActionFormData.value[f.model] = [row[idKey]];
        } else {
            customActionFormData.value[f.model] = '';
        }
      });
    }
    customActionDialogOpen.value = true;
    return;
  }

  executeRowAction(button, row);
};

const executeRowAction = (button: any, row: any) => {
  if (button.route) {
    if (button.path) {
      const routeKey = button.route.startsWith('/') ? button.route : '/' + button.route;
      sessionStorage.setItem(`layout_${routeKey}`, button.path);
    }
    
    let routePath = button.route;
    if (routePath.includes(':')) {
        routePath = routePath.replace(/:([a-zA-Z0-9_]+)/g, (_: string, key: string) => {
             return row[key] || row['id'] || key;
        });
    } else {
        if (row.id) {
            routePath = `${routePath.replace(/\/$/, '')}/${row.id}`;
        }
    }
    router.push(routePath);
  } else if (button.endpoint && button.endpoint.apiUrl) {
    internalLoading.value = true;
    const { apiUrl } = useApi();
    const url = button.endpoint.apiUrl;
    const method = button.endpoint.apiMethod || 'POST';
    
    const payload: Record<string, any> = {};
    if (button.endpoint.keyParam && Array.isArray(button.endpoint.keyParam)) {
       button.endpoint.keyParam.forEach((key: string, index: number) => {
           const payloadKey = (button.endpoint.model && index === 0) ? button.endpoint.model : key;
           if (row[key] !== undefined) {
               payload[payloadKey] = row[key];
           }
       });
    }

    if (Object.keys(payload).length === 0 && row.id) {
        payload['id'] = row.id;
    }

    apiUrl(url, method, payload)
      .then(() => {
        fetchData();
        emit('action', { action: button.action || 'success', row });
      })
      .catch((err) => {
        console.error("Action Failed", err);
      })
      .finally(() => {
        internalLoading.value = false;
      });

  } else {
    emit('action', { action: button.action, row });
  }
};

const confirmAction = () => {
  if (pendingAction.value) {
    executeRowAction(pendingAction.value.button, pendingAction.value.row);
    closeConfirmDialog();
  }
};

const handleCustomActionSave = () => {
  if (activeAction.value) {
    const action = activeAction.value;
    const endpoint = action.endpoint || action.propsActionGlobal?.endpointPropAction || action.propsActionGlobal;
    
    let payloadIdKey = endpoint?.model || ((endpoint?.keyParam && endpoint.keyParam.length > 0) ? endpoint.keyParam[0] : null);

    if (!payloadIdKey) {
        const fields = action.fieldActionGlobal || action.fieldActionCustom || action.field || [];
        const idField = fields.find((f: any) => /^(id|ids|idAuditTrail)/i.test(f.model));
        payloadIdKey = idField ? idField.model : 'ids';
    }
    
    let payload: any = null;
    let shouldCallApi = false;

    if (activeRow.value) {
       const checkboxCol = columns.value.find((c: any) => c.type === 'CHECKBOX');
       const idKey = checkboxCol?.keyCheckbox || 'id';
       const rowId = activeRow.value[idKey];

       if (endpoint?.apiUrl) {
           payload = {
               ...customActionFormData.value
           };
           
           if (!payload[payloadIdKey]) {
                payload[payloadIdKey] = [rowId];
           }
           
           shouldCallApi = true;
       }
    } else {
       if (endpoint?.apiUrl) {
           payload = {
               ...customActionFormData.value
           };
           
           if (!payload[payloadIdKey]) {
                payload[payloadIdKey] = selectedIds.value || [];
           }
           
           shouldCallApi = true;
       }
    }

    if (shouldCallApi && payload && endpoint?.apiUrl) {
       const { apiUrl } = useApi();
       const url = endpoint.apiUrl;
       const method = endpoint.apiMethod || 'POST';
       
       apiUrl(url, method, payload).then(() => {
           customActionDialogOpen.value = false;
           if (!activeRow.value) selectedIds.value = [];
           fetchData();
           emit('action', { action: 'success', row: null }); 
       }).catch((err) => {
           console.error("Action Failed", err);
       });

    } else {
        if (activeRow.value) {
            const checkboxCol = columns.value.find((c: any) => c.type === 'CHECKBOX');
            const idKey = checkboxCol?.keyCheckbox || 'id';
            const rowId = activeRow.value[idKey];

            const finalRow: any = {
                ...customActionFormData.value
            };

            if (!finalRow[payloadIdKey]) {
                finalRow[payloadIdKey] = [rowId];
            }

            emit('action', {
                action: activeAction.value.action,
                row: finalRow
            });
            customActionDialogOpen.value = false;
        } else {
            const finalRow: any = {
                ...customActionFormData.value
            };
            
            if (!finalRow[payloadIdKey]) {
                finalRow[payloadIdKey] = selectedIds.value;
            }

            const payload = {
                action: activeAction.value.propsActionGlobal?.key || activeAction.value.key,
                row: finalRow, 
                selection: selectedIds.value
            };
            emit('action', payload as any); 
            customActionDialogOpen.value = false;
        }
    }
  }
};

const closeConfirmDialog = () => {
  confirmDialogOpen.value = false;
  pendingAction.value = null;
};

const confirmDialogTitle = computed(() => {
  if (!pendingAction.value) return '';
  return pendingAction.value.button.confirmTitle || t('common.confirm');
});

const confirmDialogMessage = computed(() => {
  if (!pendingAction.value) return '';
  return pendingAction.value.button.confirmMessage || t('common.confirmMessage');
});

defineExpose({
  fetchData,
  filters,
  resetFilters,
  handleRefresh
});

const lastApiSignature = ref('');
const getApiSignature = (config: any) => {
  if (!config) return '';
  const ep = config.endpoint || config.endpointGlobal || {};
  return JSON.stringify({
    url: ep.apiUrl || config.apiUrl,
    module: ep.apiModule || config.apiModule,
    action: ep.apiAction || config.apiAction,
    method: ep.apiMethod || config.apiMethod,
    params: config.apiParams,
    socket: ep.socket || config.socketEndpoint,
    socketParams: config.socketParams,
  });
};

watch(
  () => props.tableConfig,
  () => {
    if (props.tableConfig) {
      loadConfig();

      const newSig = getApiSignature(props.tableConfig);
      if (newSig !== lastApiSignature.value) {
        lastApiSignature.value = newSig;
        if (isApiMode.value || isSocketMode.value) debouncedFetchData();
      }
    }
  },
  { deep: true }
);

watch(
  () => props.apiModule,
  () => {
    if (isApiMode.value || isSocketMode.value) fetchData();
  }
);

watch(
  () => props.socketParams,
  () => {
    if (isSocketMode.value) fetchData();
  },
  { deep: true }
);

watch(
  () => props.apiParams,
  () => {
    if (isApiMode.value || isSocketMode.value) fetchData();
  },
  { deep: true }
);

onMounted(() => {
  loadConfig();
  if (isApiMode.value || isSocketMode.value) {
    fetchData();
  }
});
</script>
