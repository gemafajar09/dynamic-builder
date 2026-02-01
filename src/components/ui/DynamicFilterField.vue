<template>
  <div v-if="field.isHidden">
    <input type="hidden" :value="internalValue" :name="field.model" />
  </div>
  <component :is="fieldComponent" v-else v-bind="componentProps" v-model="internalValue"
    @update:model-value="handleUpdate" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Import all possible input components
import InputCheckbox from '@/components/inputs/InputCheckbox.vue';
import InputDate from '@/components/inputs/InputDate.vue';
import InputPhone from '@/components/inputs/InputPhone.vue';
import InputRadio from '@/components/inputs/InputRadio.vue';
import InputRupiah from '@/components/inputs/InputRupiah.vue';
import InputSelect from '@/components/inputs/InputSelect.vue';
import InputText from '@/components/inputs/InputText.vue';
import InputTextarea from '@/components/inputs/InputTextarea.vue';

// Import DCode components
import DCodeAutoComplete from '@/components/base/DCodeAutoComplete.vue';
import DCodeChekbox from '@/components/base/DCodeChekbox.vue';
import DCodeDatePicker from '@/components/base/DCodeDatePicker.vue';
import DCodeDateRangePicker from '@/components/base/DCodeDateRangePicker.vue';
import DCodeImageField from '@/components/base/DCodeImageField.vue';
import DCodeOtpInput from '@/components/base/DCodeOtpInput.vue';
import DCodeSwitch from '@/components/base/DCodeSwitch.vue';
import DCodeTextarea from '@/components/base/DCodeTextarea.vue';
import DCodeTextField from '@/components/base/DCodeTextField.vue';

const { locale } = useI18n();

interface FieldConfig {
  key: string;
  component: string;
  model: string;
  seq?: number;
  column?: string;
  isHidden?: boolean;
  props: {
    labelID?: string;
    labelEN?: string;
    placeholderID?: string;
    placeholderEN?: string;
    valueType?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: string | number;
    max?: string | number;
    options?: any[];
    endpoint?: any;
    itemTitle?: string;
    itemValue?: string;
    returnObject?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    [key: string]: any;
  };
}

interface Props {
  field: FieldConfig;
  modelValue?: any;
}

interface Emits {
  (e: 'update:modelValue', value: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalValue = ref(props.modelValue);

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  internalValue.value = newVal;
});

// Component mapping
const componentMap: Record<string, any> = {
  // Input components
  InputText,
  InputSelect,
  InputDate,
  InputTextarea,
  InputCheckbox,
  InputRadio,
  InputPhone,
  InputRupiah,

  // DCode components
  DCodeTextField,
  DCodeAutoComplete,
  DCodeDatePicker,
  DCodeDateRangePicker,
  DCodeTextarea,
  DCodeTextArea: DCodeTextarea, // Alias (API return DCodeTextArea)
  DCodeChekbox,
  DCodeCheckbox: DCodeChekbox, // Alias for typo
  DCodeSwitch,
  DCodeOtpInput,
  DCodeImageField,
};

// Get the correct component
const fieldComponent = computed(() => {
  const componentName = props.field.component;
  return componentMap[componentName] || null;
});

// Build component props based on locale and field config
const componentProps = computed(() => {
  const fieldProps = props.field.props;
  const baseProps: Record<string, any> = {};

  // Handle label (locale-aware)
  if (fieldProps.labelID || fieldProps.labelEN) {
    baseProps.label = locale.value === 'id' ? fieldProps.labelID : fieldProps.labelEN;
  }

  // Handle placeholder (locale-aware)
  if (fieldProps.placeholderID || fieldProps.placeholderEN) {
    baseProps.placeholder = locale.value === 'id' ? fieldProps.placeholderID : fieldProps.placeholderEN;
  }

  // Handle required
  if (fieldProps.required !== undefined) {
    baseProps.required = fieldProps.required;
  }

  // Handle disabled
  if (fieldProps.disabled !== undefined) {
    baseProps.disabled = fieldProps.disabled;
  }

  // Handle readonly
  if (fieldProps.readonly !== undefined) {
    baseProps.readonly = fieldProps.readonly;
  }

  // Handle type/valueType
  if (fieldProps.valueType) {
    baseProps.type = fieldProps.valueType;
  }

  // Handle min/max length
  if (fieldProps.minLength !== undefined) {
    baseProps.minlength = fieldProps.minLength;
  }
  if (fieldProps.maxLength !== undefined) {
    baseProps.maxlength = fieldProps.maxLength;
  }

  // Handle min/max for date/number inputs
  if (fieldProps.min !== undefined) {
    baseProps.min = fieldProps.min;
  }
  if (fieldProps.max !== undefined) {
    baseProps.max = fieldProps.max;
  }

  // Handle options for select/autocomplete
  if (fieldProps.options) {
    baseProps.options = fieldProps.options;
  }

  // Handle autocomplete specific props
  if (fieldProps.endpoint) {
    baseProps.endpoint = fieldProps.endpoint;
  }
  if (fieldProps.itemTitle) {
    baseProps.itemTitle = fieldProps.itemTitle;
  }
  if (fieldProps.itemValue) {
    baseProps.itemValue = fieldProps.itemValue;
  }
  if (fieldProps.returnObject !== undefined) {
    baseProps.returnObject = fieldProps.returnObject;
  }
  if (fieldProps.clearable !== undefined) {
    baseProps.clearable = fieldProps.clearable;
  }

  // Pass through any other props
  Object.keys(fieldProps).forEach((key) => {
    if (!['labelID', 'labelEN', 'placeholderID', 'placeholderEN'].includes(key) &&
      !baseProps.hasOwnProperty(key)) {
      baseProps[key] = fieldProps[key];
    }
  });

  return baseProps;
});

// Handle value updates
const handleUpdate = (value: any) => {
  internalValue.value = value;
  emit('update:modelValue', value);
};
</script>
