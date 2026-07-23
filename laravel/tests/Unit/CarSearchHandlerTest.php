<?php

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDataDto;
use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use App\Handlers\CarSearchHandler;
use Illuminate\Support\Collection;

test('handle maps repository rows to a CarDataDto collection', function () {
    $repository = new class implements CarDataRepositoryInterface
    {
        public ?CarSearchRequestDto $received = null;

        public function getAll(CarSearchRequestDto $dto): Collection
        {
            $this->received = $dto;

            return collect([
                ['id' => 1, 'make' => 'Toyota', 'model' => 'Corolla', 'year' => 2020],
                ['id' => 2, 'make' => 'Toyota', 'model' => 'Camry', 'year' => 2021],
            ]);
        }

        public function findById(CarDetailsRequestDto $dto): ?array
        {
            return null;
        }
    };

    $dto = new CarSearchRequestDto(year: 2020, make: 'Toyota', model: 'Corolla', limit: 10, offset: 0);

    $result = (new CarSearchHandler($repository))->handle($dto);

    expect($result)->toHaveCount(2)
        ->and($result->first())->toBeInstanceOf(CarDataDto::class)
        ->and($result->first()->model)->toBe('Corolla')
        ->and($repository->received)->toBe($dto);
});
