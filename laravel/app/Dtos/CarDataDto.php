<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;

readonly class CarDataDto implements DtoInterface
{
    public function __construct(
        public string $id,
        public string $make,
        public string $model,
        public int $year,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            make: $data['make'],
            model: $data['model'],
            year: $data['year'],
        );
    }
}
