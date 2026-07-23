<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.carvector.api_key', 'test-key');
    Http::preventStrayRequests();
});

test('it returns the car detail from the CarVector API', function () {
    Http::fake([
        '*' => Http::response([
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
        ]),
    ]);

    $this->getJson('/api/cars/1')
        ->assertOk()
        ->assertJsonPath('id', 1)
        ->assertJsonPath('make', 'Toyota')
        ->assertJsonPath('image_url', 'https://example.com/car.png');
});

// Finding #2: a CarVector 404 yields an empty array from findById(), so the
// handler's null -> NotFoundHttpException branch is never hit; CarDetailDto::
// fromArray([]) then fails on the missing 'id' key and surfaces as a 500.
// This test documents the CURRENT behavior, not the desired 404.
test('a CarVector 404 currently surfaces as a 500, not a 404', function () {
    Http::fake(['*' => Http::response([], 404)]);

    $this->getJson('/api/cars/999')->assertStatus(500);
});
