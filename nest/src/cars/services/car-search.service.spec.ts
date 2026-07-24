import { CarSearchService } from './car-search.service';
import { CarSummaryDto } from '../dto/car-summary.dto';
import { CarDataRepository } from '../interfaces/car-data.repository';

describe('CarSearchService', () => {
  it('maps upstream rows to CarSummaryDto instances', async () => {
    const repo: CarDataRepository = {
      getAll: jest.fn().mockResolvedValue([
        {
          id: 'a',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          extra: 'ignored',
        },
      ]),
      findById: jest.fn(),
    };
    const service = new CarSearchService(repo);

    const result = await service.handle({
      make: 'Toyota',
      limit: 20,
      offset: 0,
    });

    expect(result).toEqual([
      { id: 'a', make: 'Toyota', model: 'Corolla', year: 2020 },
    ]);
    expect(result[0]).toBeInstanceOf(CarSummaryDto);
  });
});
