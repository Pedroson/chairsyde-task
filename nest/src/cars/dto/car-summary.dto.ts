export class CarSummaryDto {
  id: string;
  make: string;
  model: string;
  year: number;

  static fromUpstream(row: Record<string, unknown>): CarSummaryDto {
    const dto = new CarSummaryDto();
    dto.id = row.id as string;
    dto.make = row.make as string;
    dto.model = row.model as string;
    dto.year = row.year as number;
    return dto;
  }
}
