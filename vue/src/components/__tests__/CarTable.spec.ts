import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CarTable from '@/components/CarTable.vue'

const cars = [
  { id: 'asG52Fgs6gh', make: 'Toyota', model: 'Corolla', year: 2020 },
  { id: 'asG52Fgs6gd', make: 'Honda', model: 'Civic', year: 2021 },
]

describe('CarTable', () => {
  it('renders one row per car', () => {
    const wrapper = mount(CarTable, { props: { cars } })
    expect(wrapper.findAll('.car-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('Corolla')
    expect(wrapper.text()).toContain('Civic')
  })

  it('emits select with the car id when a row is clicked', async () => {
    const wrapper = mount(CarTable, { props: { cars } })
    await wrapper.findAll('.car-row')[1]!.trigger('click')
    expect(wrapper.emitted('select')![0]).toEqual([2])
  })

  it('shows an empty message when there are no cars', () => {
    const wrapper = mount(CarTable, { props: { cars: [] } })
    expect(wrapper.text()).toContain('No cars')
  })
})
