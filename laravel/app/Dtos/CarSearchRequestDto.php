<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;

readonly class CarSearchRequestDto implements DtoInterface
{
    public function __construct(
        public int $year,
        public string $make,
        public string $model,
        public int $limit = 50,
        public int $offset = 0
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            year: $data['year'],
            make: $data['make'],
            model: $data['model'],
            limit: $data['limit'] ?? 50,
            offset: $data['offset'] ?? 0,
        );
    }
}
