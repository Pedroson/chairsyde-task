import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CAR_DATA_REPOSITORY } from '../interfaces/car-data.repository';
import type { CarDataRepository } from '../interfaces/car-data.repository';
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
