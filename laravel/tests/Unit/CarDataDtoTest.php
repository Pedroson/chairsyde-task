<?php

use App\Dtos\CarDataDto;

test('fromArray maps all summary fields', function () {
    $dto = CarDataDto::fromArray([
        'id' => 'asG52Fgs6gh',
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
    ]);

    expect($dto->id)->toBe('asG52Fgs6gh')
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->year)->toBe(2020);
});
