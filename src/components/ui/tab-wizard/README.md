# Tab Wizard Component Documentation

Komponen Tab Wizard yang indah dengan animasi yang menarik untuk membuat alur multi-langkah yang interaktif.

## 🎯 Fitur

- ✨ **Animasi Halus** - Transisi yang smooth dengan berbagai pilihan animasi
- 🎨 **Dark Mode Support** - Mendukung mode gelap dengan Tailwind CSS
- 📱 **Responsive** - Sempurna di semua ukuran layar
- 🔄 **Multiple Status** - Completed, Active, Pending, Error
- ♿ **Accessible** - Keyboard navigation dan screen reader friendly
- 🎯 **Customizable** - Icons, descriptions, dan styling dapat disesuaikan

## 📦 Komponen

### TabWizard
Komponen utama yang menampilkan steps wizard dengan indicator dan koneksi line.

#### Props

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `steps` | `TabWizardStep[]` | - | Array dari step yang akan ditampilkan |
| `modelValue` | `number \| string` | `0` | Index atau ID dari step yang aktif |
| `class` | `string` | - | Custom CSS class |
| `showIcons` | `boolean` | `true` | Tampilkan icon di indicator |
| `showDescription` | `boolean` | `true` | Tampilkan deskripsi step |
| `variant` | `'line' \| 'dot' \| 'card'` | `'line'` | Varian tampilan (default: line) |
| `animationType` | `'slide' \| 'fade' \| 'scale'` | `'slide'` | Tipe animasi konten |

#### Events

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `update:modelValue` | `number \| string` | Emitted saat step berubah |
| `change` | `(step, index)` | Emitted saat user klik step |

#### Slots

```vue
<TabWizard v-model="currentStep" :steps="steps">
  <template #default="{ currentStep, currentIndex }">
    <!-- Content based on currentIndex -->
  </template>
</TabWizard>
```

### TabWizardContent
Komponen wrapper untuk konten setiap step dengan support animasi.

#### Props

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `animation` | `'slide' \| 'fade' \| 'scale'` | `'slide'` | Tipe animasi saat ditampilkan |
| `isActive` | `boolean` | `true` | Menentukan apakah content aktif |
| `class` | `string` | - | Custom CSS class |

## 🚀 Contoh Penggunaan

### Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TabWizard, TabWizardContent } from '@/components/ui/tab-wizard'
import type { TabWizardStep } from '@/components/ui/tab-wizard'

const currentStep = ref(0)

const steps: TabWizardStep[] = [
  {
    id: 'step1',
    label: 'Step Pertama',
    description: 'Deskripsi langkah 1',
    icon: '1',
  },
  {
    id: 'step2',
    label: 'Step Kedua',
    description: 'Deskripsi langkah 2',
    icon: '2',
  },
  {
    id: 'step3',
    label: 'Step Ketiga',
    description: 'Deskripsi langkah 3',
    icon: '3',
  },
]
</script>

<template>
  <TabWizard v-model="currentStep" :steps="steps">
    <template #default="{ currentStep: step, currentIndex }">
      <TabWizardContent
        v-if="currentIndex === 0"
        :is-active="currentIndex === 0"
      >
        <h2>Konten Step 1</h2>
        <!-- Form atau konten lainnya -->
      </TabWizardContent>

      <TabWizardContent
        v-if="currentIndex === 1"
        :is-active="currentIndex === 1"
      >
        <h2>Konten Step 2</h2>
      </TabWizardContent>

      <TabWizardContent
        v-if="currentIndex === 2"
        :is-active="currentIndex === 2"
      >
        <h2>Konten Step 3</h2>
      </TabWizardContent>
    </template>
  </TabWizard>
</template>
```

### Advanced Usage dengan Status

```vue
<script setup lang="ts">
const steps: TabWizardStep[] = [
  {
    id: 'personal',
    label: 'Data Pribadi',
    icon: '👤',
    status: 'completed',
  },
  {
    id: 'contact',
    label: 'Kontak',
    icon: '📧',
    status: 'active',
  },
  {
    id: 'address',
    label: 'Alamat',
    icon: '📍',
    status: 'pending',
  },
  {
    id: 'error',
    label: 'Verifikasi',
    icon: '✓',
    status: 'error',
    disabled: true,
  },
]
</script>
```

## 🎨 Status Types

### TabWizardStep Interface

```typescript
interface TabWizardStep {
  id: string                                    // Unique identifier
  label: string                                 // Label yang ditampilkan
  icon?: string                                 // Icon name dari Lucide Vue
  description?: string                          // Deskripsi singkat
  status?: 'pending' | 'completed' | 'active' | 'error'  // Status step
  disabled?: boolean                            // Apakah step bisa diklik
}
```

### Available Icons (Lucide Vue)

Komponen ini menggunakan **Lucide Vue** untuk icons. Berikut icon-icon yang sudah tersedia:

| Icon Name | Deskripsi | Contoh |
|-----------|-----------|--------|
| `user` | User/Pengguna | Data pribadi, profil |
| `mail` | Email | Kontak, verifikasi email |
| `phone` | Telepon | Nomor telepon |
| `map-pin` | Lokasi/Alamat | Alamat tinggal, lokasi |
| `home` | Rumah/Kantor | Kantor, lokasi bisnis |
| `check-circle` | Checklist/Verifikasi | Konfirmasi, selesai |
| `file-text` | Document/File | Upload, dokumen |
| `package` | Paket/Barang | Pengiriman, produk |
| `settings` | Pengaturan | Konfigurasi |
| `bell` | Notifikasi | Pengumuman |
| `bar-chart` | Laporan/Chart | Statistik, laporan |

**Untuk menambah icon baru**, edit `TabWizard.vue` dan tambahkan ke `iconMap`:

```typescript
const iconMap: Record<string, any> = {
  'user': User,
  'mail': Mail,
  // Tambahkan icon baru di sini
  'heart': Heart,
}
```

Lihat [Lucide Vue Documentation](https://lucide.dev) untuk daftar lengkap icon yang tersedia.

## 🎭 Animasi

### Tipe Animasi yang Tersedia

1. **Slide** - Konten slide dari kanan ke kiri
2. **Fade** - Konten fade in/out
3. **Scale** - Konten scale up/down

Gunakan prop `animationType` di TabWizard untuk mengubah animasi global, atau `animation` di TabWizardContent untuk per-step.

## 🌈 Styling

Komponen menggunakan Tailwind CSS dan mendukung dark mode. Customize dengan melewatkan class:

```vue
<TabWizard
  v-model="currentStep"
  :steps="steps"
  class="custom-class"
>
  <!-- Content -->
</TabWizard>
```

## ⌨️ Keyboard Navigation

- **Arrow Keys** - Navigasi antar step (future enhancement)
- **Enter** - Confirm/submit step

## 📝 Tips Penggunaan

1. **Untuk Form Multi-Step** - Gunakan v-model binding dengan index atau step ID
2. **Status Management** - Update step status sesuai validasi form
3. **Disabled Steps** - Set `disabled: true` untuk mencegah user skip step
4. **Custom Icons** - Gunakan emoji atau icon library favorite Anda

## 🔧 Customization

### Custom Colors

Gunakan Tailwind CSS classes untuk customize warna:

```vue
<style scoped>
:deep(.step-indicator.active) {
  @apply bg-custom-color;
}
</style>
```

### Custom Content Animation

```vue
<TabWizardContent
  v-if="currentIndex === 0"
  :is-active="currentIndex === 0"
  animation="fade"
>
  <!-- Content -->
</TabWizardContent>
```

## 🎯 Lifecycle Events

```vue
<TabWizard
  v-model="currentStep"
  :steps="steps"
  @change="handleStepChange"
  @update:modelValue="handleModelUpdate"
>
  <!-- Content -->
</TabWizard>
```

## 📄 File Structure

```
src/components/ui/tab-wizard/
├── TabWizard.vue              # Main component
├── TabWizardContent.vue       # Content wrapper
├── index.ts                   # Exports
└── README.md                  # This file
```

## 🚀 Demo

Lihat `TabWizardExample.vue` untuk contoh lengkap penggunaan component ini.

## 📱 Responsive Behavior

- **Mobile (< 768px)** - Layout disesuaikan dengan single column
- **Tablet (768px - 1024px)** - Layout normal dengan spacing yang tepat
- **Desktop (> 1024px)** - Full layout dengan semua fitur

## ⚠️ Notes

- Pastikan step IDs unik jika menggunakan string ID
- Gunakan v-model dengan consistent type (number atau string)
- Set initial status sesuai kondisi step
- Disable step yang tidak bisa diakses user

## 🤝 Contributing

Untuk improvements atau bug reports, silakan buat issue atau pull request.
