import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class AlphanumericParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      throw new NotFoundException();
    }
    return value;
  }
}
