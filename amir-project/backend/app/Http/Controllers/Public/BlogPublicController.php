<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogPublicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BlogPost::where('status', 'published')
            ->whereNotNull('published_at')
            ->with('category:id,name,slug', 'author:id,name,avatar')
            ->orderByDesc('published_at');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('tag')) {
            $query->whereJsonContains('tags', $request->tag);
        }

        $posts = $query->paginate(12, [
            'id', 'category_id', 'author_id', 'title', 'slug',
            'excerpt', 'featured_image', 'tags', 'published_at', 'views',
        ]);

        return response()->json($posts);
    }

    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::where('slug', $slug)
            ->where('status', 'published')
            ->with('category:id,name,slug', 'author:id,name,avatar')
            ->firstOrFail();

        $post->increment('views');

        return response()->json(['data' => $post]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => BlogCategory::withCount(['posts' => fn ($q) => $q->where('status', 'published')])->get(),
        ]);
    }
}
