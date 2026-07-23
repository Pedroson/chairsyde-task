<?php
namespace App\Contracts;

use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use Illuminate\Support\Collection;

interface CarDataRepositoryInterface
{
    /**
     * @return Collection<int, array>
     */
    public function getAll(CarSearchRequestDto $dto): Collection;
    public function findById(CarDetailsRequestDto $dto): ?array;
}
