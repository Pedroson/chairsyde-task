<?php

use App\Dtos\CarDataDto;

test('fromArray maps all summary fields', function () {
    $dto = CarDataDto::fromArray([
        'id' => 1,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
    ]);

    expect($dto->id)->toBe(1)
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->year)->toBe(2020);
});
