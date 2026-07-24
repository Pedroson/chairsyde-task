export const CAR_DATA_REPOSITORY = Symbol('CAR_DATA_REPOSITORY');

export interface CarSearchQuery {
  make: string;
  limit: number;
  offset: number;
  year?: number;
  model?: string;
}

export interface CarDataRepository {
  getAll(query: CarSearchQuery): Promise<Record<string, unknown>[]>;
  findById(id: string): Promise<Record<string, unknown> | null>;
}
