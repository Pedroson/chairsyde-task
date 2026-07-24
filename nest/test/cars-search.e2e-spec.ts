process.env.CAR_VECTOR_API_KEY = 'test-key';

import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import request from 'supertest';
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
          results: [
            { id: 'asG52Fgs6gh', make: 'Toyota', model: 'Corolla', year: 2020 },
          ],
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
