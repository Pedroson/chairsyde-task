<?php

use App\Dtos\CarDetailsRequestDto;

test('fromArray maps the id', function () {
    expect(CarDetailsRequestDto::fromArray(['id' => 'asG52Fgs6gh'])->id)->toBe('asG52Fgs6gh');
});
