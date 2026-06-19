<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function submit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        try {
            $adminEmail = Setting::get('admin_email', config('app.admin_email', env('ADMIN_EMAIL')));
            Mail::to($adminEmail)->send(new \App\Mail\ContactAdminMail($data));
            Mail::to($data['email'])->send(new \App\Mail\ContactConfirmMail($data));
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Message sent successfully! We\'ll get back to you shortly.']);
    }

    public function page(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_active', true)->first();
        if (!$page) {
            return response()->json(['data' => null]);
        }

        $published = $page->publishedLayout()->first();

        return response()->json([
            'data' => [
                'page' => $page,
                'layout' => $published?->layout,
                'published_json' => $published?->layout,
            ],
        ]);
    }

    public function settings(): JsonResponse
    {
        $publicKeys = [
            'builder_header',
            'builder_footer',
            'google_adsense_client',
            'google_site_verification',
            'google_site_verification_script',
            'google_tag_manager_id',
            'custom_head_scripts',
            'custom_body_scripts',
            'google_client_id',
            'github_client_id',
        ];

        $settings = Setting::whereIn('group', ['general', 'social', 'seo'])
            ->orWhereIn('key', $publicKeys)
            // Include all page-specific settings (hero content, profile photo, etc.)
            ->orWhere('key', 'like', 'page_%')
            ->get(['key', 'value', 'type'])
            ->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }
}
