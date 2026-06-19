<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => PortfolioItem::orderBy('sort_order')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'tech_stack' => 'nullable|array',
            'results' => 'nullable|array',
            'live_url' => 'nullable|url',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'completed_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
        ]);

        $data['slug'] = Str::slug($data['title']);

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = PublicFileStorage::store($request->file('thumbnail'), 'portfolio');
        }

        if ($request->hasFile('images')) {
            $data['images'] = collect($request->file('images'))
                ->map(fn ($f) => PublicFileStorage::store($f, 'portfolio'))
                ->toArray();
        }

        return response()->json(['data' => PortfolioItem::create($data)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = PortfolioItem::findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'tech_stack' => 'nullable|array',
            'results' => 'nullable|array',
            'live_url' => 'nullable|url',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'completed_at' => 'nullable|date',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
        ]);

        if (isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = PublicFileStorage::store($request->file('thumbnail'), 'portfolio');
        }

        $item->update($data);
        return response()->json(['data' => $item]);
    }

    public function destroy(int $id): JsonResponse
    {
        PortfolioItem::findOrFail($id)->delete();
        return response()->json(['message' => 'Portfolio item deleted.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate(['items' => 'required|array', 'items.*.id' => 'required|integer', 'items.*.sort_order' => 'required|integer']);

        foreach ($request->items as $item) {
            PortfolioItem::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Order updated.']);
    }
}
