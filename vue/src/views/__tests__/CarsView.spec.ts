import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/cars', () => ({
  searchCars: vi.fn(),
  getCar: vi.fn(),
}))

import { searchCars } from '@/api/cars'
import CarsView from '@/views/CarsView.vue'

const page1 = [
  { id: 'asG52Fgs6gh', make: 'Toyota', model: 'Corolla', year: 2020 },
  { id: 'asG52Fgs6gs', make: 'Toyota', model: 'Camry', year: 2019 },
]

describe('CarsView', () => {
  beforeEach(() => {
    vi.mocked(searchCars).mockReset()
  })

  it('shows an empty prompt before any search', () => {
    const wrapper = mount(CarsView)
    expect(wrapper.text()).toContain('Search for cars')
  })

  it('searches with make/limit/offset and renders the results', async () => {
    vi.mocked(searchCars).mockResolvedValue(page1)
    const wrapper = mount(CarsView)

    await wrapper.find('input[name="make"]').setValue('Toyota')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(searchCars).toHaveBeenCalledWith({ make: 'Toyota', limit: 20, offset: 0 })
    expect(wrapper.findAll('.car-row')).toHaveLength(2)
  })

  it('advances offset by limit when Next is clicked', async () => {
    vi.mocked(searchCars).mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: `asG52Fgs6gh${(i + 1)}`,
        make: 'Toyota',
        model: `M${i}`,
        year: 2020,
      })),
    )
    const wrapper = mount(CarsView)
    await wrapper.find('input[name="make"]').setValue('Toyota')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    await wrapper.find('.next').trigger('click')
    await flushPromises()

    expect(vi.mocked(searchCars).mock.calls[1]![0]).toEqual({
      make: 'Toyota',
      limit: 20,
      offset: 20,
    })
  })

  it('surfaces 422 validation messages from the search', async () => {
    vi.mocked(searchCars).mockRejectedValue({
      response: {
        status: 422,
        data: {
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: ['make must be shorter than or equal to 255 characters'],
        },
      },
    })
    const wrapper = mount(CarsView)
    await wrapper.find('input[name="make"]').setValue('')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('make must be shorter than or equal to 255 characters')
  })

  it('Previous is disabled on the first page and decrements offset by limit', async () => {
    vi.mocked(searchCars).mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: `asG52Fgs6g${(i + 1)}`,
        make: 'Toyota',
        model: `M${i}`,
        year: 2020,
      })),
    )
    const wrapper = mount(CarsView)
    await wrapper.find('input[name="make"]').setValue('Toyota')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // first page: Previous disabled
    expect(wrapper.find('.prev').attributes('disabled')).toBeDefined()

    await wrapper.find('.next').trigger('click')   // offset -> 20
    await flushPromises()
    expect(wrapper.find('.prev').attributes('disabled')).toBeUndefined()

    await wrapper.find('.prev').trigger('click')   // offset -> 0
    await flushPromises()
    expect(vi.mocked(searchCars).mock.calls[2]![0]).toEqual({ make: 'Toyota', limit: 20, offset: 0 })
  })

  it('shows a friendly message on a non-422 error', async () => {
    vi.mocked(searchCars).mockRejectedValue({ response: { status: 500, data: { message: 'server error' } } })
    const wrapper = mount(CarsView)
    await wrapper.find('input[name="make"]').setValue('Toyota')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong')
  })
})
