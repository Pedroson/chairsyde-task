<?php

namespace App\Handlers;

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDataDto;
use App\Dtos\CarSearchRequestDto;
use Illuminate\Support\Collection;

class CarSearchHandler
{
    public function __construct(protected CarDataRepositoryInterface $carDataRepository)
    {
    }

    /**
     * @return Collection<int, CarDataDto>
     */
    public function handle(CarSearchRequestDto $dto): Collection
    {
        $data = $this->carDataRepository->getAll($dto);

        return $data->map(fn($item) => CarDataDto::fromArray($item));
    }
}
