import { describe, it, expect, vi, beforeEach } from 'vitest'

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('axios', () => ({
  default: { create: () => ({ get }) },
}))

import { searchCars, getCar } from '@/api/cars'

describe('cars api', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('searchCars requests /cars with params and returns the data array', async () => {
    const cars = [{ id: 1, make: 'Toyota', model: 'Corolla', year: 2020 }]
    get.mockResolvedValue({ data: cars })

    const result = await searchCars({ make: 'Toyota', limit: 20, offset: 0 })

    expect(get).toHaveBeenCalledWith('/cars', {
      params: { make: 'Toyota', limit: 20, offset: 0 },
    })
    expect(result).toEqual(cars)
  })

  it('searchCars excludes optional params that were not provided', async () => {
    get.mockResolvedValue({ data: [] })

    await searchCars({ make: 'Ford', limit: 20, offset: 20 })

    const sentParams = get.mock.calls[0][1].params
    expect(Object.keys(sentParams).sort()).toEqual(['limit', 'make', 'offset'])
    expect('year' in sentParams).toBe(false)
    expect('model' in sentParams).toBe(false)
  })

  it('searchCars passes through provided optional params', async () => {
    get.mockResolvedValue({ data: [] })

    await searchCars({ make: 'Ford', limit: 20, offset: 20, year: 2019, model: 'Focus' })

    expect(get).toHaveBeenCalledWith('/cars', {
      params: { make: 'Ford', limit: 20, offset: 20, year: 2019, model: 'Focus' },
    })
  })

  it('getCar requests /cars/:id and returns the detail', async () => {
    const detail = { id: 7, make: 'Honda', model: 'Civic', year: 2021 }
    get.mockResolvedValue({ data: detail })

    const result = await getCar(7)

    expect(get).toHaveBeenCalledWith('/cars/7')
    expect(result).toEqual(detail)
  })
})
