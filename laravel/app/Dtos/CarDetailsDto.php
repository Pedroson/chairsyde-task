<?php

namespace App\Dtos;

use App\Contracts\DtoInterface;

readonly class CarDetailsDto implements DtoInterface
{
    public function __construct(
        public int $id,
        public string $make,
        public string $model,
        public int $year,
        public string $trim,
        public string $horsepower,
        public string $cylinders,
        public string $displacement,
        public string $fuel_type,
        public string $transmission,
        public string $body_class,
        public string $image_url
    ) {}

    public static function fromArray(array $data): self
    {
        return new self (
            id: $data['id'],
            make: $data['make'],
            model: $data['model'],
            year: $data['year'],
            trim: $data['trim'],
            horsepower: $data['horsepower'],
            cylinders: $data['cylinders'],
            displacement: $data['displacement'],
            fuel_type: $data['fuel_type'],
            transmission: $data['transmission'],
            body_class: $data['body_class'],
            image_url: $data['image_url'],
        );
    }
}
