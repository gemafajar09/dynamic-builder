<template>
    <div class="space-y-6">
        <DataTable :columns="columns" :permission-base="permissionBase" :has-actions="false">
            <!-- Filter Form Slot (opsional) -->
            <template #filter-form="{ filters }">
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <InputText id="keyword" v-model="filters.keyword" placeholder="Search..." label="Keyword"
                            class="col-span-4 w-full" />
                    </div>
                </div>
            </template>

            <!-- Filter Footer Slot -->
            <template #filter-footer="{ fetch, reset }">
                <div class="flex justify-end gap-2 w-full">
                    <SheetClose as-child>
                        <Button variant="outline" type="button" @click="reset">Reset</Button>
                    </SheetClose>
                    <SheetClose as-child>
                        <Button type="submit" @click="fetch">Search</Button>
                    </SheetClose>
                </div>
            </template>

            <!-- Optional: empty slot kalau DataTable kamu support -->
            <template #empty>
                <div class="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
                    Tidak ada data
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

import InputText from "@/components/inputs/InputText.vue"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/DataTable.vue"
import { SheetClose } from "@/components/ui/sheet"

import type { TableColumn } from "@/types"
import type { ApiModule } from "@/types/api-request"

const props = withDefaults(
    defineProps<{
        apiModule?: ApiModule
        apiAction?: string
        permissionBase?: string
    }>(),
    {
        // ✅ dummy dulu, nanti kamu ganti ke endpoint pencarian yang bener
        apiModule: "robot" as any,
        apiAction: "list",
        permissionBase: "/listrobot",
    }
)

const apiModule = computed(() => props.apiModule)
const apiAction = computed(() => props.apiAction)
const permissionBase = computed(() => props.permissionBase)

const columns = computed<TableColumn[]>(() => [
    {
        key: "no",
        label: "NO",
        width: "70px",
        align: "center",
    },
    {
        key: "noRefCounter",
        label: "NO REF COUNTER",
        width: "220px",
        align: "left",
    },
    {
        key: "robot",
        label: "ROBOT",
        width: "220px",
        align: "left",
    },
    {
        key: "statusSlik",
        label: "STATUS SLIK",
        width: "240px",
        align: "left",
    },
    {
        key: "tanggalUpdate",
        label: "TANGGAL UPDATE",
        width: "220px",
        align: "left",
    },
    {
        key: "statusCbasIndex",
        label: "STATUS CBAS INDEX",
        width: "220px",
        align: "left",
    },
])
</script>
