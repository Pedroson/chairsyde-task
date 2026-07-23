<?php

use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.carvector.api_key', 'test-key');
    Http::preventStrayRequests();
});

test('it returns a list of cars from the CarVector API', function () {
    Http::fake([
        '*' => Http::response([
            'results' => [
                ['id' => 'asG52Fgs6gh', 'make' => 'Toyota', 'model' => 'Corolla', 'year' => 2020],
                ['id' => 'asG52Fgs6gd', 'make' => 'Toyota', 'model' => 'Camry', 'year' => 2021],
            ],
        ]),
    ]);

    $this->getJson('/api/cars?make=Toyota&year=2020&model=Corolla&limit=10&offset=0')
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonPath('0.id', 'asG52Fgs6gh')
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

test('it accepts a valid request that omits the optional year and model', function () {
    Http::fake(['*' => Http::response([])]);

    $this->getJson('/api/cars?make=Toyota&limit=10&offset=0')
        ->assertOk();
});

// ApiCarRepository no longer calls ->throw(), so a non-2xx from CarVector is
// not surfaced: the (empty) body is collected and the endpoint returns 200
// with an empty list rather than erroring. Documents current behavior.
test('a CarVector server error is not surfaced and returns an empty list', function () {
    Http::fake(['*' => Http::response([], 500)]);

    $this->getJson('/api/cars?make=Toyota&limit=10&offset=0')
        ->assertOk()
        ->assertExactJson([]);
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
