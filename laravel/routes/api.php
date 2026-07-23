<?php


use App\Http\Controllers\CarDetailController;
use App\Http\Controllers\CarSearchController;

Route::group(['prefix' => 'cars'], function () {
    Route::get('/', CarSearchController::class);
    Route::get('/{id}', CarDetailController::class);
});
