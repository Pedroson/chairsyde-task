<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.carvector.api_key', 'test-key');
    Http::preventStrayRequests();
});

test('it returns a list of cars from the CarVector API', function () {
    Http::fake([
        '*' => Http::response([
            ['id' => 1, 'make' => 'Toyota', 'model' => 'Corolla', 'year' => 2020],
            ['id' => 2, 'make' => 'Toyota', 'model' => 'Camry', 'year' => 2021],
        ]),
    ]);

    $this->getJson('/api/cars?make=Toyota&year=2020&model=Corolla&limit=10&offset=0')
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonPath('0.id', 1)
        ->assertJsonPath('0.make', 'Toyota')
        ->assertJsonPath('0.model', 'Corolla')
        ->assertJsonPath('0.year', 2020);
});

test('it forwards the query params and bearer token to CarVector', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars?make=Toyota&year=2020&model=Corolla&limit=10&offset=0');

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'api.carvector.io/v1/vehicles')
            && $request->hasHeader('Authorization', 'Bearer test-key')
            && str_contains($request->url(), 'make=Toyota')
            && str_contains($request->url(), 'limit=10')
            && str_contains($request->url(), 'offset=0');
    });
});

test('it returns 422 when required fields are missing', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['make', 'limit', 'offset']);
});

test('it returns 422 when year and limit are out of range', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars?make=Toyota&year=1800&model=Corolla&limit=0&offset=0')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['year', 'limit']);
});
