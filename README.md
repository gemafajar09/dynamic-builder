# Micro Dynamic UI

Library Microfrontend ringan dan framework-agnostic untuk membuat Dynamic Form dan DataTable menggunakan Vue 3 Web Components.

## Fitur

- **AutoLayoutForm**: Membuat form otomatis dari JSON schema.
- **AutoLayoutDatatable**: Membuat tabel dengan pagination dan action dari JSON.
- **Zero Dependencies** (runtime): Vue dan style sudah di-bundle.
- **Components Included**: Menggunakan komponen base (`TextField`, `Button`) yang sudah tertanam.

## Instalasi

```bash
npm install micro-dynamic-ui
```

## Cara Penggunaan

### 1. Import JavaScript dan Style

Di entry point aplikasi Anda (React `main.jsx`, Vue `main.js`, atau Angular):

```javascript
import "micro-dynamic-ui";
import "micro-dynamic-ui/style.css";
```

### 2. Penggunaan di HTML / Javascript Biasa

#### Dynamic Form

```html
<micro-dynamic-form id="myForm"></micro-dynamic-form>

<script>
  const form = document.querySelector("#myForm");

  // Set config property secara langsung
  form.config = {
    title: "Registrasi User",
    sections: [
      {
        title: "Info Pribadi",
        fields: [
          {
            key: "name",
            label: "Nama Lengkap",
            model: "fullName",
            component: "DCodeTextField",
          },
          {
            key: "email",
            label: "Email",
            model: "email",
            component: "DCodeTextField",
            props: { type: "email" },
          },
        ],
      },
    ],
    actions: [{ key: "submit", label: "Daftar", component: "DCodeButton" }],
  };

  // Dengarkan event submit
  form.addEventListener("submit", (e) => {
    console.log("Data Form:", e.detail);
  });
</script>
```

#### Dynamic DataTable

```html
<micro-dynamic-datatable id="myTable"></micro-dynamic-datatable>

<script>
  const table = document.querySelector("#myTable");
  table.config = {
    titleID: "Daftar User",
    headers: [
      { text: "Nama", value: "name" },
      { text: "Email", value: "email" },
    ],
  };
</script>
```

---

### 3. Penggunaan di React

Di React, karena sifat standar Web Components, kita tidak bisa mengoper objek JSON (seperti `config`) langsung melalui attribute JSX (karena akan terkonversi menjadi string `"[object Object]"`).

Solusinya adalah menggunakan **`useRef`** untuk men-set properti `config` secara imperatif.

```jsx
import React, { useEffect, useRef } from "react";
import "micro-dynamic-ui"; // Registrasi Web Components
import "micro-dynamic-ui/style.css"; // Load CSS

const FormConfig = {
  title: "Form via React",
  sections: [
    {
      fields: [
        {
          key: "username",
          label: "Username",
          model: "username",
          component: "DCodeTextField",
        },
      ],
    },
  ],
  actions: [{ key: "save", label: "Simpan", component: "DCodeButton" }],
};

export default function ReactForm() {
  const formRef = useRef(null);

  useEffect(() => {
    const el = formRef.current;
    if (el) {
      // 1. Pass Config Object langsung ke property
      el.config = FormConfig;

      // 2. Event Listener untuk handle output
      const handleSubmit = (event) => {
        console.log("Hasil submit:", event.detail);
      };

      el.addEventListener("submit", handleSubmit);

      // Cleanup
      return () => {
        el.removeEventListener("submit", handleSubmit);
      };
    }
  }, []);

  return (
    <div>
      {/* Gunakan tag custom element */}
      <micro-dynamic-form ref={formRef}></micro-dynamic-form>
    </div>
  );
}
```

#### TypeScript di React ?

Jika Anda menggunakan TypeScript, Anda mungkin perlu mendefinisikan elemen tersebut agar tidak error di JSX:

```ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "micro-dynamic-form": any;
      "micro-dynamic-datatable": any;
    }
  }
}
```

## Publishing ke NPM

1. Commit perubahan Anda dengan pesan rilis, contoh: `feat: update feature [RELEASE:1.0.1]`.
2. GitHub Action akan otomatis mendeteksi tag `[RELEASE:...]`, mengupdate versi di `package.json`, dan mem-publish ke NPM.
