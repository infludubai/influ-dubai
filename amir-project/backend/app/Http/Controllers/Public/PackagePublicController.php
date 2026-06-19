<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Addon;
use App\Models\Package;
use Illuminate\Http\JsonResponse;

class PackagePublicController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = Package::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->with('addons:id,name,description,price,billing_type')
            ->get();

        return response()->json(['data' => $packages]);
    }

    public function show(string $slug): JsonResponse
    {
        $package = Package::where('slug', $slug)
            ->where('is_active', true)
            ->with('addons')
            ->firstOrFail();

        return response()->json(['data' => $package]);
    }

    public function addons(): JsonResponse
    {
        $addons = Addon::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $addons]);
    }
}
