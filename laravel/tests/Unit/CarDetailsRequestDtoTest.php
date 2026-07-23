<?php

use App\Dtos\CarDetailsRequestDto;

test('fromArray maps the id', function () {
    expect(CarDetailsRequestDto::fromArray(['id' => 42])->id)->toBe(42);
});
