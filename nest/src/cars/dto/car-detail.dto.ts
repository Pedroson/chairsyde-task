export class CarDetailDto {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  horsepower: string | null;
  cylinders: string | null;
  displacement_l: string | null;
  fuel_type: string | null;
  transmission: string | null;
  body_class: string | null;
  image_url: string | null;

  static fromUpstream(data: Record<string, unknown>): CarDetailDto {
    const dto = new CarDetailDto();
    dto.id = data.id as string;
    dto.make = data.make as string;
    dto.model = data.model as string;
    dto.year = data.year as number;
    dto.trim = (data.trim as string) ?? null;
    dto.horsepower = (data.horsepower as string) ?? null;
    dto.cylinders = (data.cylinders as string) ?? null;
    dto.displacement_l = (data.displacement_l as string) ?? null;
    dto.fuel_type = (data.fuel_type as string) ?? null;
    dto.transmission = (data.transmission as string) ?? null;
    dto.body_class = (data.body_class as string) ?? null;
    dto.image_url = (data.image_url as string) ?? null;
    return dto;
  }
}
