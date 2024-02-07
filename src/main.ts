import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createHead } from '@unhead/vue'

const app = createApp(App)

app.use(router)
app.use(createHead())
app.mount('#app')
