<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;

class CarDetailsRequestDto implements DtoInterface
{
    public function __construct(
        public int $id
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id']
        );
    }
}
