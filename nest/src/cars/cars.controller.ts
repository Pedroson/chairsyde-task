import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarSearchRequestDto } from './dto/car-search-request.dto';
import { CarSearchService } from './services/car-search.service';
import { CarDetailService } from './services/car-detail.service';
import { AlphanumericParamPipe } from './pipes/alphanumeric-param.pipe';

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
