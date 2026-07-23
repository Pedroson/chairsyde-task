<?php

namespace App\Http\Controllers;

use App\Dtos\CarDetailsRequestDto;
use App\Handlers\CarDetailHandler;
use App\Http\Requests\CarDetailRequest;

class CarDetailController extends Controller
{
    public function __invoke(CarDetailRequest $request, CarDetailHandler $handler)
    {
        $dto = CarDetailsRequestDto::fromArray($request->validated());

        $response = $handler->handle($dto);

        return response()->json($response);
    }
}
