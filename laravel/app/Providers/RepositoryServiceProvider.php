<?php


namespace App\Providers;

use App\Contracts\CarDataRepositoryInterface;
use App\Repositories\ApiCarRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CarDataRepositoryInterface::class, function ($app) {
            return new ApiCarRepository(
                config('services.carvector.base_url'),
                config('services.carvector.api_key')
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
