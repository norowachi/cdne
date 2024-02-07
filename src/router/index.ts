// index.ts

import { createRouter, createWebHistory } from 'vue-router'
import FileSearch from '@/components/FileSearch.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/:query', component: FileSearch, props: true }
    // other routes...
  ]
})

export default router
