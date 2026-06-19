<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Setting;

class OAuthController extends Controller
{
    /**
     * Get Google OAuth authorization URL
     */
    public function googleAuthUrl(): JsonResponse
    {
        $clientId = Setting::get('google_client_id');

        if (!$clientId) {
            return response()->json(['message' => 'Google OAuth not configured. Add Google Client ID in Admin > Integrations.'], 400);
        }

        $redirectUri = $this->frontendUrl() . '/auth/google/callback';

        $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id'     => $clientId,
            'redirect_uri'  => $redirectUri,
            'response_type' => 'code',
            'scope'         => 'openid profile email',
            'access_type'   => 'online',
            'state'         => Str::random(32),
        ]);

        return response()->json(['url' => $url]);
    }

    /**
     * Handle Google OAuth callback — exchange code for user + token
     */
    public function googleCallback(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $clientId     = Setting::get('google_client_id');
        $clientSecret = Setting::get('google_client_secret');
        $redirectUri  = $this->frontendUrl() . '/auth/google/callback';

        Log::info('[OAuth] Callback started', [
            'has_client_id'     => !empty($clientId),
            'has_client_secret' => !empty($clientSecret),
            'redirect_uri'      => $redirectUri,
        ]);

        if (!$clientId || !$clientSecret) {
            return response()->json(['message' => 'Google OAuth not configured.'], 400);
        }

        // ── Step 1: Exchange code for access token ───────────────────────────
        try {
            $tokenRes = Http::timeout(15)->asForm()->post('https://oauth2.googleapis.com/token', [
                'code'          => $request->code,
                'client_id'     => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri'  => $redirectUri,
                'grant_type'    => 'authorization_code',
            ]);
        } catch (\Throwable $e) {
            Log::error('[OAuth] Token request failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not reach Google: ' . $e->getMessage()], 500);
        }

        Log::info('[OAuth] Token response', ['status' => $tokenRes->status(), 'body' => $tokenRes->json()]);

        if (!$tokenRes->successful()) {
            return response()->json([
                'message'  => 'Google token exchange failed.',
                'google'   => $tokenRes->json(),
                'hint'     => 'Check that your redirect_uri in Google Cloud Console matches: ' . $redirectUri,
            ], 400);
        }

        $accessToken = $tokenRes->json('access_token');
        if (!$accessToken) {
            return response()->json(['message' => 'No access token returned by Google.', 'body' => $tokenRes->json()], 400);
        }

        // ── Step 2: Fetch user profile ───────────────────────────────────────
        try {
            $userRes = Http::timeout(10)
                ->withToken($accessToken)
                ->get('https://www.googleapis.com/oauth2/v2/userinfo');
        } catch (\Throwable $e) {
            Log::error('[OAuth] Userinfo request failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not fetch Google profile: ' . $e->getMessage()], 500);
        }

        if (!$userRes->successful()) {
            return response()->json(['message' => 'Google profile fetch failed.', 'status' => $userRes->status()], 400);
        }

        $gUser    = $userRes->json();
        $googleId = $gUser['id']      ?? null;
        $email    = $gUser['email']   ?? null;
        $name     = $gUser['name']    ?? 'Google User';
        $picture  = $gUser['picture'] ?? null;

        Log::info('[OAuth] Google user', ['email' => $email, 'id' => $googleId]);

        if (!$googleId || !$email) {
            return response()->json(['message' => 'Google did not return email/id.', 'data' => $gUser], 400);
        }

        // ── Step 3: Find or create local user ────────────────────────────────
        try {
            $user = User::where('google_id', $googleId)->first();

            if (!$user) {
                $user = User::where('email', $email)->first();

                if (!$user) {
                    $user = User::create([
                        'name'              => $name,
                        'email'             => $email,
                        'google_id'         => $googleId,
                        'avatar'            => $picture,
                        'username'          => Str::slug($name, '_') . '_' . rand(100, 999),
                        'password'          => Hash::make(Str::random(32)),
                        'role'              => 'client',
                        'is_active'         => true,
                        'email_verified_at' => now(),
                    ]);
                    Log::info('[OAuth] New user created', ['id' => $user->id]);
                } else {
                    $user->update([
                        'google_id'         => $googleId,
                        'email_verified_at' => $user->email_verified_at ?? now(),
                        'avatar'            => $user->avatar ?: $picture,
                    ]);
                    Log::info('[OAuth] Existing user linked', ['id' => $user->id]);
                }
            } else {
                if ($picture && $user->avatar !== $picture) {
                    $user->update(['avatar' => $picture]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('[OAuth] User create/update failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Account error: ' . $e->getMessage()], 500);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // ── Step 4: Issue Sanctum token ──────────────────────────────────────
        $token = $user->createToken('google-oauth')->plainTextToken;

        Log::info('[OAuth] Login successful', ['user_id' => $user->id]);

        return response()->json(['user' => $user, 'token' => $token]);
    }

    /**
     * Get frontend URL — always https://amirnazir.site in production.
     * The redirect_uri sent to Google MUST exactly match what is registered
     * in Google Cloud Console: https://amirnazir.site/auth/google/callback
     */
    private function frontendUrl(): string
    {
        $env  = rtrim(config('app.frontend_url', ''), '/');
        // If the env var is set and looks like a real URL, use it
        if ($env && str_starts_with($env, 'https://')) return $env;
        // Always fall back to the production frontend
        return 'https://amirnazir.site';
    }
}
