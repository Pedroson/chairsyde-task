import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CarSearchForm from '@/components/CarSearchForm.vue'

describe('CarSearchForm', () => {
  it('emits search with make only when optional fields are blank', async () => {
    const wrapper = mount(CarSearchForm)
    await wrapper.find('input[name="make"]').setValue('Toyota')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')![0][0]).toEqual({ make: 'Toyota' })
  })

  it('emits year as a number and model as a string when provided', async () => {
    const wrapper = mount(CarSearchForm)
    await wrapper.find('input[name="make"]').setValue('Ford')
    await wrapper.find('input[name="year"]').setValue('2019')
    await wrapper.find('input[name="model"]').setValue('Focus')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('search')![0][0]).toEqual({
      make: 'Ford',
      year: 2019,
      model: 'Focus',
    })
  })

  it('renders field error messages from the errors prop', () => {
    const wrapper = mount(CarSearchForm, {
      props: { errors: { make: ['The make field is required.'] } },
    })
    expect(wrapper.text()).toContain('The make field is required.')
  })
})
