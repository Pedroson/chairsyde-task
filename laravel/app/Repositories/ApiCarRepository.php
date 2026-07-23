<?php

namespace App\Repositories;

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class ApiCarRepository implements CarDataRepositoryInterface
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $apiKey,
    ) {}

    public function getAll(CarSearchRequestDto $dto): Collection
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->apiKey)
            ->withQueryParameters($dto->toArray())
            ->get('/vehicles')
            ->collect();
    }

    public function findById(CarDetailsRequestDto $dto): ?array
    {
        $response = Http::baseUrl($this->baseUrl)
            ->withToken($this->apiKey)
            ->get(sprintf('/vehicles/%s', $dto->id));

        if ($response->notFound()) {
            return null;
        }

        return $response->collect()->toArray();
    }
}
