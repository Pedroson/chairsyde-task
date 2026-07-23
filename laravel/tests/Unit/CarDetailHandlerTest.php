<?php

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDetailDto;
use App\Dtos\CarDetailsRequestDto;
use App\Dtos\CarSearchRequestDto;
use App\Handlers\CarDetailHandler;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

function fakeCarDetailRepository(?array $row): CarDataRepositoryInterface
{
    return new class($row) implements CarDataRepositoryInterface
    {
        public function __construct(private ?array $row) {}

        public function getAll(CarSearchRequestDto $dto): Collection
        {
            return collect();
        }

        public function findById(CarDetailsRequestDto $dto): ?array
        {
            return $this->row;
        }
    };
}

test('handle returns a CarDetailDto when the repository finds the car', function () {
    $row = [
        'id' => 'asG52Fgs6gh',
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'trim' => 'LE',
        'horsepower' => '169',
        'cylinders' => '4',
        'displacement_l' => '2.0',
        'fuel_type' => 'Gasoline',
        'transmission' => 'Automatic',
        'body_class' => 'Sedan',
        'image_url' => 'https://example.com/car.png',
    ];

    $result = (new CarDetailHandler(fakeCarDetailRepository($row)))
        ->handle(new CarDetailsRequestDto(id: 'asG52Fgs6gh'));

    expect($result)->toBeInstanceOf(CarDetailDto::class)
        ->and($result->id)->toBe('asG52Fgs6gh')
        ->and($result->image_url)->toBe('https://example.com/car.png');
});

test('handle throws NotFoundHttpException when the repository returns null', function () {
    (new CarDetailHandler(fakeCarDetailRepository(null)))
        ->handle(new CarDetailsRequestDto(id: 'asG52Fgs6gd'));
})->throws(NotFoundHttpException::class, 'Car not found');
