<template>
  <div
    v-if="schemaLoading || dataLoading"
    class="flex flex-col items-center justify-center py-12 space-y-4"
  >
    <Loader2 class="animate-spin text-primary-600" :size="40" />
    <p class="text-neutral-500 animate-pulse font-medium">
      {{
        schemaLoading
          ? t("common.loading") + " Structure..."
          : t("common.loading") + " Data..."
      }}
    </p>
  </div>

  <form
    v-else-if="activeSchema"
    @submit.prevent="handleSubmit"
    :class="activeSchema.ui?.formClass"
  >
    <div
      v-if="fetchError"
      class="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3 text-danger-700"
    >
      <AlertCircle class="w-5 h-5" />
      <p class="text-sm font-medium">{{ fetchError }}</p>
      <DCodeButton
        variant="ghost"
        size="sm"
        class="ml-auto text-danger-700 hover:bg-danger-100"
        @click="fetchData"
        >Retry</DCodeButton
      >
    </div>

    <template v-if="activeSchema.sections && activeSchema.sections.length > 0">
      <div :class="activeSchema.ui?.containerClass || 'flex flex-col gap-6'">
        <template
          v-for="(section, index) in activeSchema.sections"
          :key="getSectionKey(section)"
        >
          <DCodeCard
            v-if="
              section.type?.toLowerCase() === 'card' || section.type === 'FORM'
            "
            :title="getSectionTitle(section)"
            :icon="getSectionIcon(section)"
            :level="1"
          >
            <template #actions>
              <slot name="card-actions" :section="section" :index="index" />
            </template>

            <div
              v-if="getSectionDescription(section)"
              class="mb-4 text-sm text-slate-500"
            >
              {{ getSectionDescription(section) }}
            </div>
            <div
              :class="
                activeSchema.ui?.gridClass || getSectionGridClass(section)
              "
            >
              <template
                v-for="field in getSectionFields(section)"
                :key="field.key"
              >
                <div
                  v-if="isFieldVisible(field)"
                  :class="
                    getFieldColClass(field, getSectionDefaultSpan(section))
                  "
                >
                  <component
                    :is="componentMap[field.component]"
                    :required="isFieldRequired(field)"
                    :disabled="isFieldDisabled(field)"
                    v-model="model[getModelKey(field)]"
                    v-bind="resolveProps(field)"
                    v-on="resolveEvents(field)"
                  />
                  <p
                    v-if="getFieldDescription(field)"
                    class="mt-1 text-xs text-slate-500"
                  >
                    {{ getFieldDescription(field) }}
                  </p>
                  <p
                    v-if="
                      internalErrors[getModelKey(field)] ||
                      errors[getModelKey(field)]
                    "
                    class="mt-1 text-xs text-danger-600"
                  >
                    {{
                      internalErrors[getModelKey(field)] ||
                      errors[getModelKey(field)]
                    }}
                  </p>
                </div>
              </template>
            </div>
          </DCodeCard>

          <!-- TABLE SECTION -->
          <DCodeCard
            v-if="section.type?.toLowerCase() === 'table'"
            :title="getSectionTitle(section)"
            :icon="getSectionIcon(section)"
            :level="1"
          >
            <div
              v-if="getSectionDescription(section)"
              class="mb-4 text-sm text-slate-500 px-1"
            >
              {{ getSectionDescription(section) }}
            </div>

            <DataTable
              :columns="getTableColumns(section)"
              :data="model[getSectionKey(section)] || []"
              :api-module="getSectionEndpoint(section)?.apiModule"
              :api-action="getSectionEndpoint(section)?.apiAction"
              :show-pagination="
                section.propsTable?.pagination ??
                section.props?.pagination !== false
              "
              :api-method="getSectionEndpoint(section)?.apiMethod"
              :api-url="getSectionEndpoint(section)?.apiUrl"
              :api-params="getSectionEndpoint(section)?.apiParams"
              :socket-endpoint="getSectionEndpoint(section)?.socket"
              :has-actions="true"
              ref="tableRefs"
              :nested="true"
              @create="handleTableCreate(section)"
            >
              <!-- Custom Badges/Format in Cells -->
              <template
                v-for="col in getTableColumns(section)"
                :key="col.key"
                #[`cell-${col.key}`]="{ row, value }"
              >
                <template v-if="col.custom?.type === 'badge'">
                  <Badge
                    :variant="col.custom.props?.variant || 'secondary'"
                    :class="col.custom.props?.class"
                  >
                    {{ value }}
                  </Badge>
                </template>
                <template v-else-if="col.custom?.type === 'action'">
                  <!-- Inline Actions in Cell (Not common for main table, but supported) -->
                  <div class="flex gap-1">
                    <template
                      v-for="action in col.custom.action"
                      :key="action.key"
                    >
                      <DCodeButton
                        :variant="
                          action.variant || action.props?.variant || 'ghost'
                        "
                        size="sm"
                        :bg-color="action.bgColor || action.props?.bgColor"
                        @click="handleTableAction(section, action, row)"
                      >
                        {{ resolveActionLabel(action) }}
                      </DCodeButton>
                    </template>
                  </div>
                </template>
                <template v-else>
                  {{ value }}
                </template>
              </template>

              <!-- Actions Slot (Row Actions) -->
              <template #actions="{ row }">
                <div class="flex items-center justify-center gap-1">
                  <!-- Default Edit/Delete if not specified in headers 'action' column, 
                                          OR render from 'action' column configuration if it exists 
                                          BUT DataTable has a dedicated #actions slot for the right-most column usually.
                                          Let's standardise: check section.props.headers for an action column.
                                     -->
                  <template v-if="getActionColumn(section)">
                    <template
                      v-for="action in getActionColumn(section)?.custom?.action"
                      :key="action.key"
                    >
                      <!-- Logic to determine icon/label -->
                      <DCodeButton
                        variant="ghost"
                        size="icon"
                        @click="handleTableAction(section, action, row)"
                        class="h-8 w-8"
                        :class="getActionClass(action)"
                      >
                        <!-- Simple Icon Logic based on key -->
                        <Pencil
                          v-if="
                            action.key.includes('update') ||
                            action.key.includes('edit')
                          "
                          class="w-4 h-4"
                        />
                        <Trash2
                          v-else-if="
                            action.key.includes('delete') ||
                            action.key.includes('remove') ||
                            action.key === 'reject'
                          "
                          class="w-4 h-4"
                        />
                        <span v-else>{{ resolveActionLabel(action) }}</span>
                      </DCodeButton>
                    </template>
                  </template>
                  <!-- Fallback to legacy edit/delete if no action column defined but table type -->
                  <template v-else>
                    <DCodeButton
                      variant="ghost"
                      size="icon"
                      @click="
                        handleTableAction(
                          section,
                          {
                            key: 'edit',
                            label: t('common.edit') || 'Edit',
                            openDialog: true,
                            type: 'BUTTON',
                            permission: 'UPDATE',
                          },
                          row,
                        )
                      "
                      class="h-8 w-8 text-warning-600 hover:bg-warning-50"
                    >
                      <Pencil class="w-4 h-4" />
                    </DCodeButton>
                    <DCodeButton
                      variant="ghost"
                      size="icon"
                      @click="
                        handleTableAction(
                          section,
                          {
                            key: 'delete',
                            label: t('common.delete') || 'Delete',
                            requireConfirm: true,
                            type: 'BUTTON',
                            permission: 'DELETE',
                            props: { variant: 'destructive' },
                          },
                          row,
                        )
                      "
                      class="h-8 w-8 text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                    >
                      <Trash2 class="w-4 h-4" />
                    </DCodeButton>
                  </template>
                </div>
              </template>

              <!-- Header Actions Slot (Top Right of Table) -->
              <template #header-actions>
                <template
                  v-for="action in getTableActions(section)"
                  :key="action.key"
                >
                  <DCodeButton
                    :variant="
                      action.variant || action.props?.variant || 'default'
                    "
                    :bg-color="action.bgColor || action.props?.bgColor"
                    size="sm"
                    class="gap-2 text-xs font-medium"
                    @click="handleTableAction(section, action)"
                  >
                    <Plus
                      v-if="
                        (action.key || '').toLowerCase().includes('create') ||
                        (action.key || '').toLowerCase().includes('add')
                      "
                      class="w-3.5 h-3.5"
                    />
                    <span>{{ resolveActionLabel(action) }}</span>
                  </DCodeButton>
                </template>
              </template>
            </DataTable>
          </DCodeCard>

          <!-- DIALOG FOR TABLE SECTION -->
          <!-- We use a single dialog state per section -->
          <DCodeDialog
            v-if="section.type?.toLowerCase() === 'table'"
            v-model="dialogState[getSectionKey(section)]"
            :title="
              (dialogAction?.[getSectionKey(section)]?.labelID ||
                getSectionTitle(section)) + ' Form'
            "
            max-width="600"
          >
            <DynamicForm
              v-if="dialogAction?.[getSectionKey(section)]"
              :schema="
                getDialogSchema(section, dialogAction[getSectionKey(section)]!)
              "
              :model="dialogModel[getSectionKey(section)] || {}"
              @submit="(data) => handleDialogSubmit(section, data)"
              @cancel="closeSectionDialog(section)"
            />
          </DCodeDialog>
        </template>

        <template
          v-for="section in activeSchema.sections"
          :key="getSectionKey(section) + '-before-after'"
        >
          <DCodeBeforeAfter
            v-if="section.type?.toUpperCase() === 'BEFOREAFTER'"
            :data-before="model[getSectionBeforeKey(section)]"
            :data-after="model[getSectionAfterKey(section)]"
          />
        </template>
      </div>
    </template>

    <!-- LEGACY/NO-SECTION Logic -->
    <div
      v-else
      :class="
        activeSchema.ui?.gridClass || 'grid grid-cols-1 md:grid-cols-12 gap-6'
      "
    >
      <template v-for="field in sortedFields" :key="field.key">
        <div v-if="isFieldVisible(field)" :class="getFieldColClass(field)">
          <component
            :is="componentMap[field.component]"
            :required="isFieldRequired(field)"
            :disabled="isFieldDisabled(field)"
            v-model="model[getModelKey(field)]"
            v-bind="resolveComponentProps(field)"
            v-on="resolveEvents(field)"
          />
          <p
            v-if="getFieldDescription(field)"
            class="mt-1 text-xs text-slate-500"
          >
            {{ getFieldDescription(field) }}
          </p>
          <p
            v-if="
              internalErrors[getModelKey(field)] || errors[getModelKey(field)]
            "
            class="mt-1 text-xs text-danger-600"
          >
            {{
              internalErrors[getModelKey(field)] || errors[getModelKey(field)]
            }}
          </p>
        </div>
      </template>
    </div>

    <div
      :class="
        activeSchema.ui?.actionsClass || 'flex flex-col sm:flex-row gap-3 pt-6'
      "
    >
      <template v-for="action in finalGlobalActions" :key="action.key">
        <DCodeButton
          :type="action.type || action.props?.type"
          :variant="action.variant || action.props?.variant"
          :disabled="isActionDisabled(action)"
          :bg-color="action.bgColor || action.props?.bgColor"
          :class="action.class || action.props?.class"
          @click="handleActionClick(action)"
        >
          <slot :name="'action-icon-' + action.key">
            <Loader2
              v-if="action.key === 'SUBMIT' && (loading || submissionLoading)"
              :size="18"
              class="animate-spin"
            />
            <Save v-else-if="action.key === 'SUBMIT'" :size="18" />
          </slot>
          <span>{{ resolveActionLabel(action) }}</span>
        </DCodeButton>
      </template>
    </div>

    <DCodeDialog
      v-model="confirmState"
      :title="getConfirmTitle(confirmAction)"
      icon="AlertCircle"
      max-width="450"
      :persistent="false"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          {{ getConfirmMessage(confirmAction) }}
        </p>
      </div>

      <template #actions>
        <DCodeButton variant="outline" @click="confirmState = false">
          {{ t("common.cancel") || "Cancel" }}
        </DCodeButton>
        <DCodeButton
          :variant="confirmAction?.props?.variant || 'primary'"
          :loading="confirmLoading"
          :bg-color="
            confirmAction?.bgColor ||
            (confirmAction?.key?.includes('delete') ? 'danger' : 'primary')
          "
          @click="handleConfirm"
        >
          {{ t("common.yes") || "Confirm" }}
        </DCodeButton>
      </template>
    </DCodeDialog>
  </form>

  <!-- Error/Empty State -->
  <div
    v-else
    class="p-6 text-center text-danger-500 font-medium border border-danger-200 rounded-lg bg-danger-50"
  >
    Error: Schema not found or failed to load.
  </div>
</template>

<script setup lang="ts">
import DCodeAutoComplete from "@/components/base/DCodeAutoComplete.vue";
import DCodeButton from "@/components/base/DCodeButton.vue";
import DCodeCard from "@/components/base/DCodeCard.vue";
import DCodeChekbox from "@/components/base/DCodeChekbox.vue";
import DCodeDatePicker from "@/components/base/DCodeDatePicker.vue";
import DCodeDateRangePicker from "@/components/base/DCodeDateRangePicker.vue";
import DCodeDialog from "@/components/base/DCodeDialog.vue";
import DCodeImageField from "@/components/base/DCodeImageField.vue";
import DCodeOtpInput from "@/components/base/DCodeOtpInput.vue";
import DCodeRadio from "@/components/base/DCodeRadioCustom.vue";
import DCodeSwitch from "@/components/base/DCodeSwitch.vue";
import DCodeTextField from "@/components/base/DCodeTextField.vue";
import DCodeTextarea from "@/components/base/DCodeTextarea.vue";
import DCodeUploadFile from "@/components/base/DCodeUploadFile.vue";
import DCodeCardCheckboxList from "@/components/features/DCodeCardCheckboxList.vue";
import DCodePermissionMenu from "@/components/features/DCodePermissionMenu.vue";
import DCodeTreePermissions from "@/components/features/DCodeTreePermissions.vue";
import DataTable from "@/components/ui/DataTable.vue";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/composables/useApi";
import { useDynamicForm } from "@/composables/useDynamicForm";
import type {
  ActionDefinition,
  FormSchema,
  SectionDefinition,
  TableHeader,
} from "@/types/form";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-vue-next";
import {
  computed,
  onMounted,
  reactive,
  ref,
  watch,
  type Component,
  type PropType,
} from "vue";
import { useI18n } from "vue-i18n";
import DCodeBeforeAfter from "../features/DCodeBeforeAfter.vue";
import DCodeIconDropdown from "../base/DCodeIconDropdown.vue";

defineOptions({
  name: "DynamicForm",
});

const { t, locale } = useI18n();
const { api } = useApi();

const props = defineProps({
  schema: {
    type: Object as PropType<FormSchema>,
    default: undefined,
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  extraComponents: {
    type: Object as PropType<Record<string, Component>>,
    default: () => ({}),
  },
  errors: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  fieldOverrides: {
    type: Object as PropType<import("@/types/form").FieldOverrides>,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  schemaModule: String,
  schemaAction: String,
  schemaParams: Object,
  apiModule: String,
  apiAction: String,
  apiParams: Object,
  submitModule: String,
  submitAction: String,
  treeData: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  enableParentControl: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "submit", data: any): void;
  (e: "cancel"): void;
  (e: "action", key: string, action: any): void;
  (e: "schemaLoaded", schema: FormSchema): void;
  (e: "dataLoaded", data: any): void;
  (e: "update:model", data: any): void;
}>();

const internalSchema = ref<FormSchema | null>(null);
const schemaLoading = ref(false);
const dataLoading = ref(false);
const submissionLoading = ref(false);
const fetchError = ref<string | null>(null);
const tableRefs = ref<any[]>([]);

const confirmState = ref<boolean>(false);
const confirmAction = ref<ActionDefinition | null>(null);
const confirmData = ref<any>(null);
const confirmSection = ref<SectionDefinition | null>(null);
const confirmLoading = ref(false);

const dialogState = reactive<Record<string, boolean>>({});
const dialogModel = reactive<Record<string, any>>({});
const dialogAction = reactive<Record<string, ActionDefinition | null>>({});

const activeSchema = computed(() => props.schema || internalSchema.value);

const getSectionKey = (section: SectionDefinition): string => {
  const props = (section.propsForm ||
    section.propsTable ||
    section.props) as any;
  return props?.key || (section as any).key || "unknown-section";
};

watch(
  activeSchema,
  (schema) => {
    if (schema?.sections) {
      schema.sections.forEach((section) => {
        if (section.type?.toLowerCase() === "table") {
          const key = getSectionKey(section);
          if (key) {
            if (dialogState[key] === undefined) {
              dialogState[key] = false;
            }
            if (!dialogModel[key]) {
              dialogModel[key] = {};
            }
          }
        }
      });
    }
  },
  { immediate: true, deep: true },
);

const baseComponentMap: Record<string, Component> = {
  DCodeTextField,
  DCodeTextarea,
  DCodeAutoComplete,
  DCodeTreePermissions,
  DCodeCardCheckboxList,
  DCodePermissionMenu,
  DCodeBeforeAfter,
  DCodeUploadFile,
  DCodeChekbox,
  DCodeCheckbox: DCodeChekbox,
  DCodeDatePicker,
  DCodeDateRangePicker,
  DCodeSwitch,
  DCodeRadio,
  DCodeImageField,
  DCodeIconDropdown,
  DCodeOtpInput,
  DCodeTextArea: DCodeTextarea,
  DCodeButton,
};

const componentMap = computed(() => ({
  ...baseComponentMap,
  ...(props.extraComponents || {}),
}));

const {
  sortedFields,
  getModelKey,
  resolveProps,
  isFieldVisible,
  isFieldRequired,
  isFieldDisabled,
  getFieldColClass,
  resolveActionLabel,
  resolveEvents,
  generateZodSchema,
} = useDynamicForm(activeSchema, props.model, props);

const resolveComponentProps = (field: any) => {
  const resolved = resolveProps(field);
  if (
    ["DCodePermissionMenu", "DCodeTreePermissions"].includes(field.component)
  ) {
    return {
      ...resolved,
      menuList: props.treeData || [],
      treeData: props.treeData || [],
    };
  }
  return resolved;
};

const finalGlobalActions = computed(() => {
  const schema = activeSchema.value;
  if (!schema) return [];

  const legacyActions = schema.actions || [];
  const globalActions = schema.actionGlobal || [];

  return [...legacyActions, ...globalActions].map((action) => {
    if (action.propsActionGlobal) {
      return {
        ...action,
        ...action.propsActionGlobal,
        key: action.key || action.propsActionGlobal.key,
      };
    }
    return action;
  });
});

const internalErrors = ref<Record<string, string>>({});

const isActionDisabled = (action: ActionDefinition) => {
  const disabledWhen = action.disabledWhen || action.props?.disabledWhen;
  return (
    (disabledWhen === "loading" &&
      (props.loading || submissionLoading.value)) ||
    false
  );
};

const handleActionClick = (action: ActionDefinition) => {
  if (action.requireConfirm) {
    confirmAction.value = action;
    confirmState.value = true;
    return;
  }
  emit("action", action.key, action);
  if (action.key === "cancel") {
    emit("cancel");
  }
};

const getSectionFields = (section: SectionDefinition) => {
  const sProps = (section.propsForm || section.props) as any;
  const fields = sProps?.fields || (section as any).fields || [];
  return [...fields].sort((a: any, b: any) => {
    const seqA = typeof a.seq === "number" ? a.seq : Number.MAX_SAFE_INTEGER;
    const seqB = typeof b.seq === "number" ? b.seq : Number.MAX_SAFE_INTEGER;
    return seqA - seqB;
  });
};

const getSectionTitle = (section: SectionDefinition) => {
  const sProps = (section.propsForm ||
    section.propsTable ||
    section.props) as any;
  const currentLocale = locale.value.toLowerCase();
  const isEnglish = currentLocale === "en" || currentLocale.startsWith("en-");

  if (isEnglish && sProps?.titleEN) return sProps.titleEN;
  if (!isEnglish && sProps?.titleID) return sProps.titleID;
  return sProps?.title || (section as any).title || "";
};

const getSectionDescription = (section: SectionDefinition) => {
  const sProps = (section.propsForm ||
    section.propsTable ||
    section.props) as any;
  const currentLocale = locale.value.toLowerCase();
  const isEnglish = currentLocale === "en" || currentLocale.startsWith("en-");

  if (isEnglish && sProps?.descriptionEN) return sProps.descriptionEN;
  if (!isEnglish && sProps?.descriptionID) return sProps.descriptionID;
  return sProps?.description || (section as any).description || "";
};

const getSectionIcon = (section: SectionDefinition) => {
  const sProps = (section.propsForm ||
    section.propsTable ||
    section.props) as any;
  return sProps?.icon || (section as any).icon || undefined;
};

const getFieldDescription = (field: any) => {
  const props = field.props || {};
  const currentLocale = locale.value.toLowerCase();
  const isEnglish = currentLocale === "en" || currentLocale.startsWith("en-");

  if (isEnglish && props.descriptionEN) return props.descriptionEN;
  if (!isEnglish && props.descriptionID) return props.descriptionID;
  return props.description || "";
};

const getSectionGridClass = (section: SectionDefinition) => {
  return "grid grid-cols-1 md:grid-cols-12 gap-6";
};

const getSectionDefaultSpan = (section: SectionDefinition) => {
  const sProps = (section.propsForm || section.props) as any;
  const cols = sProps?.layoutColumns ?? (section as any).layoutColumns ?? 2;

  if (cols === 1) return "md:col-span-12";
  if (cols === 2) return "md:col-span-6";
  if (cols === 3) return "md:col-span-4";
  if (cols === 4) return "md:col-span-3";

  return "md:col-span-6";
};

const getSectionEndpoint = (section: SectionDefinition) => {
  if (section.endpointTable) return section.endpointTable;

  return (
    (section.props as any)?.endpoint || {
      apiModule: (section as any).apiModule,
      apiAction: (section as any).apiAction,
      apiParams: (section as any).apiParams,
      socket: (section as any).socket,
    }
  );
};

const getTableColumns = (section: SectionDefinition) => {
  const headers = (section.headers ||
    (section.props as any)?.headers ||
    (section as any).columns ||
    []) as any[];

  const currentLocale = locale.value.toLowerCase();
  const isEnglish = currentLocale === "en" || currentLocale.startsWith("en-");

  return headers.map((h) => {
    let custom = h.custom ? { ...h.custom } : null;

    if (custom) {
      const rawActions = custom.actionCustom || custom.action || [];

      if (rawActions.length > 0) {
        custom.action = rawActions.map((a: any) => {
          const props = a.propsActionCustom || a.propsActionGlobal;
          if (!a.key && props?.key) {
            return {
              ...a,
              ...props,
              key: props.key,
            };
          }
          return a;
        });
      }
    }

    return {
      ...h,
      label: (isEnglish ? h.labelEN : h.labelID) || h.label || h.key,
      custom: custom,
    };
  });
};

const getTableActions = (section: SectionDefinition) => {
  let actions = (section.actionTableGlobal ||
    (section.props as any)?.action ||
    (section as any).actions ||
    []) as ActionDefinition[];

  const normalizedActions = actions.map((a: any) => {
    const props = a.propsActionGlobal || a.propsActionCustom || a.props;
    if (!a.key && props?.key) {
      return {
        ...a,
        ...props,
        key: props.key,
      };
    }
    return a;
  });

  const props = (section.propsForm ||
    section.propsTable ||
    section.props) as any;
  const enableDialog = props?.enableDialog !== false;

  if (enableDialog) {
    const hasCreate = normalizedActions.some(
      (a) =>
        a.permission === "CREATE" ||
        (a.key || "").toLowerCase().includes("create") ||
        (a.key || "").toLowerCase().includes("add") ||
        a.openDialog,
    );

    if (!hasCreate) {
      normalizedActions.push({
        key: "add_data_auto",
        permission: "CREATE",
        type: "BUTTON",
        variant: "default",
        bgColor: "primary",
        openDialog: true,
        props: {
          labelEN: "Add Data",
          labelID: "Tambah Data",
          icon: "Plus",
          actionType: "create",
        },
        labelEN: "Add Data",
        labelID: "Tambah Data",
      });
    }
  }

  return normalizedActions;
};

const getActionColumn = (
  section: SectionDefinition,
): TableHeader | undefined => {
  const headers = getTableColumns(section) as TableHeader[];
  return headers.find((h) => h.key === "action");
};

const getActionClass = (action: ActionDefinition) => {
  const key =
    action.key ||
    (action as any).propsActionGlobal?.key ||
    (action as any).props?.key ||
    "";
  if (key.includes("delete") || key.includes("reject"))
    return "text-danger-500 hover:text-danger-700 hover:bg-danger-50";
  if (key.includes("update") || key.includes("edit"))
    return "text-warning-600 hover:bg-warning-50";
  return "text-primary-600 hover:bg-primary-50";
};

const handleTableCreate = (section: SectionDefinition) => {
  const actions = getTableActions(section);
  const createAction = actions.find(
    (a: ActionDefinition) =>
      a.permission === "CREATE" ||
      a.key.includes("create") ||
      a.key.includes("add"),
  );
  if (createAction) {
    handleTableAction(section, createAction);
  }
};

const handleTableAction = (
  section: SectionDefinition,
  action: ActionDefinition,
  row: any = null,
) => {
  const key = getSectionKey(section);
  const openDialog = action.openDialog || action.props?.openDialog;

  if (action.requireConfirm || action.key?.includes("delete")) {
    confirmAction.value = action;
    confirmData.value = row;
    confirmSection.value = section;
    confirmState.value = true;
    return;
  }

  if (openDialog) {
    dialogAction[key] = action;
    if (row) {
      dialogModel[key] = { ...row };
    } else {
      dialogModel[key] = {};
    }
    dialogState[key] = true;
  } else if (
    action.route ||
    action.props?.route ||
    action.path ||
    action.props?.path
  ) {
    emit("action", action.key, { ...action, ...action.props, row });
  } else {
    emit("action", action.key, { ...action, ...action.props, row });
  }
};

const handleConfirm = async () => {
  if (!confirmAction.value) return;

  const action = confirmAction.value;
  const row = confirmData.value;
  const section = confirmSection.value;

  try {
    confirmLoading.value = true;
    emit("action", action.key, { ...action, ...action.props, row });

    if (action.key?.includes("delete") && section && row) {
      const key = getSectionKey(section);
      const parentModel = props.model[key];
      if (Array.isArray(parentModel)) {
        const id = row._id || row.id;
        const index = parentModel.findIndex(
          (item: any) => (item._id || item.id) === id,
        );
        if (index !== -1) {
          parentModel.splice(index, 1);
        }
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  } catch (e) {
    console.error(e);
  } finally {
    confirmLoading.value = false;
    confirmState.value = false;
    confirmAction.value = null;
    confirmData.value = null;
    confirmSection.value = null;
  }
};

const getDialogSchema = (
  section: SectionDefinition,
  action: ActionDefinition,
): FormSchema => {
  let fields =
    (action as any).fieldActionGlobal ||
    (action as any).fieldActionCustom ||
    action.field ||
    (action as any).fields ||
    [];

  if (fields.length === 0 && section.type?.toLowerCase() === "table") {
    const sectionFields = getSectionFields(section);
    if (sectionFields && sectionFields.length > 0) {
      fields = sectionFields;
    } else {
      const actions = getTableActions(section);
      const createAction = actions.find(
        (a: ActionDefinition) =>
          a.permission === "CREATE" ||
          (a.key || "").toLowerCase().includes("create") ||
          (a.key || "").toLowerCase().includes("add") ||
          a.key === "add_data_auto",
      );

      if (createAction) {
        const createFields =
          (createAction as any).fieldActionGlobal ||
          (createAction as any).fieldActionCustom ||
          createAction.field ||
          (createAction as any).fields ||
          [];
        if (createFields.length > 0) {
          fields = createFields;
        }
      }
    }
  }

  return {
    id: `${getSectionKey(section)}-dialog`,
    fields: fields,
    actions: [
      {
        key: "cancel",
        type: "BUTTON",
        label: t("common.cancel") || "Cancel",
        variant: "ghost",
      },
      {
        key: "submit",
        type: "SUBMIT",
        label: t("common.save") || "Save",
        variant: "tonal",
        bgColor: "primary",
      },
    ],
  };
};

const closeSectionDialog = (section: SectionDefinition) => {
  const key = getSectionKey(section);
  dialogState[key] = false;
  dialogAction[key] = null;
};

const handleDialogSubmit = async (section: SectionDefinition, data: any) => {
  const key = getSectionKey(section);
  const parentModel = props.model[key];

  if (!Array.isArray(parentModel)) {
    props.model[key] = [];
  }

  if (data._id || data.id) {
    const id = data._id || data.id;
    const index = props.model[key].findIndex(
      (item: any) => (item._id || item.id) === id,
    );
    if (index !== -1) {
      props.model[key][index] = { ...data };
    } else {
      props.model[key].push({ ...data, _new: true });
    }
  } else {
    const newItem = { ...data, id: Date.now(), _id: Date.now(), _new: true };
    props.model[key].push(newItem);
  }

  closeSectionDialog(section);
};

const validate = () => {
  internalErrors.value = {};
  const schema = generateZodSchema();

  const result = schema.safeParse(props.model);

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (path) {
        internalErrors.value[path] = issue.message;
      }
    });
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  if (!validate()) return;

  if (props.submitModule && props.submitAction) {
    try {
      submissionLoading.value = true;
      const response: any = await api(
        props.submitModule,
        props.submitAction,
        props.model,
      );
      emit("submit", response);
    } catch (e) {
      console.error("Submission failed:", e);
      submissionLoading.value = false;
    } finally {
      submissionLoading.value = false;
    }
  } else {
    emit("submit", props.model);
  }
};

const fetchSchema = async () => {
  if (!props.schemaModule || !props.schemaAction) return;

  try {
    schemaLoading.value = true;
    const response: any = await api(
      props.schemaModule,
      props.schemaAction,
      props.schemaParams,
    );
    if (response) {
      const schemaData = response.data || response.schema || response;
      internalSchema.value = schemaData;
      emit("schemaLoaded", schemaData);
    }
  } catch (e) {
    console.error("Failed to fetch dynamic form schema:", e);
  } finally {
    schemaLoading.value = false;
  }
};

const fetchData = async () => {
  if (!props.apiModule || !props.apiAction) return;

  try {
    dataLoading.value = true;
    fetchError.value = null;
    const response: any = await api(
      props.apiModule,
      props.apiAction,
      props.apiParams,
    );
    if (response) {
      const data = response.data || response;
      Object.assign(props.model, data);

      emit("dataLoaded", data);
    }
  } catch (e: any) {
    fetchError.value = e.message || "Failed to fetch data";
    console.error("Failed to fetch form data:", e);
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => {
  if (!props.schema && props.schemaModule) {
    fetchSchema();
  }
  if (props.apiModule) {
    fetchData();
  }
});

const getSectionBeforeKey = (section: SectionDefinition) => {
  return (
    (section.props as any)?.beforeKey ||
    (section as any).beforeKey ||
    "dataBefore"
  );
};

const getSectionAfterKey = (section: SectionDefinition) => {
  return (
    (section.props as any)?.afterKey || (section as any).afterKey || "dataAfter"
  );
};

watch(
  () => [props.schemaModule, props.schemaAction],
  () => {
    if (!props.schema && props.schemaModule) fetchSchema();
  },
  { deep: true },
);

watch(
  () => [props.apiModule, props.apiAction, props.apiParams],
  () => {
    if (props.apiModule) fetchData();
  },
  { deep: true },
);

const getConfirmMessage = (action: ActionDefinition | null) => {
  if (!action) return "";
  const msg = action.propCustomMessage;
  if (!msg)
    return (
      t("common.confirmAction") ||
      "Are you sure you want to proceed with this action?"
    );

  if (typeof msg === "string") return msg;

  const currentLocale = locale.value.toLowerCase();
  const isEnglish = currentLocale === "en" || currentLocale.startsWith("en-");

  if (isEnglish && msg.messageEN) return msg.messageEN;
  if (!isEnglish && msg.messageID) return msg.messageID;
  return msg.messageEN || msg.messageID || "Are you sure?";
};

const getConfirmTitle = (action: ActionDefinition | null) => {
  if (!action) return "Confirmation";

  const msg = action.propCustomMessage;
  if (msg && typeof msg === "object") {
    const currentLocale = locale.value.toLowerCase();
    const isEnglish = currentLocale === "en" || currentLocale.startsWith("en-");

    if (isEnglish && msg.titleEN) return msg.titleEN;
    if (!isEnglish && msg.titleID) return msg.titleID;
  }

  return resolveActionLabel(action);
};
</script>
