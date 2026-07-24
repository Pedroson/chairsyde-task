# Laravel → NestJS Backend Migration — Design

**Date:** 2026-07-24
**Status:** Approved

## Goal

Migrate the Laravel backend (`laravel/`) to NestJS (`nest/`), preserving the layered
architecture (repositories, use-case handlers/services, DTOs) as closely as is idiomatic
in Nest. The Vue frontend (`vue/`) must continue to work when pointed at the new backend.
The **success-response contract does not change**; error-response shapes deliberately move
to Nest's native shapes, with coordinated updates to the Vue app and the OpenAPI spec.

## Current system (Laravel)

A thin API gateway in front of the external **CarVector** API (`https://api.carvector.io/v1`).
No local database for cars — data is fetched live over HTTP.

Two endpoints, both GET, under the `/api` prefix:

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/cars` | Search/list vehicles |
| GET | `/api/cars/{id}` | Get one vehicle by id (`whereAlphaNumeric` route constraint) |

Flow: **Route → invokable Controller → FormRequest (search only) → Request DTO (`fromArray`)
→ Handler (use case) → Repository *interface* → HTTP client → Response DTO → `response()->json()`**.

## Contract invariants (MUST NOT break — success responses)

- Base path `/api`; routes `GET /api/cars` and `GET /api/cars/:id`.
- **Search** returns a **bare JSON array** (no envelope) of `CarSummary`.
- **Detail** returns a **bare JSON object** `CarDetail`.
- Field names are **snake_case** (`displacement_l`, `fuel_type`, `body_class`, `image_url`).
- `year` is a **number**; `horsepower`/`cylinders`/`displacement_l` are **strings**; the 8 extended
  detail fields are string-or-`null`.
- `CarSummary` = `{ id: string, make: string, model: string, year: number }`.
- `CarDetail` = `CarSummary` + `{ trim, horsepower, cylinders, displacement_l, fuel_type,
  transmission, body_class, image_url }` (each `string | null`).
- Search query params: `make` (req), `limit` (req), `offset` (req), `year` (opt), `model` (opt);
  optional params omitted entirely when not provided.

## Deliberate changes (error responses)

Rather than force Laravel's error shapes onto Nest, we keep Nest-native shapes and adapt the
consumer + spec (limited, targeted changes):

- **Validation errors**: HTTP **422** (via `ValidationPipe({ errorHttpStatusCode: 422 })`) with
  Nest's native body `{ statusCode, error, message: string[] }`. `message` is a flat array of
  strings, **not** keyed by field.
- **Not found**: Nest's native `NotFoundException('Car not found')` →
  `{ statusCode: 404, message: "Car not found", error: "Not Found" }`.
- **Vue update**: `CarsView.vue` error handling reads `err.response.data.message` (array) and
  renders the messages as a list instead of per-field inline errors.
- **OpenAPI update**: `openapi.yaml` error schemas (`ValidationErrorBody`, `ErrorBody`/404) updated
  to the Nest shapes. Success (200) schemas untouched.

## Target architecture (Nest)

Single `CarsModule` mirroring the Laravel layers with Nest-idiomatic names.

```
nest/src/
├── main.ts                       # global ValidationPipe (422 status), setGlobalPrefix('api'), reads PORT
├── app.module.ts                 # ConfigModule (global) + CarsModule
└── cars/
    ├── cars.module.ts            # controller, services, repository provider (HttpModule)
    ├── cars.controller.ts        # GET /cars, GET /cars/:id (thin)
    ├── dto/
    │   ├── car-search-request.dto.ts   # class-validator rules
    │   ├── car-summary.dto.ts          # response shape (was CarDataDto)
    │   └── car-detail.dto.ts           # response shape (was CarDetailDto)
    ├── interfaces/
    │   └── car-data.repository.ts      # CAR_DATA_REPOSITORY token + interface
    ├── services/
    │   ├── car-search.service.ts       # use case (was CarSearchHandler)
    │   └── car-detail.service.ts       # use case (was CarDetailHandler; throws NotFoundException)
    └── repositories/
        └── api-car.repository.ts       # @nestjs/axios HttpService → CarVector
```

### Layer decisions (carried from Laravel)

- **Repository bound by interface token**: `{ provide: CAR_DATA_REPOSITORY, useClass: ApiCarRepository }`
  — mirrors `RepositoryServiceProvider`; services depend on the interface, not the concrete class
  (swappable + mockable in tests).
- **Two use-case services** (search, detail), not one fat `CarsService` — preserves Laravel's
  one-handler-per-use-case pattern, renamed to `*.service.ts`.
- Global prefix `api` so routes are `/api/cars` and `/api/cars/:id`.

### Validation (`CarSearchRequestDto`)

class-validator decorators mapping Laravel rules exactly:

- `make`: required string, maxLength 255
- `limit`: required int, 1–1000
- `offset`: required int, ≥0
- `year`: optional int, 1900–2023
- `model`: optional string, maxLength 255

Global `ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true,
errorHttpStatusCode: 422 })` — coerces query strings to numbers, strips/rejects unknown params
(matches spec `additionalProperties: false`).

### `:id` alphanumeric constraint

Route the param with a regex — `@Get(':id([a-zA-Z0-9]+)')` — so non-alphanumeric ids fall through
to a 404 at routing, matching Laravel's `whereAlphaNumeric` behaviour without a manual pipe.

### Repository / upstream client

`ApiCarRepository` implements `CarDataRepository` using `@nestjs/axios` `HttpService`:

- `getAll(dto)` → `GET {base}/vehicles`, Bearer token + query params, reads the `results` key,
  defaults to `[]`.
- `findById(dto)` → `GET {base}/vehicles/:id`; upstream **404 → `null`**; **does not throw on 5xx**
  (search returns `[]`) — preserving the exact swallow-error quirk from Laravel.

### Config

`@nestjs/config` (global): `CAR_VECTOR_API_KEY`, `CAR_VECTOR_BASE_URL`
(default `https://api.carvector.io/v1`), `PORT` (default 3000). Add `.env.example`.

### Vue switchover

Make the Vite dev-proxy target configurable via env var (e.g. `VITE_API_TARGET`), defaulting to
Laravel (`http://127.0.0.1:8000`) and switchable to Nest (`http://127.0.0.1:3000`) — one setting
flips which backend the frontend uses.

## Testing (happy-path + 404/422)

Jest, mirroring the Pest split:

- **Unit**: `car-search.service` (maps rows → summary DTOs); `car-detail.service` (returns detail
  DTO; throws `NotFoundException` on null) — hand-rolled fake repository (like the Pest
  anonymous-class fakes).
- **e2e** (supertest, mocked `HttpService`): `GET /api/cars` returns array + forwards params/Bearer;
  `GET /api/cars/:id` returns detail; upstream 404 → 404; validation failure → 422; non-alphanumeric
  id → 404.

## Dependencies to add to Nest

`@nestjs/config`, `@nestjs/axios` (+ `axios`), `class-validator`, `class-transformer`.

## Migration order

1. Architecture/scaffolding first: install deps, `ConfigModule`, `HttpModule`, global pipe + prefix,
   `CarsModule` skeleton, repository interface + provider binding, `.env.example`.
2. Endpoint 1 — `GET /api/cars` (search): DTO + validation, service, repository `getAll`, tests.
3. Endpoint 2 — `GET /api/cars/:id` (detail): DTO, service (404), repository `findById`, tests.
4. Consumer + contract: update Vue error display + configurable proxy target; update `openapi.yaml`
   error schemas.

## Out of scope

- No local database / persistence (matches Laravel).
- No auth on our endpoints (matches Laravel).
- No changes to CarVector integration semantics beyond faithful re-implementation.
