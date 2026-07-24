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
