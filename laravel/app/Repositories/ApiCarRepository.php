<?php

namespace App\Repositories;

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use Illuminate\Support\Collection;

class ApiCarRepository implements CarDataRepositoryInterface
{

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $apiKey,
    )
    {
    }

    public function getAll(CarSearchRequestDto $dto): Collection
    {
        // TODO: Implement getAll() method.
    }

    public function findById(CarDetailsRequestDto $dto): ?array
    {
        // TODO: Implement findById() method.
    }
}
