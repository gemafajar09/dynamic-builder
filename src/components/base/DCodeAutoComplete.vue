<script lang="ts" setup>
import { useApi } from "@/composables/useApi";
import type { ApiModule } from "@/types/api-request";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/vue";
import { ChevronDown } from "lucide-vue-next";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import { toast } from "vue3-toastify";

const props = withDefaults(
  defineProps<{
    modelValue: string | number | object | any[] | null | undefined;
    apiModule?: ApiModule;
    apiAction?: string;
    apiOptions?: ApiOptions | (() => ApiOptions | undefined);
    autoFetchOnOpen?: boolean;
    autoFetchOnMount?: boolean;
    visible?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    skeleton?: boolean;
    error?: string | null;
    errorMessage?: string | null;
    itemTitle?: string | ((item: any) => string);
    itemValue?: string | ((item: any) => any);
    returnObject?: boolean;
    endpoint?: {
      apiModule?: ApiModule;
      apiAction?: string;
      apiUrl?: string;
      apiMethod?: string;
    };
    apiParams?: Record<string, any>;
  }>(),
  {
    autoFetchOnOpen: true,
    autoFetchOnMount: false,
    visible: true,
    clearable: false,
    disabled: false,
    skeleton: false,
    error: null,
    errorMessage: null,
    itemTitle: "name",
    itemValue: "id",
    returnObject: false,
    apiParams: () => ({}),
  },
);

const emit = defineEmits(["update:modelValue"]);

defineOptions({
  name: "DCodeAutoComplete",
  inheritAttrs: false,
});

type RuleFn = (v: any) => boolean | string;

const attrs = useAttrs();
const label = computed(() => (attrs.label as string | undefined) ?? undefined);

const attrBool = (key: string) => {
  const v = (attrs as any)[key];
  return v === "" || v === true || v === "true" || v === 1 || v === "1";
};

const isUserClear = ref(false);

// const visible = computed(() => {
//   const v = (attrs as any).visible;
//   if (v === undefined) return true;
//   return attrBool("visible");
// });

// compat: item-title / itemTitle, item-value / itemValue
const itemTitleKey = computed(
  () =>
    props.itemTitle ||
    (attrs as any)["item-title"] ||
    (attrs as any).itemTitle ||
    "name",
);
const itemValueKey = computed(
  () =>
    props.itemValue ||
    (attrs as any)["item-value"] ||
    (attrs as any).itemValue ||
    "id",
);

const disabled = computed(() => props.disabled);
const clearable = computed(() => attrBool("clearable"));
const required = computed(() => attrBool("required"));
// const disabled = computed(() => attrBool("disabled"));
const readonly = computed(() => attrBool("readonly"));
const returnObject = computed(
  () =>
    props.returnObject || attrBool("return-object") || attrBool("returnObject"),
);
const isRequired = computed(() => required.value || attrBool("aria-required"));

const effectiveError = computed(
  () => props.error || props.errorMessage || (attrs as any)["error-message"],
);

const placeholder = computed(
  () => (attrs.placeholder as string | undefined) ?? "",
);
const minChars = computed(() => {
  const v = (attrs as any).minChars ?? (attrs as any)["min-chars"];
  if (v === undefined || v === null || v === "") return 0;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
});

const rules = computed<RuleFn[]>(() => {
  const r = (attrs as any).rules as RuleFn[] | undefined;
  return Array.isArray(r) ? r : [];
});

type ApiOptions = Record<string, any>;

const elementId = computed(() => {
  const _elementIdToken = (attrs as any).id || (attrs as any).label;
  return _elementIdToken
    ? `app-autocomplete-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}`
    : undefined;
});

const localValue = ref<any>(props.modelValue);

const internalItems = ref<any[]>([]);
const isLoadingOptions = ref(false);
const hasLoadedOnce = ref(false);

const externalItems = computed<any[] | undefined>(() => {
  return (attrs as any).items as any[] | undefined;
});

const effectiveItems = computed<any[]>(() => {
  const ep = resolvedEndpoint.value;
  const isApi = (ep.apiModule && ep.apiAction) || ep.apiUrl;
  if (isApi) return internalItems.value;
  return externalItems.value ?? [];
});

const externalLoading = computed<boolean>(() =>
  Boolean((attrs as any).loading),
);
const effectiveLoading = computed<boolean>(
  () => externalLoading.value || isLoadingOptions.value,
);

const inputAttrs = computed(() => {
  const {
    label,
    items,
    loading,
    rules,
    "item-title": _it,
    "item-value": _iv,
    itemTitle,
    itemValue,
    minChars,
    "min-chars": _minChars,
    clearable,
    required: _required,
    "aria-required": _ariaRequired,
    disabled,
    readonly,
    visible,
    "return-object": _ro,
    returnObject,
    class: _class,
    ...rest
  } = (attrs as any) || {};
  return rest;
});

const resolveApiOptions = (): ApiOptions | undefined => {
  if (!props.apiOptions) return undefined;
  if (typeof props.apiOptions === "function") return props.apiOptions();
  return props.apiOptions;
};

const resolvedEndpoint = computed(() => {
  const e = props.endpoint || {};
  return {
    apiModule: props.apiModule || e.apiModule,
    apiAction: props.apiAction || e.apiAction,
    apiUrl: e.apiUrl,
    apiMethod: e.apiMethod || "GET",
  };
});

// --- UI state
const rootEl = ref<HTMLElement | null>(null);
const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);
const { floatingStyles } = useFloating(reference, floating, {
  placement: "bottom-start",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(4),
    flip(),
    shift(),
    size({
      apply({ rects, elements }) {
        Object.assign(elements.floating.style, {
          width: `${rects.reference.width}px`,
        });
      },
    }),
  ],
});

const isOpen = ref(false);
const query = ref("");
const highlightedIndex = ref(-1);
const errorMsg = ref<string | null>(null);
const minCharsHint = computed(() => {
  if (!minChars.value) return "";
  const q = (query.value || "").trim();
  if (q.length >= minChars.value) return "";
  return `Ketik minimal ${minChars.value} karakter`;
});

const getTitle = (item: any) => {
  if (item == null) return "";
  if (typeof item === "string" || typeof item === "number") return String(item);

  const keyOrFn = itemTitleKey.value;
  if (typeof keyOrFn === "function") return keyOrFn(item);

  return (item?.[keyOrFn] ??
    item?.name ??
    item?.nama ??
    item?.label ??
    item?.title ??
    "-") as string;
};

const getValue = (item: any) => {
  if (item == null) return null;
  if (typeof item === "string" || typeof item === "number") return item;

  const keyOrFn = itemValueKey.value;
  if (typeof keyOrFn === "function") return keyOrFn(item);

  return item?.[keyOrFn] ?? item?.id ?? item?.value ?? item?.code ?? null;
};

const selectedLabel = computed(() => {
  const v = localValue.value;

  if (v == null || v === "") return "";
  if (Array.isArray(v)) {
    if (!v.length) return "";
    const labels = v.map((item) => {
      if (returnObject.value && typeof item === "object") return getTitle(item);
      if (typeof item === "object") return getTitle(item);
      const match = effectiveItems.value.find((it) => getValue(it) === item);
      return match ? getTitle(match) : String(item);
    });
    return labels.join(", ");
  }

  if (typeof v === "object") {
    return getTitle(v);
  }

  const match = effectiveItems.value.find((it) => getValue(it) === v);
  if (match) return getTitle(match);

  return String(v);
});

const filteredItems = computed(() => {
  const list = effectiveItems.value || [];
  const q = (query.value || "").trim().toLowerCase();

  const currentLabel = (selectedLabel.value || "").toLowerCase();
  const showAll = !q || q === currentLabel;

  let result = list;
  if (!showAll) {
    result = list.filter((it) => getTitle(it).toLowerCase().includes(q));
  }

  if (result.length > 0) {
    const isSelected = (item: any) => {
      const val = getValue(item);
      if (Array.isArray(localValue.value)) {
        return localValue.value.some((v: any) => v == val);
      }
      return localValue.value == val;
    };

    result = [...result].sort((a, b) => {
      const selA = isSelected(a);
      const selB = isSelected(b);
      if (selA && !selB) return -1;
      if (!selA && selB) return 1;
      return 0;
    });
  }

  return result;
});

const isEmptyValue = (v: any) => {
  if (Array.isArray(v)) return v.length === 0;
  return v === null || v === undefined || v === "";
};

const runRules = (v: any) => {
  errorMsg.value = null;

  if (required.value && isEmptyValue(v)) {
    if (!rules.value.length) {
      errorMsg.value = "This field is required";
      return false;
    }
  }

  for (const fn of rules.value) {
    const res = fn(v);
    if (res === false) {
      errorMsg.value = "Invalid value";
      return false;
    }
    if (typeof res === "string") {
      errorMsg.value = res;
      return false;
    }
  }
  return true;
};

const openDropdown = async () => {
  if (disabled.value || readonly.value) return;
  isOpen.value = true;
  highlightedIndex.value = filteredItems.value.length ? 0 : -1;

  query.value = selectedLabel.value || "";

  const ep = resolvedEndpoint.value;
  const canFetch = (ep.apiModule && ep.apiAction) || ep.apiUrl;

  if (props.autoFetchOnOpen && canFetch && !hasLoadedOnce.value) {
    await fetchOptions();
    highlightedIndex.value = filteredItems.value.length ? 0 : -1;
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  highlightedIndex.value = -1;
  query.value = selectedLabel.value || "";
};

const selectItem = (item: any) => {
  const nextVal = returnObject.value ? item : getValue(item);

  let normalizedVal: any = nextVal;
  if (Array.isArray(localValue.value)) {
    normalizedVal = [nextVal];
  }

  localValue.value = normalizedVal;
  emit("update:modelValue", normalizedVal);

  runRules(normalizedVal);

  query.value = getTitle(item);
  closeDropdown();
};

const clearValue = () => {
  isUserClear.value = true;

  const nextVal = Array.isArray(localValue.value) ? [] : null;
  localValue.value = nextVal;
  emit("update:modelValue", nextVal);

  query.value = "";
  runRules(nextVal);

  closeDropdown();

  setTimeout(() => {
    isUserClear.value = false;
  }, 0);
};

const onInput = (e: Event) => {
  if (disabled.value || readonly.value) return;
  const v = (e.target as HTMLInputElement).value;
  query.value = v;

  if (!isOpen.value) isOpen.value = true;

  // reset highlight ke atas
  highlightedIndex.value = filteredItems.value.length ? 0 : -1;

  // auto fetch saat user mulai ketik tapi belum pernah load
  const canFetch =
    (resolvedEndpoint.value.apiModule && resolvedEndpoint.value.apiAction) ||
    resolvedEndpoint.value.apiUrl;
  if (
    props.autoFetchOnOpen &&
    canFetch &&
    !effectiveLoading.value &&
    !hasLoadedOnce.value
  ) {
    void fetchOptions();
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (disabled.value || readonly.value) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!isOpen.value) {
      void openDropdown();
      return;
    }
    if (!filteredItems.value.length) return;
    highlightedIndex.value = Math.min(
      highlightedIndex.value + 1,
      filteredItems.value.length - 1,
    );
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (!isOpen.value) return;
    if (!filteredItems.value.length) return;
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
  }

  if (e.key === "Enter") {
    if (!isOpen.value) return;
    e.preventDefault();
    const idx = highlightedIndex.value;
    if (idx >= 0 && idx < filteredItems.value.length) {
      selectItem(filteredItems.value[idx]);
    }
  }

  if (e.key === "Escape") {
    e.preventDefault();
    closeDropdown();
  }

  if (e.key === "Tab") {
    closeDropdown();
  }
};

const fetchOptions = async () => {
  const ep = resolvedEndpoint.value;
  const canFetch = (ep.apiModule && ep.apiAction) || ep.apiUrl;
  if (!canFetch) return;

  const apiComposable: any = useApi();
  const DCodeApi = apiComposable.DCodeApi;
  if (typeof DCodeApi !== "function") {
    console.error("[DCodeAutoComplete] useApi() must expose DCodeApi()");
    return;
  }

  const baseOptions = resolveApiOptions() || {};
  // Merge apiParams into options so they are handled correctly by callApi:
  // - GET: config.params (Query String)
  // - POST: config.data (Body Payload)
  const options = { ...baseOptions, ...props.apiParams };

  isLoadingOptions.value = true;
  try {
    let res: any;
    if (ep.apiUrl) {
      // Use DCodeApi with URL override
      res = await DCodeApi("", "", options, {
        _url: ep.apiUrl,
        _method: ep.apiMethod || "POST",
      });
    } else {
      res = await DCodeApi(ep.apiModule, ep.apiAction as any, options);
    }

    // fleksibel parsing
    const raw = (res as any)?.data ?? res;
    const list = raw?.data ?? raw;

    internalItems.value = Array.isArray(list) ? list : [];
    hasLoadedOnce.value = true;
  } catch (error: any) {
    console.error("[DCodeAutoComplete][fetchOptions] ERROR:", error);
    // showError(error?.message ?? "Failed to load options");
  } finally {
    isLoadingOptions.value = false;
  }
};

const isSelected = (item: any) => {
  const itemVal = getValue(item);

  if (returnObject.value) {
    if (!localValue.value) return false;

    if (!Array.isArray(localValue.value)) {
      return getValue(localValue.value) == itemVal;
    }

    return localValue.value.some((v: any) => getValue(v) == itemVal);
  }

  if (Array.isArray(localValue.value)) {
    return localValue.value.some((v: any) => v == itemVal);
  }

  return localValue.value == itemVal;
};

watch(
  () => [resolveApiOptions(), resolvedEndpoint.value, props.apiParams],
  ([newOpts, _newEp, newParams], [oldOpts, _oldEp, oldParams]) => {
    const ep = resolvedEndpoint.value;
    const canFetch = (ep.apiModule && ep.apiAction) || ep.apiUrl;

    // If endpoint is suppressed (strict cascade), CLEAR everything and return
    if (!canFetch) {
      internalItems.value = [];
      hasLoadedOnce.value = false;
      localValue.value = null;
      emit("update:modelValue", null);
      query.value = "";
      errorMsg.value = null;
      return;
    }

    const sameOpts =
      JSON.stringify(newOpts ?? null) === JSON.stringify(oldOpts ?? null);
    const sameParams =
      JSON.stringify(newParams ?? null) === JSON.stringify(oldParams ?? null);

    console.log("[DCodeAutoComplete] Watcher Triggered:", {
      newParams,
      oldParams,
      sameParams,
      key: attrs.id || attrs.label,
    });

    if (sameOpts && sameParams) return;

    internalItems.value = [];
    hasLoadedOnce.value = false;

    localValue.value = null;
    emit("update:modelValue", null);

    query.value = "";
    errorMsg.value = null;

    if (!sameParams) {
      fetchOptions();
    }
  },
  { deep: true },
);

watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    localValue.value = newVal;

    if (
      !isUserClear.value &&
      (newVal === null || newVal === undefined || newVal === "") &&
      oldVal != null &&
      props.apiModule &&
      props.apiAction
    ) {
      internalItems.value = [];
      hasLoadedOnce.value = false;
    }

    query.value = selectedLabel.value || "";
  },
  { immediate: true },
);

const epOnMount = resolvedEndpoint.value;
const canFetchOnMount =
  (epOnMount.apiModule && epOnMount.apiAction) || epOnMount.apiUrl;
if (
  canFetchOnMount &&
  (props.autoFetchOnMount || !isEmptyValue(props.modelValue))
) {
  void fetchOptions();
}

const onDocClick = (e: MouseEvent) => {
  const el = rootEl.value;
  const fl = floating.value;
  const target = e.target as Node;

  if (el && el.contains(target)) return;
  if (fl && fl.contains(target)) return;

  if (isOpen.value) closeDropdown();
};

const hasValue = computed(() => {
  const v: any = props.modelValue;

  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;

  return true;
});

const showClear = computed(
  () => Boolean(props.clearable) && hasValue.value && !props.disabled,
);

onMounted(() => {
  document.addEventListener("mousedown", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocClick);
});
</script>

<template>
  <div
    v-show="visible"
    ref="rootEl"
    class="w-full"
    :class="(attrs as any).class"
    :aria-busy="skeleton"
  >
    <template v-if="skeleton">
      <div
        v-if="label"
        class="mb-1 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
      />
      <div
        class="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
      />
    </template>

    <template v-else>
      <label
        v-if="label"
        :for="elementId"
        class="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {{ label }}
        <span v-if="isRequired" class="ml-1 text-destructive">*</span>
      </label>

      <div class="relative">
        <div
          ref="reference"
          class="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900 border-gray-300 dark:border-gray-700 h-10 focus-within:ring-1 focus-within:ring-gray-700 dark:focus-within:ring-gray-300"
          :class="[
            disabled || readonly ? 'opacity-60 cursor-not-allowed' : '',
            errorMsg || effectiveError
              ? 'border-red-500 focus-within:ring-red-500'
              : '',
          ]"
        >
          <input
            v-bind="inputAttrs"
            :id="elementId"
            type="text"
            class="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            :class="disabled || readonly ? 'cursor-not-allowed' : 'cursor-text'"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :value="isOpen ? query : selectedLabel || query"
            @focus="
              () => {
                if (!isOpen) openDropdown();
              }
            "
            @click="
              () => {
                if (!isOpen) openDropdown();
              }
            "
            @input="onInput"
            @keydown="onKeydown"
            @blur="() => runRules(localValue)"
          />

          <svg
            v-if="effectiveLoading"
            class="h-6 w-6 animate-spin text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>

          <button
            v-else-if="showClear"
            type="button"
            class="shrink-0 rounded-md px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            @mousedown.prevent
            @click.stop="clearValue"
            aria-label="Clear"
          >
            ✕
          </button>

          <button
            v-else
            type="button"
            class="shrink-0 rounded-md px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            @click="isOpen ? closeDropdown() : openDropdown()"
            aria-label="Toggle"
          >
            <span v-if="!isOpen">
              <ChevronDown class="h-4 w-4" />
            </span>
            <span v-else>
              <ChevronDown class="h-4 w-4" />
            </span>
          </button>
        </div>

        <Teleport to="body">
          <div
            v-if="isOpen"
            ref="floating"
            :style="floatingStyles"
            class="z-[9999] overflow-hidden rounded-lg border bg-white shadow-lg border-gray-200 dark:border-gray-700 dark:bg-neutral-900"
          >
            <div class="max-h-64 overflow-auto">
              <template v-if="filteredItems.length">
                <button
                  v-for="(it, i) in filteredItems"
                  :key="getValue(it) ?? i"
                  type="button"
                  class="w-full flex justify-between text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  :class="
                    i === highlightedIndex
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : ''
                  "
                  @mouseenter="highlightedIndex = i"
                  @mousedown.prevent
                  @click="selectItem(it)"
                >
                  {{ getTitle(it) }}
                  <span v-if="isSelected(it)"> ✓ </span>
                </button>
              </template>

              <template v-else>
                <slot name="no-data">
                  <div
                    class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span v-if="effectiveLoading">Loading data…</span>
                    <span v-else-if="minCharsHint">{{ minCharsHint }}</span>
                    <span v-else>No data available</span>
                  </div>
                </slot>
              </template>
            </div>
          </div>
        </Teleport>
      </div>

      <p v-if="errorMsg || effectiveError" class="mt-1 text-xs text-red-600">
        {{ errorMsg || effectiveError }}
      </p>
    </template>
  </div>
</template>
