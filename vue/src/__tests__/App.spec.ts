import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import CarsView from '@/views/CarsView.vue'

describe('App', () => {
  it('renders the cars view at the root route', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', name: 'cars', component: CarsView }],
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Cars')
  })
})
