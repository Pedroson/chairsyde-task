# Car API Test Suite — Design

**Date:** 2026-07-23
**Status:** Approved

## Goal

Add automated test coverage for the two Car API endpoints (`GET /api/cars`,
`GET /api/cars/{id}`) using Pest for the entire suite — unit tests for the pure
pieces and feature tests for the full HTTP stack. Behat was considered and
rejected: Laravel's native Pest stack already covers end-to-end HTTP testing
without a second framework.

## Scope

Test existing behavior only. No application code is changed as part of adding
tests. Two behavioral findings (below) are documented via tests and left for a
separate decision.

## Architecture

The endpoints resolve `CarDataRepositoryInterface` to `ApiCarRepository`, which
calls the external CarVector API via Laravel's `Http` facade. Tests never hit
the network:

- **Unit tests** exercise DTOs, handlers (with a mocked repository), and
  validation rules in isolation.
- **Feature tests** drive the real routes through the full stack
  (routing → validation → controller → handler → repository → JSON) with
  `Http::fake()` stubbing the CarVector responses.

## Test Plan

### `tests/Unit/`

- `CarDataDtoTest` — `fromArray` maps `id`, `make`, `model`, `year`.
- `CarDetailDtoTest` — `fromArray` maps all 12 fields.
- `CarSearchRequestDtoTest` — `fromArray` builds the DTO; `toArray` round-trips
  `year`, `make`, `model`, `limit`, `offset` (no defaults — all required).
- `CarDetailsRequestDtoTest` — `fromArray` maps `id`.
- `CarSearchHandlerTest` — mocks `CarDataRepositoryInterface`, asserts the
  repository result is mapped to a `Collection<CarDataDto>`.
- `CarDetailHandlerTest` — repo returns an array → `CarDetailDto`; repo returns
  `null` → throws `NotFoundHttpException('Car not found')` (covers that branch
  directly, independent of the real repository).

### `tests/Feature/`

`beforeEach` sets a dummy `services.carvector.api_key` and calls `Http::fake()`.

- `CarSearchTest`
  - Happy path: `GET /api/cars?make=...&limit=...&offset=...` with a faked
    CarVector vehicle list → `200` + JSON array shape. Assert the outbound
    request hit the CarVector `/vehicles` URL with the expected query params and
    bearer token.
  - Validation: `422` when `make`, `limit`, or `offset` are missing; `422` for
    out-of-range `year` and `limit`.
- `CarDetailTest`
  - Happy path: faked CarVector vehicle → `200` + full detail JSON.
  - Not found: faked CarVector `404`. Assert the **actual** resulting behavior
    (the repository's `->throw()` raises `RequestException`, so this surfaces as
    an unhandled `500`, not a `404`) rather than asserting a `404` that does not
    occur. See Finding #2.

## Findings (documented, not fixed here)

1. **~~`services.user_data.source` never defined~~** — resolved by the user;
   `RepositoryServiceProvider` now binds `ApiCarRepository` unconditionally.
2. **Detail not-found never returns 404.** `ApiCarRepository::findById()` calls
   `->throw()`, so a CarVector `404` raises `RequestException` (unhandled `500`)
   and `CarDetailHandler`'s `null → NotFoundHttpException` branch is unreachable
   via the real repository. This contradicts the `404` documented in
   `openapi.yaml`. Feature tests document the current behavior; the fix (map a
   CarVector `404` to `null`, or catch the exception) is a separate decision.

## Out of Scope

- Implementing or changing `ApiCarRepository` or any handler/DTO behavior.
- Reconciling the `openapi.yaml` 404 contract with Finding #2.
- Browser tests (Pest v4 supports them; not needed for JSON endpoints).
