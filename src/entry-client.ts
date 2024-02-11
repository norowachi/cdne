import './main.css'

import { createApp } from './main'
import { createHead } from '@unhead/vue'

const { app } = createApp()

app.use(createHead())

app.mount('#app')
