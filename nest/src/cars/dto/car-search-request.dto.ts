import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CarSearchRequestDto {
  @IsString()
  @MaxLength(255)
  make: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2023)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;
}
