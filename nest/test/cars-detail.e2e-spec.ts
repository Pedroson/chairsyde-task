process.env.CAR_VECTOR_API_KEY = 'test-key';

import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import request from 'supertest';
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
