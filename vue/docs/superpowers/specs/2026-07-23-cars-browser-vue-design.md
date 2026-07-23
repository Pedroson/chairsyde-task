# Cars Browser (Vue SPA) — Design

**Date:** 2026-07-23
**Status:** Approved

## Goal

In the scaffolded Vue SPA, build a table populated from the Cars list API endpoint.
Clicking a row fetches that car's detail from the detail endpoint and shows it in a
modal. Keep the implementation simple; use axios for API calls.

## API Contract (from `../laravel/openapi.yaml`)

Base path: `/api`.

### `GET /api/cars` — Search cars
Query parameters (form style, exploded). **No additional fields permitted.**

| Field  | Type    | Required | Constraints                     |
|--------|---------|----------|---------------------------------|
| make   | string  | yes      | maxLength 255                   |
| limit  | integer | yes      | 1–1000                          |
| offset | integer | yes      | >= 0                            |
| year   | integer | no       | 1900–2023, nullable             |
| model  | string  | no       | maxLength 255, nullable         |

Response `200`: array of `CarSummary`:
```
{ id: integer, make: string, model: string, year: integer }
```
Response `422`: `{ message: string, errors: { <field>: string[] } }`.

Note: the list response is a **bare array with no total count**.

### `GET /api/cars/{id}` — Car detail
Path param `id` (integer). Response `200`: `CarDetail`:
```
{
  id: integer, make: string, model: string, year: integer,
  trim: string, horsepower: string, cylinders: string,
  displacement: string, fuel_type: string, transmission: string,
  body_class: string, image_url: string
}
```
Response `404`: `{ message: string }`. Response `422`: validation error body.

## Decisions

- **Initial UX:** Empty state + search. Page loads with an empty table and a
  friendly prompt; results load once the user searches (make required).
- **API connection:** Vite dev proxy — Vite proxies `/api` to
  `http://localhost:8000`, so the browser makes same-origin relative calls and no
  CORS configuration is required. axios uses `baseURL: '/api'`.
- **Pagination:** Simple prev/next using `limit` + `offset`.

## Architecture

A single route/view orchestrates child components and delegates all HTTP to a thin
typed API module.

### Files

- `src/api/cars.ts`
  - Exports `CarSummary` and `CarDetail` TypeScript interfaces mirroring the schemas.
  - Creates an axios instance with `baseURL: '/api'`.
  - `searchCars(params: CarSearchParams): Promise<CarSummary[]>`.
  - `getCar(id: number): Promise<CarDetail>`.
  - `CarSearchParams = { make: string; limit: number; offset: number; year?: number; model?: string }`.

- `src/components/CarSearchForm.vue`
  - Inputs: make (required), year (optional), model (optional).
  - Emits `search` with `{ make, year?, model? }`. Does not own pagination.
  - Shows field-level validation messages passed in via prop (from a 422 response).

- `src/components/CarTable.vue`
  - Props: `cars: CarSummary[]`.
  - Renders columns: id, make, model, year. Row click emits `select(id)`.
  - Empty state shown when there are no cars.

- `src/components/CarDetailModal.vue`
  - Prop: `carId: number | null` (null = closed).
  - On open, calls `getCar(carId)`; owns its own loading/error/data state.
  - Renders all `CarDetail` fields including `image_url` as an image.
  - Emits `close`.

- `src/views/CarsView.vue`
  - Holds: current search params, pagination (`limit` default 20, `offset`),
    `cars` list, `selectedCarId`, and UI state (empty / loading / error / results).
  - Wires form → search, table → open modal, prev/next → adjust offset & refetch.
  - Registered as the `/` route in `src/router/index.ts`.

### Config

- `vite.config.ts`: add `server.proxy` mapping `/api` → `http://localhost:8000`.
- `package.json`: add `axios` dependency.

## Data Flow

1. Load → empty state with search bar.
2. Search → reset `offset` to 0 → `searchCars({ make, year?, model?, limit, offset })`
   → populate table (or show empty-results message).
3. Row click → set `selectedCarId` → modal opens → `getCar(id)` → show detail.
4. Prev/Next → change `offset` by `limit`, refetch with the same filters.

## Error Handling

- **422 (search):** map `errors` to field messages shown near the form inputs.
- **Network / 5xx (search):** friendly inline error message above the table with the
  ability to retry by searching again.
- **Modal detail failure (404 / network):** show an error message inside the modal.

## Pagination Behaviour

Because the list endpoint returns no total count:
- `offset === 0` disables Previous.
- Next is enabled while the last fetch returned a **full page** (`cars.length === limit`)
  and disabled when a short or empty page returns.

## Testing

Vitest + `@vue/test-utils` (already installed). Mock the `src/api/cars` module.

- `CarSearchForm`: emits `search` with correct payload; renders passed-in field errors.
- `CarTable`: renders a row per car; emits `select(id)` on row click; shows empty state.
- `CarDetailModal`: calls `getCar` on open, renders detail fields, emits `close`.
- `CarsView`: search populates table; row click opens modal; prev/next adjust offset.

Keep tests focused on behaviour, not exhaustive coverage.

## Out of Scope (YAGNI)

- Auth, sorting, column configuration, debounced live search, caching, total-count UI.
