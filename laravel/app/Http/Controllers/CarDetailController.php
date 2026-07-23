<?php

namespace App\Http\Controllers;

use App\Dtos\CarDetailsRequestDto;
use App\Handlers\CarDetailHandler;

class CarDetailController extends Controller
{
    public function __invoke(string $id, CarDetailHandler $handler)
    {
        $dto = CarDetailsRequestDto::fromArray(['id' => $id]);

        $response = $handler->handle($dto);

        return response()->json($response);
    }
}
