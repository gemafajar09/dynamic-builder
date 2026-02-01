<!-- DCodeWizardTabs.vue
✅ Active tab style seperti screenshot (bg biru muda + teks biru + icon box)
✅ TANPA indikator bar biru kiri
✅ Klik tab => hit API pakai useApi().DCodeApi
✅ Balik tab yang sudah load => tidak hit API lagi (cache per tab.key)
✅ Konten beda per tab via slot: #tab-a, #tab-b, dst
-->
<script setup lang="ts">
import type { Component } from "vue"
import { computed, reactive, ref, watch } from "vue"

import { useApi } from "@/composables/useApi"
import type { ApiModule } from "@/types/api-request"

// shadcn-vue
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type ApiOptions = Record<string, any>

export type WizardTab = {
    key: string
    title: string
    description?: string
    icon?: Component
    disabled?: boolean

    apiModule?: ApiModule
    apiAction?: string
    apiParams?: any

    endpoint?: {
        apiModule?: ApiModule
        apiAction?: string
        apiUrl?: string
        apiMethod?: string
    }
}

type TabCtx = { tabIndex: number; tab: WizardTab }

type TabState = {
    loaded: boolean
    loading: boolean
    data: any
    error: string | null
}

const props = withDefaults(
    defineProps<{
        tabs: WizardTab[]

        modelValue?: number
        defaultTab?: number
        allowTabClick?: boolean
        disabled?: boolean

        cache?: boolean
        autoFetchOnMount?: boolean

        apiOptions?: ApiOptions | (() => ApiOptions | undefined)
    }>(),
    {
        defaultTab: 0,
        allowTabClick: true,
        disabled: false,
        cache: true,
        autoFetchOnMount: true,
        apiOptions: undefined,
    }
)

const emit = defineEmits<{
    (e: "update:modelValue", v: number): void
    (e: "change", v: TabCtx): void
    (e: "loaded", v: TabCtx & { data: any }): void
    (e: "error", v: TabCtx & { message: string }): void
}>()

const apiComposable: any = useApi()
const DCodeApi = apiComposable?.DCodeApi

if (typeof DCodeApi !== "function") {
    console.error("[DCodeWizardTabs] useApi() must expose DCodeApi()")
}

const internal = ref<number>(props.defaultTab)

const current = computed<number>({
    get() {
        return props.modelValue ?? internal.value
    },
    set(v) {
        if (props.modelValue !== undefined) emit("update:modelValue", v)
        else internal.value = v
    },
})

const total = computed(() => props.tabs?.length ?? 0)
const currentTab = computed(() => props.tabs?.[current.value])

function clampIndex(n: number) {
    if (total.value <= 0) return 0
    return Math.min(Math.max(n, 0), total.value - 1)
}

const tabStates = reactive<Record<string, TabState>>({})

function ensureState(tab: WizardTab) {
    if (!tabStates[tab.key]) {
        tabStates[tab.key] = { loaded: false, loading: false, data: null, error: null }
    }
    return tabStates[tab.key]
}

function resolveApiOptions(): ApiOptions | undefined {
    if (!props.apiOptions) return undefined
    if (typeof props.apiOptions === "function") return props.apiOptions()
    return props.apiOptions
}

function resolvedEndpointOf(tab: WizardTab) {
    const e = tab.endpoint || {}
    return {
        apiModule: tab.apiModule || e.apiModule,
        apiAction: tab.apiAction || e.apiAction,
        apiUrl: e.apiUrl,
        apiMethod: e.apiMethod || "GET",
        apiParams: tab.apiParams,
    }
}

function tabClickable(i: number) {
    if (!props.allowTabClick) return false
    if (props.disabled) return false
    const t = props.tabs[i]
    if (!t || t.disabled) return false
    return true
}

async function fetchTabData(ctx: TabCtx) {
    if (typeof DCodeApi !== "function") throw new Error("DCodeApi is not available")

    const ep = resolvedEndpointOf(ctx.tab)
    const canFetch = (ep.apiModule && ep.apiAction) || ep.apiUrl
    if (!canFetch) throw new Error(`Tab "${ctx.tab.key}" missing apiModule/apiAction or endpoint.apiUrl`)

    const options = resolveApiOptions()

    let res: any
    if (ep.apiUrl) {
        res = await DCodeApi("", "", options, {
            _url: ep.apiUrl,
            _method: ep.apiMethod || "POST",
            _data: ep.apiParams ?? undefined,
        })
    } else {
        const mergedOptions = { ...(options ?? {}), ...(ep.apiParams ?? {}) }
        res = await DCodeApi(ep.apiModule, ep.apiAction as any, mergedOptions)
    }

    const raw = (res as any)?.data ?? res
    const data = raw?.data ?? raw
    return data
}

async function loadTab(i: number, { force = false }: { force?: boolean } = {}) {
    const idx = clampIndex(i)
    const tab = props.tabs[idx]
    if (!tab) return

    const st = ensureState(tab)

    if (props.cache && st.loaded && !force) return
    if (st.loading) return

    st.loading = true
    st.error = null

    try {
        const data = await fetchTabData({ tabIndex: idx, tab })
        st.data = data
        st.loaded = true
        emit("loaded", { tabIndex: idx, tab, data })
    } catch (e: any) {
        const msg =
            (typeof e?.message === "string" && e.message) ||
            (typeof e === "string" && e) ||
            "Failed to load tab data."
        st.error = msg
        emit("error", { tabIndex: idx, tab, message: msg })
    } finally {
        st.loading = false
    }
}

function goTo(i: number) {
    const idx = clampIndex(i)
    if (!tabClickable(idx)) return
    if (idx === current.value) return
    current.value = idx
}

function reload(i = current.value) {
    return loadTab(i, { force: true })
}

watch(
    () => props.tabs,
    (tabs) => {
        for (const t of tabs ?? []) ensureState(t)
    },
    { immediate: true }
)

watch(
    () => current.value,
    async (v) => {
        const tab = props.tabs?.[v]
        if (tab) emit("change", { tabIndex: v, tab })
        await loadTab(v)
    },
    { immediate: true }
)

watch(
    () => props.autoFetchOnMount,
    async (v) => {
        if (v) await loadTab(current.value)
    },
    { immediate: true }
)
</script>

<template>
    <Card class="w-full">
        <CardHeader>
            <!-- <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <CardTitle class="text-lg">{{ currentTab?.title ?? "Tabs Preview" }}</CardTitle>
                    <CardDescription class="mt-1">
                        <span v-if="currentTab?.description">{{ currentTab.description }}</span>
                        <span v-else>Tab {{ current + 1 }} of {{ total }}</span>
                    </CardDescription>
                </div>

                <div class="text-xs text-muted-foreground whitespace-nowrap">
                    {{ current + 1 }} / {{ total }}
                </div>
            </div> -->

            <!-- ✅ Tabs header (active seperti screenshot, tanpa bar kiri) -->
            <div class="mt-4">
                <div class="flex flex-wrap gap-2">
                    <Button v-for="(t, i) in tabs" :key="t.key" type="button" variant="ghost"
                        :disabled="!tabClickable(i)" @click="goTo(i)"
                        class="h-12 inline-flex w-auto justify-start gap-3 rounded-xl px-4 text-left transition" :class="cn(
                            // ✅ ACTIVE: primary-700 (bg solid) + text putih
                            i === current &&
                            '!bg-primary-700 !text-white hover:!bg-primary-700/90 shadow-sm ' +
                            'dark:!bg-primary-900 dark:!text-white dark:hover:!bg-primary-900/70',

                            // ✅ INACTIVE: terang + dark mode
                            i !== current &&
                            '!bg-slate-200 !text-slate-900 hover:!bg-slate-300 ' +
                            'dark:!bg-neutral-800/70 dark:!text-neutral-100 dark:hover:!bg-neutral-800/90',

                            // ✅ DISABLED
                            !tabClickable(i) && 'opacity-60 cursor-not-allowed'
                        )">
                        <!-- icon box -->
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg transition" :class="cn(
                            // ACTIVE: icon box sedikit lebih terang, text tetap putih
                            i === current
                                ? '!bg-white/15 !text-white'
                                : 'bg-white/60 text-slate-900 dark:bg-black/20 dark:text-neutral-100'
                        )">
                            <component v-if="t.icon" :is="t.icon" class="h-5 w-5" />
                            <span v-else class="text-sm font-semibold">{{ i + 1 }}</span>
                        </span>

                        <!-- text -->
                        <span class="min-w-0">
                            <span class="block text-sm font-semibold truncate">
                                {{ t.title }}
                            </span>
                            <span v-if="t.description" class="block text-xs truncate opacity-80"
                                :class="cn(i === current ? '!text-white/90' : '')">
                                {{ t.description }}
                            </span>
                        </span>
                    </Button>
                </div>
            </div>
        </CardHeader>

        <Separator />

        <CardContent class="pt-6">
            <template v-if="currentTab">
                <template v-if="tabStates[currentTab.key]?.loading">
                    <slot name="loading" :tab="currentTab" :tabIndex="current">
                        <div class="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Loading...
                        </div>
                    </slot>
                </template>

                <!-- <template v-else-if="tabStates[currentTab.key]?.error">
                    <slot name="error" :tab="currentTab" :tabIndex="current" :message="tabStates[currentTab.key]?.error"
                        :reload="reload">
                        <div
                            class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {{ tabStates[currentTab.key]?.error }}
                            <Button class="ml-3" size="sm" variant="outline" @click="reload()">Retry</Button>
                        </div>
                    </slot>
                </template> -->

                <template v-else>
                    <slot :name="`tab-${currentTab.key}`" :tab="currentTab" :tabIndex="current"
                        :data="tabStates[currentTab.key]?.data" :loaded="tabStates[currentTab.key]?.loaded"
                        :reload="reload">
                        <div class="text-sm text-muted-foreground">
                            Slot <code class="px-1">tab-{{ currentTab.key }}</code> belum dibuat.
                        </div>
                    </slot>
                </template>
            </template>
        </CardContent>
    </Card>
</template>
