<?php

namespace App\Handlers;

use App\Contracts\CarDataRepositoryInterface;
use App\Dtos\CarDetailDto;
use App\Dtos\CarDetailsRequestDto;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CarDetailHandler
{
    public function __construct(protected CarDataRepositoryInterface $carDataRepository)
    {
    }


    public function handle(CarDetailsRequestDto $dto): CarDetailDto
    {
        $data = $this->carDataRepository->findById($dto);

        if($data === null)
            throw new NotFoundHttpException(
                'Car not found'
            );

        return CarDetailDto::fromArray($data);
    }
}
