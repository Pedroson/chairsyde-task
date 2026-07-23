<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;

readonly class CarSearchRequestDto implements DtoInterface
{
    public function __construct(
        public int $year,
        public string $make,
        public string $model,
        public int $limit,
        public int $offset
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            year: $data['year'],
            make: $data['make'],
            model: $data['model'],
            limit: $data['limit'],
            offset: $data['offset'],
        );
    }
}
