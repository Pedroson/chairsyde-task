import { createRouter, createWebHistory } from 'vue-router'
import CarsView from '@/views/CarsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'cars',
      component: CarsView,
    },
  ],
})

export default router
