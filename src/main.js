import { defineCustomElement } from 'vue'
import AutoLayoutForm from './pages/common/AutoLayoutForm.vue'
import AutoLayoutDatatable from './pages/common/AutoLayoutDatatable.vue'
import './style.css'

// Conver Vue components to Custom Elements
const MicroDynamicForm = defineCustomElement(AutoLayoutForm)
const MicroDynamicDatatable = defineCustomElement(AutoLayoutDatatable)

// Register Custom Elements
customElements.define('micro-dynamic-form', MicroDynamicForm)
customElements.define('micro-dynamic-datatable', MicroDynamicDatatable)

// Export for library build
export { MicroDynamicForm, MicroDynamicDatatable }
