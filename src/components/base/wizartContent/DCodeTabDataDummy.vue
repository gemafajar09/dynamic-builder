<template>
    <div class="space-y-6">
        <!-- Debitur Utama -->
        <div class="rounded-xl border bg-background pt-5">
            <!-- <div class="flex items-start justify-between gap-4 p-5 pb-3">
                <div>
                    <div class="text-base font-semibold">Debitur Utama</div>
                    <div class="text-sm text-muted-foreground">Informasi Data.</div>
                </div>

                <div class="flex items-center gap-2">
                    <Button type="button" variant="destructive" class="h-9 w-10 px-0" @click="onRefresh"
                        aria-label="Refresh">
                        <RefreshCw class="h-4 w-4" />
                    </Button>

                    <Button type="button" variant="secondary" class="h-9 gap-2" @click="onList">
                        <ListIcon class="h-4 w-4" />
                        List
                    </Button>
                </div>
            </div> -->

            <div class="px-5 pb-5">
                <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <!-- left -->
                    <div class="divide-y divide-border rounded-lg border bg-background">
                        <div v-for="(row, idx) in leftFields" :key="`l-${idx}`"
                            class="grid grid-cols-2 gap-6 px-4 py-3 text-sm">
                            <div class="text-muted-foreground">{{ row.label }}</div>
                            <div class="font-medium text-foreground break-words">{{ displayValue(row.value) }}</div>
                        </div>
                    </div>

                    <!-- right -->
                    <div class="divide-y divide-border rounded-lg border bg-background">
                        <div v-for="(row, idx) in rightFields" :key="`r-${idx}`"
                            class="grid grid-cols-2 gap-6 px-4 py-3 text-sm">
                            <div class="text-muted-foreground">{{ row.label }}</div>
                            <div class="font-medium text-foreground break-words">{{ displayValue(row.value) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dokumen Pendukung -->
        <div class="rounded-xl border bg-background">
            <div class="p-5 pb-3">
                <div class="text-base font-semibold">Dokumen Pendukung</div>
                <div class="text-sm text-muted-foreground">Informasi Data.</div>
            </div>

            <div class="px-5 pb-5">
                <div
                    class="flex min-h-[220px] flex-col items-center justify-center rounded-lg border bg-muted/10 text-center">
                    <ClipboardList class="h-10 w-10 text-muted-foreground/60" />
                    <div class="mt-3 text-sm text-muted-foreground">Tidak ada data dokumen.</div>
                </div>
            </div>
        </div>

        <!-- Data Non Debitur (PAKAI DataTable yang kamu punya) -->
        <div class="rounded-xl border bg-background">
            <div class="p-5 pb-3">
                <div class="text-base font-semibold">Data Non Debitur</div>
                <div class="text-sm text-muted-foreground">Informasi Data.</div>
            </div>

            <div class="px-5 pb-5">
                <DataTable :columns="nonDebiturColumns" :permission-base="nonDebiturPermissionBase"
                    :has-actions="false">
                    <!-- Filter Form Slot -->
                    <template #filter-form="{ filters }">
                        <div class="grid gap-4 py-4">
                            <div class="grid grid-cols-4 items-center gap-4">
                                <InputText id="keyword" v-model="filters.keyword" placeholder="Search..."
                                    label="Keyword" class="col-span-4 w-full" />
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

                    <!-- (Opsional) kalau DataTable kamu support empty slot -->
                    <template #empty>
                        <div class="flex min-h-[220px] flex-col items-center justify-center text-center">
                            <ClipboardList class="h-10 w-10 text-muted-foreground/60" />
                            <div class="mt-3 text-sm text-muted-foreground">Tidak ada data</div>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
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

import { ClipboardList } from "lucide-vue-next"

type KV = { label: string; value: any }

const props = withDefaults(
    defineProps<{
        nonDebiturApiModule?: ApiModule
        nonDebiturApiAction?: string
        nonDebiturPermissionBase?: string
    }>(),
    {
        // ✅ default dummy pakai yang udah ada (biar langsung jalan)
        nonDebiturApiModule: "robot" as any,
        nonDebiturApiAction: "list",
        nonDebiturPermissionBase: "/listrobot",
    }
)

const leftFields = computed<KV[]>(() => [
    { label: "Jenis Debitur", value: "INDIVIDUAL" },
    { label: "Produk", value: "LOS IDX" },
    { label: "Nomor Surat", value: "SKBF2512140015" },
    { label: "Nama Nasabah", value: "DANIEL JORDAN TARIGAN" },
    { label: "Tanggal Lahir", value: "04-10-2006" },
    { label: "Jenis Kelamin", value: "LAKI - LAKI" },
    { label: "Status Perkawinan", value: "-" },
    { label: "Kewarganegaraan", value: "-" },
    { label: "Tipe Identitas", value: "-" },
    { label: "Nomor Identitas", value: "-" },
    { label: "Tempat Lahir", value: "-" },
    { label: "Nama Ibu Kandung", value: "-" },
])

const rightFields = computed<KV[]>(() => [
    { label: "Nomor Handphone / WhatsApp", value: "-" },
    { label: "Alamat", value: "-" },
    { label: "Kelurahan", value: "-" },
    { label: "Kecamatan", value: "-" },
    { label: "Kota", value: "-" },
    { label: "Provinsi", value: "-" },
    { label: "Kode Pos", value: "-" },
    { label: "ID Process", value: "33eb2c97-d8a1-11f0-82c7-b650817dc457" },
    { label: "Input by User", value: "dilianti" },
    { label: "Tanggal Input", value: "14-12-2025 10:58:52" },
    { label: "Cabang", value: "JAKARTA - SLIPI" },
    { label: "Tujuan Permintaan", value: "MONITORING DEBITUR EXISTING" },
])

const nonDebiturColumns = computed<TableColumn[]>(() => [
    { key: "no", label: "NO", width: "70px", align: "center" },
    { key: "jenisNasabah", label: "JENIS NASABAH", width: "150px" },
    { key: "namaNasabah", label: "NAMA NASABAH", width: "220px" },
    { key: "tempatLahir", label: "TEMPAT LAHIR", width: "160px" },
    { key: "tanggalLahir", label: "TANGGAL LAHIR", width: "160px" },
    { key: "ktp", label: "KTP", width: "160px" },
    { key: "npwp", label: "NPWP", width: "160px" },
    { key: "nomorHandphone", label: "NOMOR HANDPHONE", width: "190px" },
    { key: "jenisKelamin", label: "JENIS KELAMIN", width: "150px" },
    { key: "alamat", label: "ALAMAT", width: "260px" },
    { key: "provinsi", label: "PROVINSI", width: "140px" },
    { key: "kota", label: "KOTA", width: "140px" },
    { key: "kecamatan", label: "KECAMATAN", width: "140px" },
    { key: "kelurahan", label: "KELURAHAN", width: "140px" },
    { key: "kodePos", label: "KODE POS", width: "120px" },
])

const onRefresh = () => console.log("refresh")
const onList = () => console.log("list")

const displayValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-"
    return v
}

const nonDebiturApiModule = computed(() => props.nonDebiturApiModule)
const nonDebiturApiAction = computed(() => props.nonDebiturApiAction)
const nonDebiturPermissionBase = computed(() => props.nonDebiturPermissionBase)
</script>
