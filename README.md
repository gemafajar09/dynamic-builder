# Micro Dynamic UI

A lightweight, framework-agnostic Microfrontend library for generating Dynamic Forms and DataTables using Vue 3 Web Components.

## Features
- **AutoLayoutForm**: Generates forms from JSON schema.
- **AutoLayoutDatatable**: Generates tables with pagination and actions from JSON.
- **Zero Dependencies** (runtime): Bundles Vue and styles for easy drop-in.
- **Components Included**: Uses simplified internal base components (`TextField`, `Button`) for consistent theming.

## Installation

```bash
npm install micro-dynamic-ui
```

## Usage

### 1. Import JavaScript and Styles

In your entry point (React, Vue, Angular, or Vanilla JS):

```javascript
import 'micro-dynamic-ui';
import 'micro-dynamic-ui/style.css';
```

### 2. Use in HTML/Templates

#### Dynamic Form
```html
<micro-dynamic-form></micro-dynamic-form>

<script>
  const form = document.querySelector('micro-dynamic-form');
  form.config = {
    title: "User Registration",
    sections: [
      {
        title: "Personal Info",
        fields: [
          { key: "name", label: "Full Name", model: "fullName", component: "DCodeTextField" },
          { key: "email", label: "Email", model: "email", component: "DCodeTextField", props: { type: "email" } }
        ]
      }
    ],
    actions: [
      { key: "submit", label: "Register", component: "DCodeButton" }
    ]
  };
  
  form.addEventListener('submit', (e) => {
    console.log("Form Submitted:", e.detail);
  });
</script>
```

#### Dynamic DataTable
```html
<micro-dynamic-datatable></micro-dynamic-datatable>

<script>
  const table = document.querySelector('micro-dynamic-datatable');
  table.config = {
    titleID: "Users List",
    headers: [
      { text: "Name", value: "name" },
      { text: "Email", value: "email" }
    ]
  };
</script>
```

## Publishing to NPM

1. Update version in `package.json`.
2. Run build: `npm run build`.
3. Publish: `npm publish --access public`.
