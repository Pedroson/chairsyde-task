# Car API Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Pest unit and feature test coverage for the `GET /api/cars` and `GET /api/cars/{id}` endpoints, documenting current behavior (including two known bugs).

**Architecture:** Unit tests exercise the DTOs and handlers in isolation using plain in-file test-double repositories (no Mockery, no framework boot). Feature tests drive the real routes through the full HTTP stack with `Http::fake()` stubbing the external CarVector API, so no network calls occur.

**Tech Stack:** Pest v4, `pestphp/pest-plugin-laravel`, Laravel 13, PHP 8.5. `Illuminate\Support\Facades\Http` fake/assert helpers.

## Global Constraints

- Test only existing behavior. Do NOT modify any application code (DTOs, handlers, repository, providers) as part of this work.
- All tests use Pest (`test('...', function () { ... })`), matching `tests/Unit/ExampleTest.php` and `tests/Feature/ExampleTest.php`.
- Unit tests live in `tests/Unit/` and must not require the framework container. Feature tests live in `tests/Feature/` (bound to `Tests\TestCase` via `tests/Pest.php`).
- Feature tests must never make real HTTP calls: call `Http::fake(...)` and `Http::preventStrayRequests()` before hitting a route.
- The CarVector base URL is hardcoded in `config/services.php` as `https://api.carvector.io/v1`. The API key comes from `services.carvector.api_key`; set it to `'test-key'` in feature tests (the real key is never needed because HTTP is faked).
- Run Pint after creating files: `vendor/bin/pint --dirty --format agent`.
- Do NOT delete the scaffolded `tests/Unit/ExampleTest.php` or `tests/Feature/ExampleTest.php` (removing tests needs approval).
- These tests document existing code, so each new test is expected to **PASS** on first run (there is no red phase to force). Where a test documents a bug, it asserts the actual buggy behavior and therefore also passes.

---

### Task 1: DTO unit tests

Covers field mapping for all four DTOs.

**Files:**
- Create: `tests/Unit/CarDataDtoTest.php`
- Create: `tests/Unit/CarDetailDtoTest.php`
- Create: `tests/Unit/CarSearchRequestDtoTest.php`
- Create: `tests/Unit/CarDetailsRequestDtoTest.php`

**Interfaces:**
- Consumes: `App\Dtos\CarDataDto::fromArray(array): self`; `App\Dtos\CarDetailDto::fromArray(array): self`; `App\Dtos\CarSearchRequestDto::fromArray(array): self` and `->toArray(): array`; `App\Dtos\CarDetailsRequestDto::fromArray(array): self`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `tests/Unit/CarDataDtoTest.php`**

```php
<?php

use App\Dtos\CarDataDto;

test('fromArray maps all summary fields', function () {
    $dto = CarDataDto::fromArray([
        'id' => 1,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
    ]);

    expect($dto->id)->toBe(1)
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->year)->toBe(2020);
});
```

- [ ] **Step 2: Write `tests/Unit/CarDetailDtoTest.php`**

```php
<?php

use App\Dtos\CarDetailDto;

test('fromArray maps all detail fields', function () {
    $data = [
        'id' => 1,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'trim' => 'LE',
        'horsepower' => '169',
        'cylinders' => '4',
        'displacement' => '2.0',
        'fuel_type' => 'Gasoline',
        'transmission' => 'Automatic',
        'body_class' => 'Sedan',
        'image_url' => 'https://example.com/car.png',
    ];

    $dto = CarDetailDto::fromArray($data);

    expect($dto->id)->toBe(1)
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->year)->toBe(2020)
        ->and($dto->trim)->toBe('LE')
        ->and($dto->horsepower)->toBe('169')
        ->and($dto->cylinders)->toBe('4')
        ->and($dto->displacement)->toBe('2.0')
        ->and($dto->fuel_type)->toBe('Gasoline')
        ->and($dto->transmission)->toBe('Automatic')
        ->and($dto->body_class)->toBe('Sedan')
        ->and($dto->image_url)->toBe('https://example.com/car.png');
});
```

- [ ] **Step 3: Write `tests/Unit/CarSearchRequestDtoTest.php`**

```php
<?php

use App\Dtos\CarSearchRequestDto;

test('fromArray builds the dto from validated data', function () {
    $dto = CarSearchRequestDto::fromArray([
        'year' => 2020,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'limit' => 10,
        'offset' => 0,
    ]);

    expect($dto->year)->toBe(2020)
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->limit)->toBe(10)
        ->and($dto->offset)->toBe(0);
});

test('toArray round-trips every field', function () {
    $data = [
        'year' => 2020,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'limit' => 10,
        'offset' => 5,
    ];

    expect(CarSearchRequestDto::fromArray($data)->toArray())->toBe($data);
});
```

- [ ] **Step 4: Write `tests/Unit/CarDetailsRequestDtoTest.php`**

```php
<?php

use App\Dtos\CarDetailsRequestDto;

test('fromArray maps the id', function () {
    expect(CarDetailsRequestDto::fromArray(['id' => 42])->id)->toBe(42);
});
```

- [ ] **Step 5: Run the DTO tests, expect PASS**

Run: `php artisan test --compact tests/Unit/CarDataDtoTest.php tests/Unit/CarDetailDtoTest.php tests/Unit/CarSearchRequestDtoTest.php tests/Unit/CarDetailsRequestDtoTest.php`
Expected: PASS (5 assertions across 5 tests; code already exists).

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add tests/Unit/CarDataDtoTest.php tests/Unit/CarDetailDtoTest.php tests/Unit/CarSearchRequestDtoTest.php tests/Unit/CarDetailsRequestDtoTest.php
git commit -m "test: cover car DTO field mapping"
```

---

### Task 2: CarSearchHandler unit test

Verifies the handler maps repository rows to a `CarDataDto` collection and forwards the DTO to the repository.

**Files:**
- Create: `tests/Unit/CarSearchHandlerTest.php`

**Interfaces:**
- Consumes: `App\Handlers\CarSearchHandler::__construct(CarDataRepositoryInterface)`, `->handle(CarSearchRequestDto): Illuminate\Support\Collection`; `App\Contracts\CarDataRepositoryInterface` with `getAll(CarSearchRequestDto): Collection` and `findById(CarDetailsRequestDto): ?array`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `tests/Unit/CarSearchHandlerTest.php`**

```php
<?php

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDataDto;
use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use App\Handlers\CarSearchHandler;
use Illuminate\Support\Collection;

test('handle maps repository rows to a CarDataDto collection', function () {
    $repository = new class implements CarDataRepositoryInterface {
        public ?CarSearchRequestDto $received = null;

        public function getAll(CarSearchRequestDto $dto): Collection
        {
            $this->received = $dto;

            return collect([
                ['id' => 1, 'make' => 'Toyota', 'model' => 'Corolla', 'year' => 2020],
                ['id' => 2, 'make' => 'Toyota', 'model' => 'Camry', 'year' => 2021],
            ]);
        }

        public function findById(CarDetailsRequestDto $dto): ?array
        {
            return null;
        }
    };

    $dto = new CarSearchRequestDto(year: 2020, make: 'Toyota', model: 'Corolla', limit: 10, offset: 0);

    $result = (new CarSearchHandler($repository))->handle($dto);

    expect($result)->toHaveCount(2)
        ->and($result->first())->toBeInstanceOf(CarDataDto::class)
        ->and($result->first()->model)->toBe('Corolla')
        ->and($repository->received)->toBe($dto);
});
```

- [ ] **Step 2: Run the test, expect PASS**

Run: `php artisan test --compact tests/Unit/CarSearchHandlerTest.php`
Expected: PASS.

- [ ] **Step 3: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add tests/Unit/CarSearchHandlerTest.php
git commit -m "test: cover CarSearchHandler mapping"
```

---

### Task 3: CarDetailHandler unit test

Verifies both handler branches: found → `CarDetailDto`, and `null` → `NotFoundHttpException`.

**Files:**
- Create: `tests/Unit/CarDetailHandlerTest.php`

**Interfaces:**
- Consumes: `App\Handlers\CarDetailHandler::__construct(CarDataRepositoryInterface)`, `->handle(CarDetailsRequestDto): App\Dtos\CarDetailDto` (throws `Symfony\Component\HttpKernel\Exception\NotFoundHttpException` with message `'Car not found'` when the repository returns `null`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `tests/Unit/CarDetailHandlerTest.php`**

```php
<?php

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDetailDto;
use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use App\Handlers\CarDetailHandler;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

function fakeCarDetailRepository(?array $row): CarDataRepositoryInterface
{
    return new class($row) implements CarDataRepositoryInterface {
        public function __construct(private ?array $row) {}

        public function getAll(CarSearchRequestDto $dto): Collection
        {
            return collect();
        }

        public function findById(CarDetailsRequestDto $dto): ?array
        {
            return $this->row;
        }
    };
}

test('handle returns a CarDetailDto when the repository finds the car', function () {
    $row = [
        'id' => 1,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'trim' => 'LE',
        'horsepower' => '169',
        'cylinders' => '4',
        'displacement' => '2.0',
        'fuel_type' => 'Gasoline',
        'transmission' => 'Automatic',
        'body_class' => 'Sedan',
        'image_url' => 'https://example.com/car.png',
    ];

    $result = (new CarDetailHandler(fakeCarDetailRepository($row)))
        ->handle(new CarDetailsRequestDto(id: 1));

    expect($result)->toBeInstanceOf(CarDetailDto::class)
        ->and($result->id)->toBe(1)
        ->and($result->image_url)->toBe('https://example.com/car.png');
});

test('handle throws NotFoundHttpException when the repository returns null', function () {
    (new CarDetailHandler(fakeCarDetailRepository(null)))
        ->handle(new CarDetailsRequestDto(id: 999));
})->throws(NotFoundHttpException::class, 'Car not found');
```

- [ ] **Step 2: Run the test, expect PASS**

Run: `php artisan test --compact tests/Unit/CarDetailHandlerTest.php`
Expected: PASS (2 tests).

- [ ] **Step 3: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add tests/Unit/CarDetailHandlerTest.php
git commit -m "test: cover CarDetailHandler found and not-found branches"
```

---

### Task 4: Car search feature test

Drives `GET /api/cars` through the full stack with a faked CarVector API.

**Files:**
- Create: `tests/Feature/CarSearchTest.php`

**Interfaces:**
- Consumes: route `GET /api/cars` (resolves `App\Http\Controllers\CarSearchController`); `services.carvector.api_key` config; CarVector endpoint `GET https://api.carvector.io/v1/vehicles`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `tests/Feature/CarSearchTest.php`**

```php
<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.carvector.api_key', 'test-key');
    Http::preventStrayRequests();
});

test('it returns a list of cars from the CarVector API', function () {
    Http::fake([
        '*' => Http::response([
            ['id' => 1, 'make' => 'Toyota', 'model' => 'Corolla', 'year' => 2020],
            ['id' => 2, 'make' => 'Toyota', 'model' => 'Camry', 'year' => 2021],
        ]),
    ]);

    $this->getJson('/api/cars?make=Toyota&year=2020&model=Corolla&limit=10&offset=0')
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonPath('0.id', 1)
        ->assertJsonPath('0.make', 'Toyota')
        ->assertJsonPath('0.model', 'Corolla')
        ->assertJsonPath('0.year', 2020);
});

test('it forwards the query params and bearer token to CarVector', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars?make=Toyota&year=2020&model=Corolla&limit=10&offset=0');

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'api.carvector.io/v1/vehicles')
            && $request->hasHeader('Authorization', 'Bearer test-key')
            && str_contains($request->url(), 'make=Toyota')
            && str_contains($request->url(), 'limit=10')
            && str_contains($request->url(), 'offset=0');
    });
});

test('it returns 422 when required fields are missing', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['make', 'limit', 'offset']);
});

test('it returns 422 when year and limit are out of range', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars?make=Toyota&year=1800&model=Corolla&limit=0&offset=0')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['year', 'limit']);
});
```

- [ ] **Step 2: Run the test, expect PASS**

Run: `php artisan test --compact tests/Feature/CarSearchTest.php`
Expected: PASS (4 tests).

- [ ] **Step 3: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add tests/Feature/CarSearchTest.php
git commit -m "test: cover car search endpoint happy path and validation"
```

---

### Task 5: Car detail feature test

Drives `GET /api/cars/{id}` through the full stack, including the documented not-found behavior (Finding #2).

**Files:**
- Create: `tests/Feature/CarDetailTest.php`

**Interfaces:**
- Consumes: route `GET /api/cars/{id}` (resolves `App\Http\Controllers\CarDetailController`); `services.carvector.api_key` config; CarVector endpoint `GET https://api.carvector.io/v1/vehicles/{id}`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `tests/Feature/CarDetailTest.php`**

```php
<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.carvector.api_key', 'test-key');
    Http::preventStrayRequests();
});

test('it returns the car detail from the CarVector API', function () {
    Http::fake([
        '*' => Http::response([
            'id' => 1,
            'make' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2020,
            'trim' => 'LE',
            'horsepower' => '169',
            'cylinders' => '4',
            'displacement' => '2.0',
            'fuel_type' => 'Gasoline',
            'transmission' => 'Automatic',
            'body_class' => 'Sedan',
            'image_url' => 'https://example.com/car.png',
        ]),
    ]);

    $this->getJson('/api/cars/1')
        ->assertOk()
        ->assertJsonPath('id', 1)
        ->assertJsonPath('make', 'Toyota')
        ->assertJsonPath('image_url', 'https://example.com/car.png');
});

// Finding #2: a CarVector 404 yields an empty array from findById(), so the
// handler's null -> NotFoundHttpException branch is never hit; CarDetailDto::
// fromArray([]) then fails on the missing 'id' key and surfaces as a 500.
// This test documents the CURRENT behavior, not the desired 404.
test('a CarVector 404 currently surfaces as a 500, not a 404', function () {
    Http::fake(['*' => Http::response([], 404)]);

    $this->getJson('/api/cars/999')->assertStatus(500);
});
```

- [ ] **Step 2: Run the test, expect PASS**

Run: `php artisan test --compact tests/Feature/CarDetailTest.php`
Expected: PASS (2 tests). The second test passes by asserting the actual `500`.

- [ ] **Step 3: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add tests/Feature/CarDetailTest.php
git commit -m "test: cover car detail endpoint and document 404-as-500 behavior"
```

---

### Task 6: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the entire suite**

Run: `php artisan test --compact`
Expected: PASS — all new tests plus the two scaffolded `ExampleTest` files, no failures.

- [ ] **Step 2: If everything passes, no commit needed**

The suite is green; the feature is complete.

---

## Notes for the implementer

- If the `500` assertion in Task 5 comes back as a different status, capture the actual status and stop — that is new information about the not-found path, not a test to force green. Report it rather than editing application code.
- `Http::preventStrayRequests()` guarantees any un-faked outbound call fails loudly, so a passing suite proves no real network calls happen.
- The `year`/`model` search params are optional in validation but required by `CarSearchRequestDto::fromArray` (no defaults). The feature tests always send them; do not remove them from the query strings.
