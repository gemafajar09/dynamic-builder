<template>
    <div class="space-y-6">
        <DataTable :columns="columns" :permission-base="permissionBase" :has-actions="true" @create="onCreate">
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

            <!-- Actions Slot (kolom ACTION) -->
            <template #actions="{ row }">
                <div class="flex items-center justify-center">
                    <Button type="button" variant="ghost" size="icon" class="h-9 w-9 text-red-600 hover:text-red-700"
                        @click="downloadPdf(row)" aria-label="Download PDF" title="Download PDF">
                        <FileText class="h-5 w-5" />
                    </Button>
                </div>
            </template>

            <!-- Optional empty slot -->
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

import { FileText } from "lucide-vue-next"

const props = withDefaults(
    defineProps<{
        apiModule?: ApiModule
        apiAction?: string
        permissionBase?: string
    }>(),
    {
        // ✅ dummy dulu, nanti ganti ke endpoint hasil pencarian yang bener
        apiModule: "robot" as any,
        apiAction: "list",
        permissionBase: "/listrobot",
    }
)

const apiModule = computed(() => props.apiModule)
const apiAction = computed(() => props.apiAction)
const permissionBase = computed(() => props.permissionBase)

// sesuai screenshot
const columns = computed<TableColumn[]>(() => [
    { key: "no", label: "NO", width: "70px", align: "center" },
    { key: "nomorSurat", label: "NOMOR SURAT", width: "190px", align: "left" },
    { key: "kodeRefPengguna", label: "KODE REF PENGGUNA", width: "210px", align: "left" },
    { key: "namaDebitur", label: "NAMA DEBITUR", width: "260px", align: "left" },
    { key: "idNumber", label: "ID NUMBER", width: "170px", align: "left" },
    { key: "tanggalPermintaan", label: "TANGGAL PERMINTAAN", width: "220px", align: "left" },
    { key: "typeId", label: "TYPE ID", width: "130px", align: "left" },
    { key: "action", label: "ACTION", width: "110px", align: "center" },
])

const onCreate = () => {
    // kalau DataTable kamu ada tombol create, dummy aja
    console.log("create")
}

const downloadPdf = (row: any) => {
    // dummy (nanti ganti jadi open link / call api download)
    console.log("download pdf for row:", row)
}
</script>
