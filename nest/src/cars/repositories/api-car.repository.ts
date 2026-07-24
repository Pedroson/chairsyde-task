import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
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

  async getAll(query: CarSearchQuery): Promise<Record<string, unknown>[]> {
    const response = await firstValueFrom(
      this.http.get('/vehicles', {
        baseURL: this.baseUrl,
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: {
          make: query.make,
          model: query.model,
          year: query.year,
          limit: query.limit,
          offset: query.offset,
        },
      }),
    ).catch(() => null);

    const results = (response?.data as { results?: unknown })?.results;
    return Array.isArray(results) ? (results as Record<string, unknown>[]) : [];
  }

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const response = await firstValueFrom(
      this.http.get(`/vehicles/${id}`, {
        baseURL: this.baseUrl,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }),
    ).catch((error: { response?: { status?: number } }) => {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    });

    return response ? (response.data as Record<string, unknown>) : null;
  }
}
