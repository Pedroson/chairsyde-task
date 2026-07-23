<?php

use App\Dtos\CarSearchRequestDto;

test('fromArray builds the dto from validated data', function () {
    $dto = CarSearchRequestDto::fromArray([
        'year' => 2020,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'limit' => 10,
        'offset' => 0,
    ]);

    expect($dto->year)->toBe(2020)
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->limit)->toBe(10)
        ->and($dto->offset)->toBe(0);
});

test('toArray round-trips every field', function () {
    $data = [
        'year' => 2020,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'limit' => 10,
        'offset' => 5,
    ];

    expect(CarSearchRequestDto::fromArray($data)->toArray())->toBe($data);
});
