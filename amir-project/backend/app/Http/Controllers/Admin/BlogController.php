<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = BlogPost::with('category:id,name', 'author:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'slug'             => 'nullable|string|max:255',
            'category_id'      => 'nullable|exists:blog_categories,id',
            'excerpt'          => 'nullable|string|max:500',
            'body'             => 'required|string',
            'tags'             => 'nullable|array',
            'featured_image'   => 'nullable|string|max:2048',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'status'           => 'in:draft,published',
            'published_at'     => 'nullable|date',
        ]);

        $data['slug']      = Str::slug($data['slug'] ?? $data['title']);
        $data['author_id'] = $request->user()->id;

        if (($data['status'] ?? 'draft') === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        // Accept file upload OR URL string for featured_image
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = PublicFileStorage::store($request->file('featured_image'), 'blog');
        }

        return response()->json(['data' => BlogPost::create($data)], 201);
    }

    /** Upload an inline image for use inside post body */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(['image' => 'required|image|max:5120']);
        $path = PublicFileStorage::store($request->file('image'), 'blog');
        return response()->json([
            'url' => '/storage/' . $path,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => BlogPost::with('category', 'author:id,name')->findOrFail($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $post = BlogPost::findOrFail($id);
        $data = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'slug'             => 'nullable|string|max:255',
            'category_id'      => 'nullable|exists:blog_categories,id',
            'excerpt'          => 'nullable|string|max:500',
            'body'             => 'sometimes|string',
            'tags'             => 'nullable|array',
            'featured_image'   => 'nullable|string|max:2048',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'status'           => 'in:draft,published,archived',
            'published_at'     => 'nullable|date',
        ]);

        if (isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        if (isset($data['status']) && $data['status'] === 'published' && !$post->published_at) {
            $data['published_at'] = now();
        }

        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = PublicFileStorage::store($request->file('featured_image'), 'blog');
        }

        // Also validate and accept URL string for featured_image
        $post->update($data);
        return response()->json(['data' => $post]);
    }

    public function destroy(int $id): JsonResponse
    {
        BlogPost::findOrFail($id)->delete();
        return response()->json(['message' => 'Post deleted.']);
    }

    public function categories(): JsonResponse
    {
        return response()->json(['data' => BlogCategory::withCount('posts')->get()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $data['slug'] = Str::slug($data['name']);
        return response()->json(['data' => BlogCategory::create($data)], 201);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        BlogCategory::findOrFail($id)->delete();
        return response()->json(['message' => 'Category deleted.']);
    }
}
