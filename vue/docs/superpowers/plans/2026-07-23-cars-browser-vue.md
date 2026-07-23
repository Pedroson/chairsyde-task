# Cars Browser (Vue SPA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue SPA screen with a searchable, paginated cars table where clicking a row opens a modal showing that car's full detail, backed by the Laravel Cars API via axios.

**Architecture:** A single `/` route view (`CarsView`) orchestrates three child components (search form, table, detail modal) and delegates all HTTP to a thin typed API module (`src/api/cars.ts`) built on an axios instance with `baseURL: '/api'`. The Vite dev server proxies `/api` to the Laravel backend so calls are same-origin.

**Tech Stack:** Vue 3.5 (`<script setup lang="ts">`), vue-router 5, axios, Vite 8, Vitest 4 + `@vue/test-utils`.

## Global Constraints

- API base path is `/api`; axios instance uses `baseURL: '/api'`.
- List endpoint `GET /api/cars` requires query params `make` (string, required), `limit` (int 1–1000, required), `offset` (int >=0, required); optional `year` (int 1900–2023) and `model` (string). No other fields permitted.
- List response is a **bare array** of `CarSummary` `{ id, make, model, year }` with **no total count**.
- Detail endpoint `GET /api/cars/{id}` returns `CarDetail` `{ id, make, model, year, trim, horsepower, cylinders, displacement, fuel_type, transmission, body_class, image_url }`. `404` returns `{ message }`.
- Validation errors (`422`) return `{ message: string, errors: { <field>: string[] } }`.
- Default `limit` is `20`.
- Use `<script setup lang="ts">` single-file components; follow the existing scaffold style.
- Backend runs at `http://localhost:8000`.

---

### Task 1: Add axios dependency and Vite dev proxy

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `axios` available as an import; Vite proxies `/api` → `http://localhost:8000`.

- [ ] **Step 1: Install axios**

Run:
```bash
npm install axios
```
Expected: `axios` added under `dependencies` in `package.json`, exit code 0.

- [ ] **Step 2: Add the dev proxy to `vite.config.ts`**

Replace the `defineConfig({...})` object so it includes a `server.proxy` entry. Full file:

```ts
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Verify the project still type-checks and builds config**

Run:
```bash
npx vue-tsc --build
```
Expected: exit code 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add axios and vite /api dev proxy"
```

---

### Task 2: API module (`src/api/cars.ts`)

**Files:**
- Create: `src/api/cars.ts`
- Test: `src/api/__tests__/cars.spec.ts`

**Interfaces:**
- Consumes: `axios`.
- Produces:
  - `interface CarSummary { id: number; make: string; model: string; year: number }`
  - `interface CarDetail { id: number; make: string; model: string; year: number; trim: string; horsepower: string; cylinders: string; displacement: string; fuel_type: string; transmission: string; body_class: string; image_url: string }`
  - `interface CarSearchParams { make: string; limit: number; offset: number; year?: number; model?: string }`
  - `function searchCars(params: CarSearchParams): Promise<CarSummary[]>`
  - `function getCar(id: number): Promise<CarDetail>`

- [ ] **Step 1: Write the failing test**

Create `src/api/__tests__/cars.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const get = vi.fn()
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

  it('searchCars omits undefined optional params', async () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:unit -- --run src/api/__tests__/cars.spec.ts
```
Expected: FAIL — cannot resolve `@/api/cars` / functions not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/api/cars.ts`:

```ts
import axios from 'axios'

export interface CarSummary {
  id: number
  make: string
  model: string
  year: number
}

export interface CarDetail {
  id: number
  make: string
  model: string
  year: number
  trim: string
  horsepower: string
  cylinders: string
  displacement: string
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

export async function getCar(id: number): Promise<CarDetail> {
  const response = await client.get(`/cars/${id}`)
  return response.data
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm run test:unit -- --run src/api/__tests__/cars.spec.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/cars.ts src/api/__tests__/cars.spec.ts
git commit -m "feat: add typed cars api module"
```

---

### Task 3: CarSearchForm component

**Files:**
- Create: `src/components/CarSearchForm.vue`
- Test: `src/components/__tests__/CarSearchForm.spec.ts`

**Interfaces:**
- Consumes: nothing (no API).
- Produces: a component that:
  - Accepts prop `errors?: Record<string, string[]>` (field → messages, from a 422).
  - Accepts prop `loading?: boolean` (disables submit while true).
  - Emits `search` with payload `{ make: string; year?: number; model?: string }` on submit. `make` is trimmed; `year` emitted as a number only when non-empty; `model` emitted as a string only when non-empty.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/CarSearchForm.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:unit -- --run src/components/__tests__/CarSearchForm.spec.ts
```
Expected: FAIL — cannot resolve `@/components/CarSearchForm.vue`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/CarSearchForm.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  errors?: Record<string, string[]>
  loading?: boolean
}>()

const emit = defineEmits<{
  search: [payload: { make: string; year?: number; model?: string }]
}>()

const make = ref('')
const year = ref('')
const model = ref('')

function onSubmit() {
  const payload: { make: string; year?: number; model?: string } = {
    make: make.value.trim(),
  }
  if (year.value.trim() !== '') payload.year = Number(year.value)
  if (model.value.trim() !== '') payload.model = model.value.trim()
  emit('search', payload)
}
</script>

<template>
  <form class="search-form" @submit.prevent="onSubmit">
    <div class="field">
      <label for="make">Make *</label>
      <input id="make" name="make" v-model="make" required />
      <p v-if="errors?.make" class="error">{{ errors.make.join(' ') }}</p>
    </div>

    <div class="field">
      <label for="year">Year</label>
      <input id="year" name="year" type="number" v-model="year" />
      <p v-if="errors?.year" class="error">{{ errors.year.join(' ') }}</p>
    </div>

    <div class="field">
      <label for="model">Model</label>
      <input id="model" name="model" v-model="model" />
      <p v-if="errors?.model" class="error">{{ errors.model.join(' ') }}</p>
    </div>

    <button type="submit" :disabled="loading">Search</button>
  </form>
</template>

<style scoped>
.search-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.error {
  color: #c00;
  font-size: 0.85rem;
  margin: 0;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm run test:unit -- --run src/components/__tests__/CarSearchForm.spec.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/CarSearchForm.vue src/components/__tests__/CarSearchForm.spec.ts
git commit -m "feat: add car search form component"
```

---

### Task 4: CarTable component

**Files:**
- Create: `src/components/CarTable.vue`
- Test: `src/components/__tests__/CarTable.spec.ts`

**Interfaces:**
- Consumes: `CarSummary` from `@/api/cars`.
- Produces: a component that:
  - Accepts prop `cars: CarSummary[]`.
  - Renders one `<tr class="car-row">` per car with id, make, model, year.
  - Emits `select` with the car's `id` (number) when a row is clicked.
  - Shows an empty message when `cars` is empty.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/CarTable.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CarTable from '@/components/CarTable.vue'

const cars = [
  { id: 1, make: 'Toyota', model: 'Corolla', year: 2020 },
  { id: 2, make: 'Honda', model: 'Civic', year: 2021 },
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
    await wrapper.findAll('.car-row')[1].trigger('click')
    expect(wrapper.emitted('select')![0]).toEqual([2])
  })

  it('shows an empty message when there are no cars', () => {
    const wrapper = mount(CarTable, { props: { cars: [] } })
    expect(wrapper.text()).toContain('No cars')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:unit -- --run src/components/__tests__/CarTable.spec.ts
```
Expected: FAIL — cannot resolve `@/components/CarTable.vue`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/CarTable.vue`:

```vue
<script setup lang="ts">
import type { CarSummary } from '@/api/cars'

defineProps<{
  cars: CarSummary[]
}>()

const emit = defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <table v-if="cars.length" class="car-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Make</th>
        <th>Model</th>
        <th>Year</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="car in cars"
        :key="car.id"
        class="car-row"
        @click="emit('select', car.id)"
      >
        <td>{{ car.id }}</td>
        <td>{{ car.make }}</td>
        <td>{{ car.model }}</td>
        <td>{{ car.year }}</td>
      </tr>
    </tbody>
  </table>
  <p v-else class="empty">No cars to show.</p>
</template>

<style scoped>
.car-table {
  width: 100%;
  border-collapse: collapse;
}
.car-table th,
.car-table td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #ddd;
}
.car-row {
  cursor: pointer;
}
.car-row:hover {
  background: #f4f4f4;
}
.empty {
  color: #666;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm run test:unit -- --run src/components/__tests__/CarTable.spec.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/CarTable.vue src/components/__tests__/CarTable.spec.ts
git commit -m "feat: add car table component"
```

---

### Task 5: CarDetailModal component

**Files:**
- Create: `src/components/CarDetailModal.vue`
- Test: `src/components/__tests__/CarDetailModal.spec.ts`

**Interfaces:**
- Consumes: `getCar` and `CarDetail` from `@/api/cars`.
- Produces: a component that:
  - Accepts prop `carId: number | null` (null = closed, renders nothing).
  - When `carId` becomes a number, calls `getCar(carId)`, showing a loading state, then the detail (including `image_url` as an `<img>`).
  - Shows an error message if `getCar` rejects.
  - Emits `close` when the close button or backdrop is clicked.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/CarDetailModal.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:unit -- --run src/components/__tests__/CarDetailModal.spec.ts
```
Expected: FAIL — cannot resolve `@/components/CarDetailModal.vue`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/CarDetailModal.vue`:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { getCar, type CarDetail } from '@/api/cars'

const props = defineProps<{
  carId: number | null
}>()

const emit = defineEmits<{
  close: []
}>()

const car = ref<CarDetail | null>(null)
const loading = ref(false)
const error = ref('')

watch(
  () => props.carId,
  async (id) => {
    car.value = null
    error.value = ''
    if (id === null) return
    loading.value = true
    try {
      car.value = await getCar(id)
    } catch {
      error.value = 'Could not load car details.'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="carId !== null" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <button class="modal-close" type="button" @click="emit('close')">×</button>

      <p v-if="loading">Loading…</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <div v-else-if="car" class="detail">
        <h2>{{ car.year }} {{ car.make }} {{ car.model }}</h2>
        <img v-if="car.image_url" :src="car.image_url" :alt="`${car.make} ${car.model}`" />
        <dl>
          <dt>Trim</dt><dd>{{ car.trim }}</dd>
          <dt>Horsepower</dt><dd>{{ car.horsepower }}</dd>
          <dt>Cylinders</dt><dd>{{ car.cylinders }}</dd>
          <dt>Displacement</dt><dd>{{ car.displacement }}</dd>
          <dt>Fuel type</dt><dd>{{ car.fuel_type }}</dd>
          <dt>Transmission</dt><dd>{{ car.transmission }}</dd>
          <dt>Body class</dt><dd>{{ car.body_class }}</dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal {
  position: relative;
  background: #fff;
  color: #111;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}
.modal-close {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}
.detail img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.detail dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
}
.detail dt {
  font-weight: 600;
}
.detail dd {
  margin: 0;
}
.error {
  color: #c00;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm run test:unit -- --run src/components/__tests__/CarDetailModal.spec.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/CarDetailModal.vue src/components/__tests__/CarDetailModal.spec.ts
git commit -m "feat: add car detail modal component"
```

---

### Task 6: CarsView (orchestration) + route

**Files:**
- Create: `src/views/CarsView.vue`
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`
- Test: `src/views/__tests__/CarsView.spec.ts`

**Interfaces:**
- Consumes: `searchCars`, `CarSummary`, `CarSearchParams` from `@/api/cars`; `CarSearchForm`, `CarTable`, `CarDetailModal` components.
- Produces: the `/` route view tying search → table → modal together with `limit`/`offset` pagination.

- [ ] **Step 1: Write the failing test**

Create `src/views/__tests__/CarsView.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/cars', () => ({
  searchCars: vi.fn(),
  getCar: vi.fn(),
}))

import { searchCars } from '@/api/cars'
import CarsView from '@/views/CarsView.vue'

const page1 = [
  { id: 1, make: 'Toyota', model: 'Corolla', year: 2020 },
  { id: 2, make: 'Toyota', model: 'Camry', year: 2019 },
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
        id: i + 1,
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

    expect(vi.mocked(searchCars).mock.calls[1][0]).toEqual({
      make: 'Toyota',
      limit: 20,
      offset: 20,
    })
  })

  it('surfaces 422 field errors from the search', async () => {
    vi.mocked(searchCars).mockRejectedValue({
      response: { status: 422, data: { message: 'invalid', errors: { make: ['Required.'] } } },
    })
    const wrapper = mount(CarsView)
    await wrapper.find('input[name="make"]').setValue('')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Required.')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test:unit -- --run src/views/__tests__/CarsView.spec.ts
```
Expected: FAIL — cannot resolve `@/views/CarsView.vue`.

- [ ] **Step 3: Write minimal implementation**

Create `src/views/CarsView.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { searchCars, type CarSummary, type CarSearchParams } from '@/api/cars'
import CarSearchForm from '@/components/CarSearchForm.vue'
import CarTable from '@/components/CarTable.vue'
import CarDetailModal from '@/components/CarDetailModal.vue'

const LIMIT = 20

const cars = ref<CarSummary[]>([])
const hasSearched = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const offset = ref(0)
const selectedCarId = ref<number | null>(null)

// Filters from the last submitted search (make required for pagination refetch).
const filters = ref<{ make: string; year?: number; model?: string } | null>(null)

async function runSearch() {
  if (!filters.value) return
  loading.value = true
  error.value = ''
  fieldErrors.value = {}
  const params: CarSearchParams = {
    make: filters.value.make,
    limit: LIMIT,
    offset: offset.value,
  }
  if (filters.value.year !== undefined) params.year = filters.value.year
  if (filters.value.model !== undefined) params.model = filters.value.model

  try {
    cars.value = await searchCars(params)
    hasSearched.value = true
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }
    if (err.response?.status === 422 && err.response.data?.errors) {
      fieldErrors.value = err.response.data.errors
    } else {
      error.value = 'Something went wrong while searching. Please try again.'
    }
    cars.value = []
  } finally {
    loading.value = false
  }
}

function onSearch(payload: { make: string; year?: number; model?: string }) {
  filters.value = payload
  offset.value = 0
  runSearch()
}

function next() {
  offset.value += LIMIT
  runSearch()
}

function prev() {
  offset.value = Math.max(0, offset.value - LIMIT)
  runSearch()
}
</script>

<template>
  <main class="cars-view">
    <h1>Cars</h1>

    <CarSearchForm :errors="fieldErrors" :loading="loading" @search="onSearch" />

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="status">Loading…</p>

    <template v-if="hasSearched && !loading">
      <CarTable :cars="cars" @select="selectedCarId = $event" />

      <div class="pager">
        <button class="prev" type="button" :disabled="offset === 0" @click="prev">
          Previous
        </button>
        <button
          class="next"
          type="button"
          :disabled="cars.length < LIMIT"
          @click="next"
        >
          Next
        </button>
      </div>
    </template>

    <p v-else-if="!hasSearched && !loading" class="status">
      Search for cars by make to get started.
    </p>

    <CarDetailModal :carId="selectedCarId" @close="selectedCarId = null" />
  </main>
</template>

<style scoped>
.cars-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.pager {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.status {
  color: #666;
}
.error {
  color: #c00;
}
</style>
```

- [ ] **Step 4: Register the route**

Replace `src/router/index.ts`:

```ts
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
```

- [ ] **Step 5: Render the router outlet in `App.vue`**

Replace `src/App.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <RouterView />
</template>

<style scoped></style>
```

- [ ] **Step 6: Update the scaffold's App test**

The existing `src/__tests__/App.spec.ts` asserts the old "You did it!" markup and will now fail. Replace its contents:

```ts
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
```

- [ ] **Step 7: Run the full unit suite to verify it passes**

Run:
```bash
npm run test:unit -- --run
```
Expected: PASS — all suites (api, three components, CarsView, App).

- [ ] **Step 8: Type-check the project**

Run:
```bash
npx vue-tsc --build
```
Expected: exit code 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/views/CarsView.vue src/views/__tests__/CarsView.spec.ts src/router/index.ts src/App.vue src/__tests__/App.spec.ts
git commit -m "feat: wire cars view with search, table, pagination and detail modal"
```

---

### Task 7: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Start the Laravel backend**

In the `../laravel` directory, ensure it serves on `http://localhost:8000`:
```bash
php artisan serve
```
Expected: "Server running on http://127.0.0.1:8000".

- [ ] **Step 2: Start the Vue dev server**

In the `vue` directory:
```bash
npm run dev
```
Expected: Vite prints a local URL (e.g. `http://localhost:5173`).

- [ ] **Step 3: Verify the flow in the browser**

Open the Vite URL and confirm:
- The page shows "Search for cars by make to get started."
- Entering a make (e.g. `Toyota`) and clicking Search populates the table.
- Previous is disabled on the first page; Next advances results.
- Clicking a row opens the modal and shows detail fields plus an image.
- Closing the modal (× or backdrop) returns to the table.
- Submitting a blank make surfaces the validation message from the API.

- [ ] **Step 4: No commit needed** (verification only). If any issue is found, fix it under the relevant task and re-run that task's tests.

---

## Self-Review Notes

- **Spec coverage:** API module (Task 2) ↔ contract; search form (Task 3) ↔ required make + optional year/model + 422 field errors; table (Task 4) ↔ list rendering + row select + empty state; modal (Task 5) ↔ detail fetch + image + error; CarsView (Task 6) ↔ empty state, pagination (offset±limit, Next disabled on short page, Previous disabled at offset 0), 422 handling; proxy + axios (Task 1) ↔ connection decision. Manual E2E (Task 7) ↔ full flow.
- **Placeholders:** none — all code and commands are concrete.
- **Type consistency:** `CarSummary`, `CarDetail`, `CarSearchParams`, `searchCars`, `getCar` names/signatures are identical across Tasks 2, 4, 5, 6.
