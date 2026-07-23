<?php

use App\Dtos\CarDetailDto;

test('fromArray maps all detail fields', function () {
    $data = [
        'id' => 1,
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'trim' => 'LE',
        'horsepower' => '169',
        'cylinders' => '4',
        'displacement' => '2.0',
        'fuel_type' => 'Gasoline',
        'transmission' => 'Automatic',
        'body_class' => 'Sedan',
        'image_url' => 'https://example.com/car.png',
    ];

    $dto = CarDetailDto::fromArray($data);

    expect($dto->id)->toBe(1)
        ->and($dto->make)->toBe('Toyota')
        ->and($dto->model)->toBe('Corolla')
        ->and($dto->year)->toBe(2020)
        ->and($dto->trim)->toBe('LE')
        ->and($dto->horsepower)->toBe('169')
        ->and($dto->cylinders)->toBe('4')
        ->and($dto->displacement)->toBe('2.0')
        ->and($dto->fuel_type)->toBe('Gasoline')
        ->and($dto->transmission)->toBe('Automatic')
        ->and($dto->body_class)->toBe('Sedan')
        ->and($dto->image_url)->toBe('https://example.com/car.png');
});
