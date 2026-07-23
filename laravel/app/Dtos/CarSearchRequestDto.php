<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;
use Illuminate\Contracts\Support\Arrayable;

readonly class CarSearchRequestDto implements Arrayable, DtoInterface
{
    public function __construct(
        public ?int $year,
        public string $make,
        public ?string $model,
        public int $limit,
        public int $offset
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            year: $data['year'] ?? null,
            make: $data['make'],
            model: $data['model'] ?? null,
            limit: $data['limit'],
            offset: $data['offset'],
        );
    }

    public function toArray(): array
    {
        return [
            'year' => $this->year,
            'make' => $this->make,
            'model' => $this->model,
            'limit' => $this->limit,
            'offset' => $this->offset,
        ];
    }
}
