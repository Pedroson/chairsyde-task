import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/cars', () => ({
  getCar: vi.fn(),
}))

import { getCar } from '@/api/cars'
import CarDetailModal from '@/components/CarDetailModal.vue'

const detail = {
  id: 7,
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  trim: 'Sport',
  horsepower: '158',
  cylinders: '4',
  displacement: '2.0',
  fuel_type: 'Gasoline',
  transmission: 'CVT',
  body_class: 'Sedan',
  image_url: 'http://example.com/civic.jpg',
}

describe('CarDetailModal', () => {
  beforeEach(() => {
    vi.mocked(getCar).mockReset()
  })

  it('renders nothing when carId is null', () => {
    const wrapper = mount(CarDetailModal, { props: { carId: null } })
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('fetches and displays the car detail when opened', async () => {
    vi.mocked(getCar).mockResolvedValue(detail)
    const wrapper = mount(CarDetailModal, { props: { carId: 7 } })
    await flushPromises()

    expect(getCar).toHaveBeenCalledWith(7)
    expect(wrapper.text()).toContain('Civic')
    expect(wrapper.text()).toContain('Sport')
    expect(wrapper.find('img').attributes('src')).toBe('http://example.com/civic.jpg')
  })

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(getCar).mockRejectedValue(new Error('boom'))
    const wrapper = mount(CarDetailModal, { props: { carId: 9 } })
    await flushPromises()

    expect(wrapper.text()).toContain('Could not load')
  })

  it('emits close when the close button is clicked', async () => {
    vi.mocked(getCar).mockResolvedValue(detail)
    const wrapper = mount(CarDetailModal, { props: { carId: 7 } })
    await flushPromises()
    await wrapper.find('.modal-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
