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
