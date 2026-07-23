<?php


namespace App\Providers;

use App\Repositories\ApiCarRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ApiCarRepository::class, function ($app) {
            // Toggle data sources using an .env variable
            if (config('services.user_data.source') === 'api') {
                return new ApiCarRepository(
                    config('services.carvector.base_url'),
                    config('services.carvector.api_key')
                );
            }
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
