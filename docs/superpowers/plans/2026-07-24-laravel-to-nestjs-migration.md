# Laravel → NestJS Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-implement the Laravel `cars` API gateway in the scaffolded NestJS project (`nest/`) as a drop-in replacement, preserving the success-response contract while adopting Nest-native error shapes (with coordinated Vue + OpenAPI updates).

**Architecture:** A single `CarsModule` mirrors the Laravel layers with Nest-idiomatic names — a thin controller, two use-case services (search, detail), and one repository (interface-bound via a DI token) that talks to the external CarVector API over HTTP. No local database. Global `api` route prefix and a global `ValidationPipe` (422) provide the framework-level behaviour Laravel gave for free.

**Tech Stack:** NestJS 11 (Express 5), TypeScript, `@nestjs/config`, `@nestjs/axios` (+ axios), `class-validator`, `class-transformer`, Jest + supertest (already installed).

## Global Constraints

Copied verbatim from the design spec. Every task's requirements implicitly include these.

- Base path `/api`; routes `GET /api/cars` and `GET /api/cars/:id`.
- **Search** returns a **bare JSON array** (no envelope) of `CarSummary`.
- **Detail** returns a **bare JSON object** `CarDetail`.
- Field names are **snake_case** (`displacement_l`, `fuel_type`, `body_class`, `image_url`).
- `year` is a **number**; `horsepower`/`cylinders`/`displacement_l` are **strings**; the 8 extended detail fields are string-or-`null`.
- `CarSummary` = `{ id: string, make: string, model: string, year: number }`.
- `CarDetail` = `CarSummary` + `{ trim, horsepower, cylinders, displacement_l, fuel_type, transmission, body_class, image_url }` (each `string | null`).
- Search query params: `make` (required), `limit` (required), `offset` (required), `year` (optional), `model` (optional). Unknown params are rejected (422).
- Validation rules: `make` string ≤255; `limit` int 1–1000; `offset` int ≥0; `year` int 1900–2023; `model` string ≤255.
- Validation failure → HTTP **422** with Nest-native body `{ statusCode, error, message: string[] }`.
- Missing car → HTTP **404** with body `{ statusCode: 404, message: "Car not found", error: "Not Found" }`.
- Non-alphanumeric `:id` → HTTP **404** (mirrors Laravel's `whereAlphaNumeric` route constraint).
- Upstream (CarVector): `GET {base}/vehicles` and `GET {base}/vehicles/:id` with `Authorization: Bearer <apiKey>`. Search reads the `results` key. Upstream 404 on detail → `null`; upstream 5xx on search → empty list (errors swallowed).
- Config from env: `CAR_VECTOR_API_KEY`, `CAR_VECTOR_BASE_URL` (default `https://api.carvector.io/v1`), `PORT` (default 3000).

**Working directory / commands:** All git commands run from the repo root (`C:\Users\aaron\Sites\chairsyde-task`) on branch `feat/nestjs-migration`. All npm/test commands run inside `nest/` (e.g. `cd nest && npm test`). Unit tests are `*.spec.ts` under `nest/src/`; e2e tests are `*.e2e-spec.ts` under `nest/test/`.

**Express 5 note:** Nest 11 ships Express 5. Inline route-parameter regex (e.g. `@Get(':id([a-zA-Z0-9]+)')`) is **not supported** — use the `AlphanumericParamPipe` defined in Task 3 for the alphanumeric constraint.

---

## File Structure

```
nest/
├── .env.example                              # NEW (Task 1)
├── src/
│   ├── main.ts                               # MODIFY (Task 1): prefix + ValidationPipe + PORT
│   ├── app.module.ts                         # MODIFY (Task 1): ConfigModule + CarsModule
│   ├── app.controller.ts                     # DELETE (Task 1)
│   ├── app.service.ts                        # DELETE (Task 1)
│   ├── app.controller.spec.ts                # DELETE (Task 1)
│   ├── config/
│   │   └── configuration.ts                  # NEW (Task 1)
│   └── cars/
│       ├── cars.module.ts                    # NEW (Task 1), MODIFY (Tasks 2,3)
│       ├── cars.controller.ts                # NEW (Task 1), MODIFY (Tasks 2,3)
│       ├── interfaces/
│       │   └── car-data.repository.ts        # NEW (Task 1): token + interface + query type
│       ├── repositories/
│       │   ├── api-car.repository.ts         # NEW (Task 1 shell), MODIFY (Tasks 2,3)
│       │   └── api-car.repository.spec.ts     # NEW (Tasks 2,3)
│       ├── dto/
│       │   ├── car-search-request.dto.ts     # NEW (Task 2)
│       │   ├── car-summary.dto.ts            # NEW (Task 2)
│       │   └── car-detail.dto.ts             # NEW (Task 3)
│       ├── pipes/
│       │   └── alphanumeric-param.pipe.ts    # NEW (Task 3)
│       └── services/
│           ├── car-search.service.ts         # NEW (Task 2)
│           ├── car-search.service.spec.ts    # NEW (Task 2)
│           ├── car-detail.service.ts         # NEW (Task 3)
│           └── car-detail.service.spec.ts    # NEW (Task 3)
└── test/
    ├── app.e2e-spec.ts                        # MODIFY (Task 1): bootstrap smoke test
    ├── cars-search.e2e-spec.ts               # NEW (Task 2)
    └── cars-detail.e2e-spec.ts               # NEW (Task 3)

vue/
├── .env.example                              # NEW (Task 4)
├── vite.config.ts                            # MODIFY (Task 4): configurable proxy target
├── src/views/CarsView.vue                    # MODIFY (Task 4): Nest 422 error handling
└── src/views/__tests__/CarsView.spec.ts      # MODIFY (Task 4): Nest 422 shape

laravel/
└── openapi.yaml                              # MODIFY (Task 4): Nest error schemas
```

---

## Task 1: Foundation & architecture wiring

Install dependencies and stand up the app skeleton: config, global prefix + validation pipe, the `CarsModule` with its repository interface/token/provider binding, and a stub repository so the app boots and DI resolves. No endpoints yet.

**Files:**
- Create: `nest/src/config/configuration.ts`
- Create: `nest/src/cars/interfaces/car-data.repository.ts`
- Create: `nest/src/cars/repositories/api-car.repository.ts`
- Create: `nest/src/cars/cars.controller.ts`
- Create: `nest/src/cars/cars.module.ts`
- Create: `nest/.env.example`
- Modify: `nest/src/app.module.ts`
- Modify: `nest/src/main.ts`
- Modify: `nest/test/app.e2e-spec.ts`
- Delete: `nest/src/app.controller.ts`, `nest/src/app.service.ts`, `nest/src/app.controller.spec.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `configuration` (default export) → `{ port: number, carvector: { apiKey: string, baseUrl: string } }`
  - `CAR_DATA_REPOSITORY` (Symbol token)
  - `interface CarSearchQuery { make: string; limit: number; offset: number; year?: number; model?: string }`
  - `interface CarDataRepository { getAll(query: CarSearchQuery): Promise<Record<string, unknown>[]>; findById(id: string): Promise<Record<string, unknown> | null> }`
  - `class ApiCarRepository implements CarDataRepository` (constructor: `HttpService`, `ConfigService`)
  - `class CarsController` (`@Controller('cars')`)
  - `class CarsModule`

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd nest && npm install @nestjs/config @nestjs/axios axios class-validator class-transformer
```
Expected: installs succeed; `package.json` gains the five packages under `dependencies`.

- [ ] **Step 2: Write the failing bootstrap e2e test**

Replace the entire contents of `nest/test/app.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots and serves under the /api prefix (unknown route → 404)', async () => {
    await request(app.getHttpServer()).get('/api/unknown').expect(404);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd nest && npm run test:e2e`
Expected: FAIL — `AppModule` still imports the default `AppController`/`AppService`, and/or compile errors because `CarsModule`/config do not exist yet.

- [ ] **Step 4: Create the config factory**

Create `nest/src/config/configuration.ts`:
```ts
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  carvector: {
    apiKey: process.env.CAR_VECTOR_API_KEY ?? '',
    baseUrl: process.env.CAR_VECTOR_BASE_URL ?? 'https://api.carvector.io/v1',
  },
});
```

- [ ] **Step 5: Create the repository interface, token and query type**

Create `nest/src/cars/interfaces/car-data.repository.ts`:
```ts
export const CAR_DATA_REPOSITORY = Symbol('CAR_DATA_REPOSITORY');

export interface CarSearchQuery {
  make: string;
  limit: number;
  offset: number;
  year?: number;
  model?: string;
}

export interface CarDataRepository {
  getAll(query: CarSearchQuery): Promise<Record<string, unknown>[]>;
  findById(id: string): Promise<Record<string, unknown> | null>;
}
```

- [ ] **Step 6: Create the stub repository**

Create `nest/src/cars/repositories/api-car.repository.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  CarDataRepository,
  CarSearchQuery,
} from '../interfaces/car-data.repository';

@Injectable()
export class ApiCarRepository implements CarDataRepository {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('carvector.baseUrl') ?? '';
    this.apiKey = config.get<string>('carvector.apiKey') ?? '';
  }

  getAll(_query: CarSearchQuery): Promise<Record<string, unknown>[]> {
    throw new Error('Not implemented');
  }

  findById(_id: string): Promise<Record<string, unknown> | null> {
    throw new Error('Not implemented');
  }
}
```

- [ ] **Step 7: Create the empty controller**

Create `nest/src/cars/cars.controller.ts`:
```ts
import { Controller } from '@nestjs/common';

@Controller('cars')
export class CarsController {}
```

- [ ] **Step 8: Create the CarsModule**

Create `nest/src/cars/cars.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CarsController } from './cars.controller';
import { ApiCarRepository } from './repositories/api-car.repository';
import { CAR_DATA_REPOSITORY } from './interfaces/car-data.repository';

@Module({
  imports: [HttpModule],
  controllers: [CarsController],
  providers: [{ provide: CAR_DATA_REPOSITORY, useClass: ApiCarRepository }],
})
export class CarsModule {}
```

- [ ] **Step 9: Rewrite AppModule**

Replace the entire contents of `nest/src/app.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { CarsModule } from './cars/cars.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CarsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 10: Delete the default Hello World files**

Run:
```bash
cd nest && rm src/app.controller.ts src/app.service.ts src/app.controller.spec.ts
```
Expected: three files removed. (They are no longer referenced by `AppModule`.)

- [ ] **Step 11: Rewrite main.ts**

Replace the entire contents of `nest/src/main.ts`:
```ts
import { NestFactory } from '@nestjs/core';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
}
bootstrap();
```

- [ ] **Step 12: Create .env.example**

Create `nest/.env.example`:
```
PORT=3000
CAR_VECTOR_API_KEY=your-api-key-here
CAR_VECTOR_BASE_URL=https://api.carvector.io/v1
```

- [ ] **Step 13: Run the bootstrap test to verify it passes**

Run: `cd nest && npm run test:e2e`
Expected: PASS — 1 test, app boots and `/api/unknown` returns 404.

- [ ] **Step 14: Verify the build compiles**

Run: `cd nest && npm run build`
Expected: exits 0, no TypeScript errors.

- [ ] **Step 15: Commit**

```bash
git add nest/ && git commit -m "feat(nest): scaffold cars module, config, and global validation"
```

---

## Task 2: Search endpoint `GET /api/cars`

Implement the search DTO (validation), the summary response DTO, the repository `getAll`, the search service, and the controller route. Returns a bare array of car summaries; 422 on invalid input.

**Files:**
- Create: `nest/src/cars/dto/car-search-request.dto.ts`
- Create: `nest/src/cars/dto/car-summary.dto.ts`
- Create: `nest/src/cars/services/car-search.service.ts`
- Create: `nest/src/cars/services/car-search.service.spec.ts`
- Create: `nest/src/cars/repositories/api-car.repository.spec.ts`
- Create: `nest/test/cars-search.e2e-spec.ts`
- Modify: `nest/src/cars/repositories/api-car.repository.ts` (implement `getAll`)
- Modify: `nest/src/cars/cars.controller.ts` (add search route)
- Modify: `nest/src/cars/cars.module.ts` (register `CarSearchService`)

**Interfaces:**
- Consumes: `CAR_DATA_REPOSITORY`, `CarDataRepository`, `CarSearchQuery`, `ApiCarRepository` (Task 1).
- Produces:
  - `class CarSearchRequestDto { make: string; limit: number; offset: number; year?: number; model?: string }` (structurally satisfies `CarSearchQuery`)
  - `class CarSummaryDto { id; make; model; year }` with `static fromUpstream(row: Record<string, unknown>): CarSummaryDto`
  - `class CarSearchService` with `handle(dto: CarSearchRequestDto): Promise<CarSummaryDto[]>`
  - `ApiCarRepository.getAll` implemented.

- [ ] **Step 1: Write the failing repository unit test**

Create `nest/src/cars/repositories/api-car.repository.spec.ts`:
```ts
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ApiCarRepository } from './api-car.repository';

function makeRepo(get: jest.Mock) {
  const http = { get } as unknown as HttpService;
  const config = {
    get: (key: string) =>
      key === 'carvector.baseUrl' ? 'https://api.carvector.io/v1' : 'test-key',
  } as unknown as ConfigService;
  return new ApiCarRepository(http, config);
}

describe('ApiCarRepository.getAll', () => {
  it('returns the upstream results array', async () => {
    const rows = [{ id: 'a', make: 'Toyota', model: 'Corolla', year: 2020 }];
    const get = jest.fn().mockReturnValue(of({ data: { results: rows } }));
    const repo = makeRepo(get);

    const result = await repo.getAll({ make: 'Toyota', limit: 20, offset: 0 });

    expect(result).toEqual(rows);
  });

  it('defaults to an empty array when results is missing', async () => {
    const get = jest.fn().mockReturnValue(of({ data: {} }));
    const repo = makeRepo(get);

    expect(await repo.getAll({ make: 'Toyota', limit: 20, offset: 0 })).toEqual([]);
  });

  it('sends the bearer token and query params to /vehicles', async () => {
    const get = jest.fn().mockReturnValue(of({ data: { results: [] } }));
    const repo = makeRepo(get);

    await repo.getAll({ make: 'Ford', limit: 20, offset: 20, year: 2019, model: 'Focus' });

    expect(get).toHaveBeenCalledWith(
      '/vehicles',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-key' },
        params: expect.objectContaining({
          make: 'Ford',
          limit: 20,
          offset: 20,
          year: 2019,
          model: 'Focus',
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd nest && npm test -- api-car.repository`
Expected: FAIL — `getAll` throws `Not implemented`.

- [ ] **Step 3: Implement `getAll`**

In `nest/src/cars/repositories/api-car.repository.ts`, add `firstValueFrom` to the rxjs import and replace the `getAll` method body:
```ts
import { firstValueFrom } from 'rxjs';
```
```ts
  async getAll(query: CarSearchQuery): Promise<Record<string, unknown>[]> {
    const response = await firstValueFrom(
      this.http.get('/vehicles', {
        baseURL: this.baseUrl,
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: {
          make: query.make,
          model: query.model,
          year: query.year,
          limit: query.limit,
          offset: query.offset,
        },
      }),
    ).catch(() => null);

    const results = (response?.data as { results?: unknown })?.results;
    return Array.isArray(results)
      ? (results as Record<string, unknown>[])
      : [];
  }
```

- [ ] **Step 4: Run the repository test to verify it passes**

Run: `cd nest && npm test -- api-car.repository`
Expected: PASS — 3 tests.

- [ ] **Step 5: Write the failing search-service unit test**

Create `nest/src/cars/services/car-search.service.spec.ts`:
```ts
import { CarSearchService } from './car-search.service';
import { CarSummaryDto } from '../dto/car-summary.dto';
import { CarDataRepository } from '../interfaces/car-data.repository';

describe('CarSearchService', () => {
  it('maps upstream rows to CarSummaryDto instances', async () => {
    const repo: CarDataRepository = {
      getAll: jest
        .fn()
        .mockResolvedValue([
          { id: 'a', make: 'Toyota', model: 'Corolla', year: 2020, extra: 'ignored' },
        ]),
      findById: jest.fn(),
    };
    const service = new CarSearchService(repo);

    const result = await service.handle({ make: 'Toyota', limit: 20, offset: 0 });

    expect(result).toEqual([
      { id: 'a', make: 'Toyota', model: 'Corolla', year: 2020 },
    ]);
    expect(result[0]).toBeInstanceOf(CarSummaryDto);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `cd nest && npm test -- car-search.service`
Expected: FAIL — `CarSummaryDto` and `CarSearchService` do not exist.

- [ ] **Step 7: Create the summary DTO**

Create `nest/src/cars/dto/car-summary.dto.ts`:
```ts
export class CarSummaryDto {
  id: string;
  make: string;
  model: string;
  year: number;

  static fromUpstream(row: Record<string, unknown>): CarSummaryDto {
    const dto = new CarSummaryDto();
    dto.id = row.id as string;
    dto.make = row.make as string;
    dto.model = row.model as string;
    dto.year = row.year as number;
    return dto;
  }
}
```

- [ ] **Step 8: Create the search request DTO**

Create `nest/src/cars/dto/car-search-request.dto.ts`:
```ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CarSearchRequestDto {
  @IsString()
  @MaxLength(255)
  make: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2023)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;
}
```

- [ ] **Step 9: Create the search service**

Create `nest/src/cars/services/car-search.service.ts`:
```ts
import { Inject, Injectable } from '@nestjs/common';
import {
  CAR_DATA_REPOSITORY,
  CarDataRepository,
} from '../interfaces/car-data.repository';
import { CarSearchRequestDto } from '../dto/car-search-request.dto';
import { CarSummaryDto } from '../dto/car-summary.dto';

@Injectable()
export class CarSearchService {
  constructor(
    @Inject(CAR_DATA_REPOSITORY)
    private readonly repository: CarDataRepository,
  ) {}

  async handle(dto: CarSearchRequestDto): Promise<CarSummaryDto[]> {
    const rows = await this.repository.getAll(dto);
    return rows.map((row) => CarSummaryDto.fromUpstream(row));
  }
}
```

- [ ] **Step 10: Run the search-service test to verify it passes**

Run: `cd nest && npm test -- car-search.service`
Expected: PASS — 1 test.

- [ ] **Step 11: Wire the controller route and register the service**

Replace the entire contents of `nest/src/cars/cars.controller.ts`:
```ts
import { Controller, Get, Query } from '@nestjs/common';
import { CarSearchRequestDto } from './dto/car-search-request.dto';
import { CarSearchService } from './services/car-search.service';

@Controller('cars')
export class CarsController {
  constructor(private readonly carSearchService: CarSearchService) {}

  @Get()
  search(@Query() query: CarSearchRequestDto): Promise<unknown> {
    return this.carSearchService.handle(query);
  }
}
```

In `nest/src/cars/cars.module.ts`, add the import and register `CarSearchService` in `providers`:
```ts
import { CarSearchService } from './services/car-search.service';
```
```ts
  providers: [
    { provide: CAR_DATA_REPOSITORY, useClass: ApiCarRepository },
    CarSearchService,
  ],
```

- [ ] **Step 12: Write the failing search e2e test**

Create `nest/test/cars-search.e2e-spec.ts`:
```ts
process.env.CAR_VECTOR_API_KEY = 'test-key';

import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as request from 'supertest';
import { of } from 'rxjs';
import { AppModule } from './../src/app.module';

describe('GET /api/cars (e2e)', () => {
  let app: INestApplication;
  const httpService = { get: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => httpService.get.mockReset());

  it('returns a bare array of car summaries', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          results: [{ id: 'asG52Fgs6gh', make: 'Toyota', model: 'Corolla', year: 2020 }],
        },
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/api/cars?make=Toyota&limit=20&offset=0')
      .expect(200);

    expect(res.body).toEqual([
      { id: 'asG52Fgs6gh', make: 'Toyota', model: 'Corolla', year: 2020 },
    ]);
  });

  it('forwards query params and the bearer token to CarVector', async () => {
    httpService.get.mockReturnValue(of({ data: { results: [] } }));

    await request(app.getHttpServer())
      .get('/api/cars?make=Ford&limit=20&offset=20&year=2019&model=Focus')
      .expect(200);

    expect(httpService.get).toHaveBeenCalledWith(
      '/vehicles',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-key' },
        params: expect.objectContaining({
          make: 'Ford',
          limit: 20,
          offset: 20,
          year: 2019,
          model: 'Focus',
        }),
      }),
    );
  });

  it('returns 422 when required params are missing', async () => {
    await request(app.getHttpServer()).get('/api/cars').expect(422);
  });

  it('returns 422 when an unknown param is supplied', async () => {
    await request(app.getHttpServer())
      .get('/api/cars?make=Toyota&limit=20&offset=0&bogus=1')
      .expect(422);
  });
});
```

- [ ] **Step 13: Run the search e2e test to verify it passes**

Run: `cd nest && npm run test:e2e -- cars-search`
Expected: PASS — 4 tests. (Query strings are coerced to numbers by `@Type` + `transform`.)

- [ ] **Step 14: Run the full unit + e2e suites**

Run: `cd nest && npm test && npm run test:e2e`
Expected: all PASS.

- [ ] **Step 15: Commit**

```bash
git add nest/ && git commit -m "feat(nest): implement GET /api/cars search endpoint"
```

---

## Task 3: Detail endpoint `GET /api/cars/:id`

Implement the detail response DTO, the repository `findById` (upstream 404 → null), the detail service (throws `NotFoundException`), an alphanumeric param pipe (Express-5-safe replacement for the route constraint), and the controller route.

**Files:**
- Create: `nest/src/cars/dto/car-detail.dto.ts`
- Create: `nest/src/cars/pipes/alphanumeric-param.pipe.ts`
- Create: `nest/src/cars/services/car-detail.service.ts`
- Create: `nest/src/cars/services/car-detail.service.spec.ts`
- Create: `nest/test/cars-detail.e2e-spec.ts`
- Modify: `nest/src/cars/repositories/api-car.repository.ts` (implement `findById`)
- Modify: `nest/src/cars/repositories/api-car.repository.spec.ts` (add `findById` tests)
- Modify: `nest/src/cars/cars.controller.ts` (add detail route)
- Modify: `nest/src/cars/cars.module.ts` (register `CarDetailService`)

**Interfaces:**
- Consumes: `CAR_DATA_REPOSITORY`, `CarDataRepository` (Task 1); `CarsController` (Task 2).
- Produces:
  - `class CarDetailDto { id; make; model; year; trim; horsepower; cylinders; displacement_l; fuel_type; transmission; body_class; image_url }` with `static fromUpstream(data: Record<string, unknown>): CarDetailDto`
  - `class AlphanumericParamPipe implements PipeTransform<string, string>` (throws `NotFoundException` on non-alphanumeric)
  - `class CarDetailService` with `handle(id: string): Promise<CarDetailDto>`
  - `ApiCarRepository.findById` implemented.

- [ ] **Step 1: Write the failing `findById` repository tests**

Append to `nest/src/cars/repositories/api-car.repository.spec.ts`:
```ts
import { throwError } from 'rxjs';

describe('ApiCarRepository.findById', () => {
  it('returns the upstream vehicle body', async () => {
    const car = { id: 'asG52Fgs6gh', make: 'Toyota', model: 'Corolla', year: 2020 };
    const get = jest.fn().mockReturnValue(of({ data: car }));
    const repo = makeRepo(get);

    const result = await repo.findById('asG52Fgs6gh');

    expect(result).toEqual(car);
    expect(get).toHaveBeenCalledWith(
      '/vehicles/asG52Fgs6gh',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-key' },
      }),
    );
  });

  it('returns null when CarVector responds 404', async () => {
    const get = jest
      .fn()
      .mockReturnValue(throwError(() => ({ response: { status: 404 } })));
    const repo = makeRepo(get);

    expect(await repo.findById('missing')).toBeNull();
  });
});
```
(`of` and `makeRepo` are already imported/defined at the top of this file from Task 2. Add `throwError` to the existing rxjs import instead of a duplicate import if your linter prefers.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd nest && npm test -- api-car.repository`
Expected: FAIL — `findById` throws `Not implemented`.

- [ ] **Step 3: Implement `findById`**

In `nest/src/cars/repositories/api-car.repository.ts`, replace the `findById` method body:
```ts
  async findById(id: string): Promise<Record<string, unknown> | null> {
    const response = await firstValueFrom(
      this.http.get(`/vehicles/${id}`, {
        baseURL: this.baseUrl,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    ).catch((error: { response?: { status?: number } }) => {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    });

    return response ? (response.data as Record<string, unknown>) : null;
  }
```

- [ ] **Step 4: Run the repository tests to verify they pass**

Run: `cd nest && npm test -- api-car.repository`
Expected: PASS — 5 tests (3 from Task 2 + 2 new).

- [ ] **Step 5: Write the failing detail-service unit test**

Create `nest/src/cars/services/car-detail.service.spec.ts`:
```ts
import { NotFoundException } from '@nestjs/common';
import { CarDetailService } from './car-detail.service';
import { CarDetailDto } from '../dto/car-detail.dto';
import { CarDataRepository } from '../interfaces/car-data.repository';

const upstream = {
  id: 'asG52Fgs6gh',
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  trim: 'LE',
  horsepower: '169',
  cylinders: '4',
  displacement_l: '2.0',
  fuel_type: 'Gasoline',
  transmission: 'Automatic',
  body_class: 'Sedan',
  image_url: 'https://example.com/car.png',
};

describe('CarDetailService', () => {
  it('returns a CarDetailDto when the repository finds the car', async () => {
    const repo: CarDataRepository = {
      getAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(upstream),
    };
    const service = new CarDetailService(repo);

    const result = await service.handle('asG52Fgs6gh');

    expect(result).toEqual(upstream);
    expect(result).toBeInstanceOf(CarDetailDto);
  });

  it('throws NotFoundException("Car not found") when the repository returns null', async () => {
    const repo: CarDataRepository = {
      getAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
    };
    const service = new CarDetailService(repo);

    await expect(service.handle('missing')).rejects.toThrow(NotFoundException);
    await expect(service.handle('missing')).rejects.toThrow('Car not found');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `cd nest && npm test -- car-detail.service`
Expected: FAIL — `CarDetailDto` and `CarDetailService` do not exist.

- [ ] **Step 7: Create the detail DTO**

Create `nest/src/cars/dto/car-detail.dto.ts`:
```ts
export class CarDetailDto {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  horsepower: string | null;
  cylinders: string | null;
  displacement_l: string | null;
  fuel_type: string | null;
  transmission: string | null;
  body_class: string | null;
  image_url: string | null;

  static fromUpstream(data: Record<string, unknown>): CarDetailDto {
    const dto = new CarDetailDto();
    dto.id = data.id as string;
    dto.make = data.make as string;
    dto.model = data.model as string;
    dto.year = data.year as number;
    dto.trim = (data.trim as string) ?? null;
    dto.horsepower = (data.horsepower as string) ?? null;
    dto.cylinders = (data.cylinders as string) ?? null;
    dto.displacement_l = (data.displacement_l as string) ?? null;
    dto.fuel_type = (data.fuel_type as string) ?? null;
    dto.transmission = (data.transmission as string) ?? null;
    dto.body_class = (data.body_class as string) ?? null;
    dto.image_url = (data.image_url as string) ?? null;
    return dto;
  }
}
```

- [ ] **Step 8: Create the detail service**

Create `nest/src/cars/services/car-detail.service.ts`:
```ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CAR_DATA_REPOSITORY,
  CarDataRepository,
} from '../interfaces/car-data.repository';
import { CarDetailDto } from '../dto/car-detail.dto';

@Injectable()
export class CarDetailService {
  constructor(
    @Inject(CAR_DATA_REPOSITORY)
    private readonly repository: CarDataRepository,
  ) {}

  async handle(id: string): Promise<CarDetailDto> {
    const data = await this.repository.findById(id);
    if (data === null) {
      throw new NotFoundException('Car not found');
    }
    return CarDetailDto.fromUpstream(data);
  }
}
```

- [ ] **Step 9: Run the detail-service test to verify it passes**

Run: `cd nest && npm test -- car-detail.service`
Expected: PASS — 2 tests.

- [ ] **Step 10: Create the alphanumeric param pipe**

Create `nest/src/cars/pipes/alphanumeric-param.pipe.ts`:
```ts
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class AlphanumericParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      throw new NotFoundException();
    }
    return value;
  }
}
```

- [ ] **Step 11: Wire the detail route and register the service**

In `nest/src/cars/cars.controller.ts`, update imports and add the detail route:
```ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarSearchRequestDto } from './dto/car-search-request.dto';
import { CarSearchService } from './services/car-search.service';
import { CarDetailService } from './services/car-detail.service';
import { AlphanumericParamPipe } from './pipes/alphanumeric-param.pipe';
```
```ts
@Controller('cars')
export class CarsController {
  constructor(
    private readonly carSearchService: CarSearchService,
    private readonly carDetailService: CarDetailService,
  ) {}

  @Get()
  search(@Query() query: CarSearchRequestDto): Promise<unknown> {
    return this.carSearchService.handle(query);
  }

  @Get(':id')
  detail(@Param('id', AlphanumericParamPipe) id: string): Promise<unknown> {
    return this.carDetailService.handle(id);
  }
}
```

In `nest/src/cars/cars.module.ts`, import and register `CarDetailService`:
```ts
import { CarDetailService } from './services/car-detail.service';
```
```ts
  providers: [
    { provide: CAR_DATA_REPOSITORY, useClass: ApiCarRepository },
    CarSearchService,
    CarDetailService,
  ],
```

- [ ] **Step 12: Write the failing detail e2e test**

Create `nest/test/cars-detail.e2e-spec.ts`:
```ts
process.env.CAR_VECTOR_API_KEY = 'test-key';

import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as request from 'supertest';
import { of, throwError } from 'rxjs';
import { AppModule } from './../src/app.module';

const car = {
  id: 'asG52Fgs6gh',
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  trim: 'LE',
  horsepower: '169',
  cylinders: '4',
  displacement_l: '2.0',
  fuel_type: 'Gasoline',
  transmission: 'Automatic',
  body_class: 'Sedan',
  image_url: 'https://example.com/car.png',
};

describe('GET /api/cars/:id (e2e)', () => {
  let app: INestApplication;
  const httpService = { get: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => httpService.get.mockReset());

  it('returns the car detail as a bare object', async () => {
    httpService.get.mockReturnValue(of({ data: car }));

    const res = await request(app.getHttpServer())
      .get('/api/cars/asG52Fgs6gh')
      .expect(200);

    expect(res.body).toEqual(car);
  });

  it('returns 404 with "Car not found" when CarVector 404s', async () => {
    httpService.get.mockReturnValue(
      throwError(() => ({ response: { status: 404 } })),
    );

    const res = await request(app.getHttpServer())
      .get('/api/cars/missing123')
      .expect(404);

    expect(res.body.message).toBe('Car not found');
  });

  it('returns 404 for a non-alphanumeric id (no upstream call)', async () => {
    await request(app.getHttpServer()).get('/api/cars/abc-123').expect(404);
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 13: Run the detail e2e test to verify it passes**

Run: `cd nest && npm run test:e2e -- cars-detail`
Expected: PASS — 3 tests.

- [ ] **Step 14: Run the full unit + e2e suites**

Run: `cd nest && npm test && npm run test:e2e`
Expected: all PASS.

- [ ] **Step 15: Verify the build compiles**

Run: `cd nest && npm run build`
Expected: exits 0.

- [ ] **Step 16: Commit**

```bash
git add nest/ && git commit -m "feat(nest): implement GET /api/cars/:id detail endpoint"
```

---

## Task 4: Consumer & contract updates (Vue + OpenAPI)

Update the Vue app to read Nest's 422 shape (`message: string[]`), make the Vite dev-proxy target configurable so the frontend can point at Laravel (8000) or Nest (3000), and update the OpenAPI error schemas to the Nest shapes. Success schemas stay untouched.

**Files:**
- Modify: `vue/src/views/CarsView.vue`
- Modify: `vue/src/views/__tests__/CarsView.spec.ts`
- Modify: `vue/vite.config.ts`
- Create: `vue/.env.example`
- Modify: `laravel/openapi.yaml`

**Interfaces:**
- Consumes: the Nest 422 body `{ statusCode, error, message: string[] }` and 404 body `{ statusCode, message, error }` (Tasks 2–3).
- Produces: no code interfaces (frontend + spec only).

- [ ] **Step 1: Update the failing 422 test to the Nest shape**

In `vue/src/views/__tests__/CarsView.spec.ts`, replace the `'surfaces 422 field errors from the search'` test with:
```ts
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
```

- [ ] **Step 2: Run the Vue view tests to verify the 422 test fails**

Run: `cd vue && npm run test:unit -- CarsView`
Expected: FAIL — the new test's message text is not rendered (old code reads `data.errors`, not `data.message`).

- [ ] **Step 3: Update CarsView.vue error handling**

In `vue/src/views/CarsView.vue` `<script setup>`:

Replace the `fieldErrors` ref and `hasFieldErrors` computed:
```ts
const fieldErrors = ref<Record<string, string[]>>({})
```
```ts
const validationMessages = ref<string[]>([])
```
```ts
const hasFieldErrors = computed(() => Object.keys(fieldErrors.value).length > 0)
```
```ts
const hasValidationErrors = computed(() => validationMessages.value.length > 0)
```

In `runSearch`, replace the reset line `fieldErrors.value = {}` with `validationMessages.value = []`, and replace the catch block:
```ts
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { message?: string | string[] } } }
    if (err.response?.status === 422 && err.response.data?.message) {
      const message = err.response.data.message
      validationMessages.value = Array.isArray(message) ? message : [message]
    } else {
      error.value = 'Something went wrong while searching. Please try again.'
    }
    cars.value = []
  } finally {
```

- [ ] **Step 4: Update CarsView.vue template**

In `vue/src/views/CarsView.vue` `<template>`:

Remove the `:errors="fieldErrors"` binding from the form (leave the other attributes):
```html
    <CarSearchForm :loading="loading" @search="onSearch" />
```

Add a validation-messages list directly after the `<p v-if="error">` line:
```html
    <ul v-if="hasValidationErrors" class="field-errors">
      <li v-for="(message, i) in validationMessages" :key="i" class="error">{{ message }}</li>
    </ul>
```

Update the empty-state guard from `hasFieldErrors` to `hasValidationErrors`:
```html
    <p v-else-if="!loading && !hasValidationErrors" class="status">
```

- [ ] **Step 5: Run the Vue view tests to verify they pass**

Run: `cd vue && npm run test:unit -- CarsView`
Expected: PASS — all CarsView tests (the 500 "Something went wrong" test still passes; the new 422 test now passes).

- [ ] **Step 6: Run the full Vue unit suite**

Run: `cd vue && npm run test:unit`
Expected: all PASS (CarSearchForm, CarTable, CarDetailModal, cars api, App unaffected).

- [ ] **Step 7: Make the Vite proxy target configurable**

Replace the entire contents of `vue/vite.config.ts`:
```ts
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
```

- [ ] **Step 8: Document the proxy toggle**

Create `vue/.env.example`:
```
# Backend the dev server proxies /api to.
# Laravel: http://127.0.0.1:8000  (default)
# NestJS:  http://127.0.0.1:3000
VITE_API_TARGET=http://127.0.0.1:8000
```

- [ ] **Step 9: Update the OpenAPI error schemas**

In `laravel/openapi.yaml`, replace the `ValidationErrorBody` schema with the Nest shape:
```yaml
    ValidationErrorBody:
      type: object
      additionalProperties: false
      required:
        - statusCode
        - message
        - error
      properties:
        statusCode:
          type: integer
          example: 422
        message:
          type: array
          items:
            type: string
          description: List of validation failure messages.
        error:
          type: string
          example: Unprocessable Entity
```
Replace the `ErrorBody` schema with the Nest shape:
```yaml
    ErrorBody:
      type: object
      additionalProperties: false
      required:
        - statusCode
        - message
        - error
      properties:
        statusCode:
          type: integer
          example: 404
        message:
          type: string
          example: Car not found
        error:
          type: string
          example: Not Found
```
Leave the `NotFound` and `ValidationError` response objects as-is (they still `$ref` these schemas; the `NotFound` `example: { message: Car not found }` remains valid since `message` is still present).

- [ ] **Step 10: Validate the OpenAPI spec is still well-formed**

Run: `cd nest && npx --yes @redocly/cli lint ../laravel/openapi.yaml`
Expected: parses without structural errors. (Warnings about style are acceptable; there must be no YAML/schema-parse errors.) If `@redocly/cli` cannot be fetched offline, instead confirm the file is valid YAML: `node -e "require('js-yaml')" 2>/dev/null && echo has-js-yaml || echo skip` — if unavailable, visually confirm indentation matches the surrounding schemas.

- [ ] **Step 11: Commit**

```bash
git add vue/ laravel/openapi.yaml && git commit -m "feat: adopt Nest error shapes in Vue client and OpenAPI spec"
```

---

## Manual verification (after all tasks)

Not automated — run once to confirm the drop-in works end to end:

- [ ] Copy `nest/.env.example` to `nest/.env`, set a real `CAR_VECTOR_API_KEY`, run `cd nest && npm run start:dev`. Confirm it listens on `http://127.0.0.1:3000`.
- [ ] Copy `vue/.env.example` to `vue/.env`, set `VITE_API_TARGET=http://127.0.0.1:3000`, run `cd vue && npm run dev`.
- [ ] In the browser: search by make → results table renders; click a row → detail modal populates; submit an empty/invalid search → validation messages list appears.
- [ ] Flip `VITE_API_TARGET` back to `http://127.0.0.1:8000` and confirm the app still works against Laravel (proving the toggle).

---

## Self-Review Notes

- **Spec coverage:** Foundation/config/pipe/prefix (Task 1) ✓; search endpoint + validation + bare array (Task 2) ✓; detail endpoint + 404 + alphanumeric constraint (Task 3) ✓; repository interface-binding, HTTP client, `results` key, upstream-404→null, 5xx-swallow on search (Tasks 1–3) ✓; Nest 422 shape + Vue update + OpenAPI update + configurable port/proxy (Task 4) ✓; happy-path + 404/422 tests ✓.
- **Deliberate simplification:** on the **detail** endpoint a non-404 upstream error rethrows (→ 500) rather than returning the body as Laravel's `findById` does. This is outside the happy-path + 404 test scope and keeps the client simple; note it if full parity is later required.
- **Type consistency:** `CarDataRepository.getAll(query: CarSearchQuery)` / `findById(id: string)` used identically across repository, services, and tests; `CarSummaryDto.fromUpstream` / `CarDetailDto.fromUpstream` and `*.handle(...)` signatures match their call sites.
