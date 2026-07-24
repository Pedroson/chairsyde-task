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
