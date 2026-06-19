<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuilderController extends Controller
{
    private function builderPageResource(?BuilderPage $builderPage): ?array
    {
        if (!$builderPage) {
            return null;
        }

        return [
            'id' => $builderPage->id,
            'page_id' => $builderPage->page_id,
            'version' => $builderPage->version,
            'status' => $builderPage->status,
            'layout' => $builderPage->layout,
            'json' => $builderPage->layout,
            'created_by' => $builderPage->created_by,
            'published_at' => $builderPage->published_at,
            'created_at' => $builderPage->created_at,
            'updated_at' => $builderPage->updated_at,
        ];
    }

    private function pageBuilderResource(Page $page): array
    {
        $draft = $page->draftLayout()->first();
        $published = $page->publishedLayout()->first();

        return [
            'id' => $page->id,
            'slug' => $page->slug,
            'title' => $page->title,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'is_active' => $page->is_active,
            'draft_layout' => $draft,
            'published_layout' => $published,
            'draft_json' => $draft?->layout,
            'published_json' => $published?->layout,
            'latest_draft_version' => $draft?->version,
            'latest_published_version' => $published?->version,
            'versions_count' => BuilderPage::where('page_id', $page->id)->count(),
            'created_at' => $page->created_at,
            'updated_at' => $page->updated_at,
        ];
    }

    private function pageForSlug(string $slug): Page
    {
        return Page::firstOrCreate(
            ['slug' => $slug],
            [
                'title' => str($slug)->replace('-', ' ')->title()->toString(),
                'meta_title' => str($slug)->replace('-', ' ')->title()->toString().' - Amir Nazir',
                'is_active' => true,
            ]
        );
    }

    public function load(string $slug): JsonResponse
    {
        $page = $this->pageForSlug($slug);

        $draft = BuilderPage::where('page_id', $page->id)
            ->where('status', 'draft')
            ->latest('version')
            ->first();

        $published = BuilderPage::where('page_id', $page->id)
            ->where('status', 'published')
            ->latest('version')
            ->first();

        return response()->json([
            'data' => [
                'page' => $page,
                'draft' => $draft,
                'published' => $published,
                'draft_json' => $draft?->layout,
                'published_json' => $published?->layout,
                'versions_count' => BuilderPage::where('page_id', $page->id)->count(),
                'seo_settings' => [
                    'title' => $page->title,
                    'meta_title' => $page->meta_title,
                    'meta_description' => $page->meta_description,
                    'is_active' => $page->is_active,
                ],
            ],
        ]);
    }

    public function save(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'layout' => 'nullable|array',
            'draft_json' => 'nullable|array',
        ]);

        $layout = $request->input('layout', $request->input('draft_json'));
        if (!is_array($layout)) {
            return response()->json(['message' => 'A layout or draft_json array is required.'], 422);
        }

        $page = $this->pageForSlug($slug);

        $existing = BuilderPage::where('page_id', $page->id)
            ->where('status', 'draft')
            ->latest('version')
            ->first();

        if ($existing) {
            $existing->update([
                'layout' => $layout,
                'updated_at' => now(),
            ]);
            $draft = $existing;
        } else {
            $lastVersion = BuilderPage::where('page_id', $page->id)->max('version') ?? 0;
            $draft = BuilderPage::create([
                'page_id' => $page->id,
                'version' => $lastVersion + 1,
                'status' => 'draft',
                'layout' => $layout,
                'created_by' => $request->user()->id,
            ]);
        }

        return response()->json([
            'data' => $this->builderPageResource($draft),
            'draft_json' => $draft->layout,
            'message' => 'Draft saved.',
        ]);
    }

    public function publish(Request $request, string $slug): JsonResponse
    {
        $page = $this->pageForSlug($slug);

        $draft = BuilderPage::where('page_id', $page->id)
            ->where('status', 'draft')
            ->latest('version')
            ->first();

        if (!$draft) {
            return response()->json(['message' => 'No draft to publish.'], 422);
        }

        $lastVersion = BuilderPage::where('page_id', $page->id)
            ->where('status', 'published')
            ->max('version') ?? 0;

        BuilderPage::create([
            'page_id' => $page->id,
            'version' => $lastVersion + 1,
            'status' => 'published',
            'layout' => $draft->layout,
            'created_by' => $request->user()->id,
            'published_at' => now(),
        ]);

        $draft->delete();

        return response()->json([
            'published_json' => $draft->layout,
            'message' => 'Page published successfully.',
        ]);
    }

    public function history(string $slug): JsonResponse
    {
        $page = $this->pageForSlug($slug);

        $versions = BuilderPage::where('page_id', $page->id)
            ->where('status', 'published')
            ->with('creator:id,name')
            ->orderByDesc('version')
            ->get(['id', 'version', 'status', 'layout', 'created_by', 'published_at', 'created_at']);

        return response()->json(['data' => $versions]);
    }

    public function restore(Request $request, string $slug, int $versionId): JsonResponse
    {
        $page = $this->pageForSlug($slug);
        $version = BuilderPage::where('id', $versionId)->where('page_id', $page->id)->firstOrFail();

        BuilderPage::where('page_id', $page->id)->where('status', 'draft')->delete();

        $lastVersion = BuilderPage::where('page_id', $page->id)->max('version') ?? 0;

        $restored = BuilderPage::create([
            'page_id' => $page->id,
            'version' => $lastVersion + 1,
            'status' => 'draft',
            'layout' => $version->layout,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'data' => $this->builderPageResource($restored),
            'draft_json' => $restored->layout,
            'message' => "Restored to version {$version->version} as new draft.",
        ]);
    }

    public function designTokens(): JsonResponse
    {
        $tokens = \App\Models\Setting::get('design_tokens', json_encode([
            'colors' => [
                'primary' => '#0c90e7',
                'secondary' => '#6366f1',
                'background' => '#ffffff',
                'foreground' => '#0f172a',
                'accent' => '#f59e0b',
            ],
            'fonts' => [
                'heading' => 'Plus Jakarta Sans',
                'body' => 'Inter',
            ],
            'radius' => '0.75rem',
            'shadow' => '0 4px 24px rgba(0,0,0,0.08)',
            'spacing' => 'comfortable',
        ]));

        return response()->json(['data' => json_decode($tokens, true)]);
    }

    public function updateDesignTokens(Request $request): JsonResponse
    {
        $request->validate(['tokens' => 'required|array']);
        \App\Models\Setting::set('design_tokens', json_encode($request->tokens));
        return response()->json(['message' => 'Design tokens updated.']);
    }

    public function blockPalette(): JsonResponse
    {
        $blocks = [
            ['type' => 'text', 'label' => 'Text Block', 'icon' => 'Type', 'category' => 'Content'],
            ['type' => 'heading', 'label' => 'Heading', 'icon' => 'Heading', 'category' => 'Content'],
            ['type' => 'image', 'label' => 'Image', 'icon' => 'Image', 'category' => 'Media'],
            ['type' => 'video', 'label' => 'Video', 'icon' => 'Video', 'category' => 'Media'],
            ['type' => 'button', 'label' => 'Button', 'icon' => 'MousePointerClick', 'category' => 'Interactive'],
            ['type' => 'service-card', 'label' => 'Service Card', 'icon' => 'Layers', 'category' => 'Cards'],
            ['type' => 'pricing-card', 'label' => 'Pricing Card', 'icon' => 'DollarSign', 'category' => 'Cards'],
            ['type' => 'portfolio-card', 'label' => 'Portfolio Card', 'icon' => 'Grid', 'category' => 'Cards'],
            ['type' => 'testimonial', 'label' => 'Testimonial', 'icon' => 'Quote', 'category' => 'Cards'],
            ['type' => 'faq', 'label' => 'FAQ Accordion', 'icon' => 'HelpCircle', 'category' => 'Content'],
            ['type' => 'cta', 'label' => 'CTA Banner', 'icon' => 'Megaphone', 'category' => 'Marketing'],
            ['type' => 'contact', 'label' => 'Contact Form', 'icon' => 'Mail', 'category' => 'Interactive'],
            ['type' => 'html', 'label' => 'Custom HTML', 'icon' => 'Code', 'category' => 'Advanced', 'admin_only' => true],
            ['type' => 'stats', 'label' => 'Stats Counter', 'icon' => 'TrendingUp', 'category' => 'Marketing'],
            ['type' => 'divider', 'label' => 'Divider', 'icon' => 'Minus', 'category' => 'Layout'],
            ['type' => 'spacer', 'label' => 'Spacer', 'icon' => 'ArrowUpDown', 'category' => 'Layout'],
        ];

        return response()->json(['data' => $blocks]);
    }

    public function pages(): JsonResponse
    {
        $pages = Page::with(['publishedLayout', 'draftLayout'])->get()
            ->map(fn (Page $page) => $this->pageBuilderResource($page))
            ->values();
        return response()->json(['data' => $pages]);
    }

    public function destroy(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->first();
        if ($page) {
            BuilderPage::where('page_id', $page->id)->delete();
            $page->delete();
        }
        return response()->json(['message' => 'Page deleted.']);
    }

    public function updatePageMeta(Request $request, string $slug): JsonResponse
    {
        $page = $this->pageForSlug($slug);
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);
        $page->update($data);
        return response()->json(['data' => $page, 'message' => 'Page meta updated.']);
    }
}
