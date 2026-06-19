<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Models\Setting;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get();
        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate(['settings' => 'required|array']);

        foreach ($request->settings as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Settings updated.']);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'image' => 'nullable|required_without:file|image|max:4096',
            'file' => 'nullable|required_without:image|image|max:4096',
        ]);

        $image = $request->file('image') ?: $request->file('file');
        $path = PublicFileStorage::store($image, 'settings');

        // Store as a relative path so it works regardless of which domain serves it.
        // Frontend assetUrl() prepends VITE_API_URL when it sees a /storage/ path.
        $url = '/storage/' . $path;

        Setting::set($request->key, $url);

        return response()->json(['message' => 'Image uploaded.', 'url' => $url]);
    }

    public function testEmail(Request $request): JsonResponse
    {
        $to = $request->input('to', Setting::get('admin_email', config('mail.from.address')));

        try {
            Mail::raw('This is a test email from your Amir Nazir platform. SMTP is configured correctly!', function ($message) use ($to) {
                $message->to($to)->subject('Test Email — SMTP Working ✓');
            });
            return response()->json(['message' => "Test email sent to {$to}."]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed: ' . $e->getMessage()], 422);
        }
    }

    public function clearCache(): JsonResponse
    {
        $cleared = [];
        $errors  = [];

        // 1. Delete bootstrap cache files directly (fixes "Target class [view] does not exist")
        $bootstrapFiles = [
            base_path('bootstrap/cache/config.php'),
            base_path('bootstrap/cache/packages.php'),
            base_path('bootstrap/cache/services.php'),
            base_path('bootstrap/cache/routes-v7.php'),
            base_path('bootstrap/cache/routes.php'),
            base_path('bootstrap/cache/events.php'),
        ];
        foreach ($bootstrapFiles as $file) {
            if (file_exists($file)) {
                @unlink($file);
                $cleared[] = basename($file);
            }
        }

        // 2. Delete compiled view files
        $viewCachePath = storage_path('framework/views');
        if (is_dir($viewCachePath)) {
            foreach (glob($viewCachePath . '/*.php') ?: [] as $view) {
                @unlink($view);
            }
            $cleared[] = 'compiled views';
        }

        // 3. Flush application cache
        try {
            Cache::flush();
            $cleared[] = 'application cache';
        } catch (\Throwable $e) {
            $errors[] = 'app cache: ' . $e->getMessage();
        }

        // 4. Ensure storage symlink exists so uploaded files are publicly accessible
        try {
            if (!file_exists(public_path('storage'))) {
                \Artisan::call('storage:link');
                $cleared[] = 'storage:link (created)';
            } else {
                $cleared[] = 'storage:link (already exists)';
            }
        } catch (\Throwable $e) {
            $errors[] = 'storage:link: ' . $e->getMessage();
        }

        // 5. Run artisan clears (best-effort — may fail if framework broken)
        $commands = ['config:clear', 'cache:clear', 'route:clear', 'view:clear', 'event:clear'];
        foreach ($commands as $cmd) {
            try {
                \Artisan::call($cmd);
                $cleared[] = $cmd;
            } catch (\Throwable $e) {
                $errors[] = $cmd . ': ' . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Cache cleared. Please reload the page and try again.',
            'cleared' => $cleared,
            'errors'  => $errors,
        ]);
    }

    public function emailTemplates(): JsonResponse
    {
        return response()->json(['data' => EmailTemplate::orderBy('key')->get()]);
    }

    public function getEmailTemplate(string $key): JsonResponse
    {
        return response()->json(['data' => EmailTemplate::where('key', $key)->firstOrFail()]);
    }

    public function updateEmailTemplate(Request $request, string $key): JsonResponse
    {
        $template = EmailTemplate::where('key', $key)->firstOrFail();
        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'is_active' => 'boolean',
        ]);
        $template->update($data);
        return response()->json(['data' => $template, 'message' => 'Template updated.']);
    }
}
