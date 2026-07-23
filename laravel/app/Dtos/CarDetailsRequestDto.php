<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;

readonly class CarDetailsRequestDto implements DtoInterface
{
    public function __construct(
        public string $id
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id']
        );
    }
}
