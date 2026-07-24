import { of, throwError } from 'rxjs';
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

    expect(await repo.getAll({ make: 'Toyota', limit: 20, offset: 0 })).toEqual(
      [],
    );
  });

  it('returns an empty array when the upstream request fails', async () => {
    const get = jest.fn().mockReturnValue(throwError(() => new Error('upstream down')));
    const repo = makeRepo(get);

    expect(await repo.getAll({ make: 'Toyota', limit: 20, offset: 0 })).toEqual([]);
  });

  it('sends the bearer token and query params to /vehicles', async () => {
    const get = jest.fn().mockReturnValue(of({ data: { results: [] } }));
    const repo = makeRepo(get);

    await repo.getAll({
      make: 'Ford',
      limit: 20,
      offset: 20,
      year: 2019,
      model: 'Focus',
    });

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
