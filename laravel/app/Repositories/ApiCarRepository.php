<?php

namespace App\Repositories;

use App\Contracts\CarDataRepositoryInterface;
use Illuminate\Support\Collection;

class ApiCarRepository implements CarDataRepositoryInterface
{

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $apiKey,
    )
    {
    }

    public function getAll(): Collection
    {
        // TODO: Implement getAll() method.
    }

    public function findById(int $id): ?array
    {
        // TODO: Implement findById() method.
    }
}
