<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioPublicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PortfolioItem::where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('completed_at');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $items = $query->get([
            'id', 'title', 'slug', 'category', 'short_description',
            'thumbnail', 'tech_stack', 'is_featured', 'completed_at', 'live_url',
        ]);

        $categories = PortfolioItem::where('is_active', true)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category');

        return response()->json(['data' => $items, 'categories' => $categories]);
    }

    public function show(string $slug): JsonResponse
    {
        $item = PortfolioItem::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $item->increment('id');

        return response()->json(['data' => $item]);
    }
}
