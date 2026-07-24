import { Inject, Injectable } from '@nestjs/common';
import { CAR_DATA_REPOSITORY } from '../interfaces/car-data.repository';
import type { CarDataRepository } from '../interfaces/car-data.repository';
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
