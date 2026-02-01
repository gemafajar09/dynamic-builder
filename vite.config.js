import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue({ customElement: true })],
  build: {
    lib: {
      entry: './src/main.js',
      name: 'micro-dynamic-ui',
      fileName: 'micro-dynamic-ui'
    }
  },
  define: {
    'process.env': {}
  }
})