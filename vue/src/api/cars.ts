import axios from 'axios'

export interface CarSummary {
  id: string
  make: string
  model: string
  year: number
}

export interface CarDetail {
  id: string
  make: string
  model: string
  year: number
  trim: string
  horsepower: string
  cylinders: string
  displacement_l: string
  fuel_type: string
  transmission: string
  body_class: string
  image_url: string
}

export interface CarSearchParams {
  make: string
  limit: number
  offset: number
  year?: number
  model?: string
}

const client = axios.create({ baseURL: '/api' })

export async function searchCars(params: CarSearchParams): Promise<CarSummary[]> {
  const query: Record<string, string | number> = {
    make: params.make,
    limit: params.limit,
    offset: params.offset,
  }
  if (params.year !== undefined) query.year = params.year
  if (params.model !== undefined) query.model = params.model

  const response = await client.get('/cars', { params: query })
  return response.data
}

export async function getCar(id: string): Promise<CarDetail> {
  const response = await client.get(`/cars/${id}`)
  return response.data
}
