import { defineCustomElement } from 'vue'
import AutoLayoutForm from './pages/common/AutoLayoutForm.vue'
import AutoLayoutDatatable from './pages/common/AutoLayoutDatatable.vue'
import './style.css'

const MicroDynamicForm = defineCustomElement(AutoLayoutForm)
const MicroDynamicDatatable = defineCustomElement(AutoLayoutDatatable)

customElements.define('micro-dynamic-form', MicroDynamicForm)
customElements.define('micro-dynamic-datatable', MicroDynamicDatatable)

export { 
  MicroDynamicForm as AutoLayoutForm, 
  MicroDynamicDatatable as AutoLayoutDatatable,
  MicroDynamicForm,
  MicroDynamicDatatable
}
