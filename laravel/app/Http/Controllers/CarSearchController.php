<?php

namespace App\Http\Controllers;

use App\Dtos\CarSearchRequestDto;
use App\Handlers\CarSearchHandler;
use App\Http\Requests\CarSearchRequest;

class CarSearchController extends Controller
{
    public function __invoke(CarSearchRequest $request, CarSearchHandler $handler)
    {
        $dto = CarSearchRequestDto::fromArray($request->validated());

        $response = $handler->handle($dto);

        return response()->json($response);
    }
}
