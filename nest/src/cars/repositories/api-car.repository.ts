import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  CarDataRepository,
  CarSearchQuery,
} from '../interfaces/car-data.repository';

@Injectable()
export class ApiCarRepository implements CarDataRepository {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('carvector.baseUrl') ?? '';
    this.apiKey = config.get<string>('carvector.apiKey') ?? '';
  }

  getAll(_query: CarSearchQuery): Promise<Record<string, unknown>[]> {
    throw new Error('Not implemented');
  }

  findById(_id: string): Promise<Record<string, unknown> | null> {
    throw new Error('Not implemented');
  }
}
