<?php
namespace App\Contracts;

use Illuminate\Support\Collection;

interface CarDataRepositoryInterface
{
    /**
     * @return Collection<int, array>
     */
    public function getAll(): Collection;
    public function findById(int $id): ?array;
}
