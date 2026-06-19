<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Addon;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Package::with('addons')->orderBy('sort_order')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'short_description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'delivery_days' => 'required|integer|min:1',
            'revisions' => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'features.*' => 'string|max:255',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $data['slug'] = Str::slug($data['name']);
        $package = Package::create($data);

        return response()->json(['data' => $package], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => Package::with('addons')->findOrFail($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $package = Package::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'short_description' => 'nullable|string|max:500',
            'price' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'delivery_days' => 'sometimes|integer|min:1',
            'revisions' => 'sometimes|integer|min:-1',
            'features' => 'nullable|array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $package->update($data);
        return response()->json(['data' => $package]);
    }

    public function destroy(int $id): JsonResponse
    {
        $package = Package::findOrFail($id);
        if ($package->orders()->exists()) {
            return response()->json(['message' => 'Cannot delete package with existing orders.'], 422);
        }
        $package->delete();
        return response()->json(['message' => 'Package deleted.']);
    }

    public function addons(): JsonResponse
    {
        return response()->json(['data' => Addon::orderBy('sort_order')->get()]);
    }

    public function storeAddon(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'delivery_days_extra' => 'integer|min:0',
            'billing_type' => 'in:one_time,monthly',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        return response()->json(['data' => Addon::create($data)], 201);
    }

    public function updateAddon(Request $request, int $id): JsonResponse
    {
        $addon = Addon::findOrFail($id);
        $addon->update($request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'delivery_days_extra' => 'integer|min:0',
            'billing_type' => 'in:one_time,monthly',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]));
        return response()->json(['data' => $addon]);
    }

    public function destroyAddon(int $id): JsonResponse
    {
        Addon::findOrFail($id)->delete();
        return response()->json(['message' => 'Add-on deleted.']);
    }
}
