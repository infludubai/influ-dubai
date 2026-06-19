<?php

use Illuminate\Support\Facades\Route;
use App\Models\Setting;

Route::get('/ads.txt', function () {
    return response(Setting::get('google_adsense_ads_txt', ''), 200)
        ->header('Content-Type', 'text/plain; charset=UTF-8');
});

Route::get('/', function () {
    return view('welcome');
});
