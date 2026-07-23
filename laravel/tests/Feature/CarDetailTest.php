<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.carvector.api_key', 'test-key');
    Http::preventStrayRequests();
});

test('it returns the car detail from the CarVector API', function () {
    Http::fake([
        '*' => Http::response([
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
        ]),
    ]);

    $this->getJson('/api/cars/asG52Fgs6gh')
        ->assertOk()
        ->assertJsonPath('id', 'asG52Fgs6gh')
        ->assertJsonPath('make', 'Toyota')
        ->assertJsonPath('image_url', 'https://example.com/car.png');
});

test('it returns 404 when CarVector reports the car is not found', function () {
    Http::fake(['*' => Http::response([], 404)]);

    $this->getJson('/api/cars/999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Car not found');
});

test('it returns 404 for a non-alphanumeric id (route constraint)', function () {
    $this->getJson('/api/cars/abc-123')->assertNotFound();
});
