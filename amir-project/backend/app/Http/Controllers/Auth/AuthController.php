<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\DeviceService;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Setting;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private OtpService $otpService,
        private DeviceService $deviceService,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'nullable|string|max:50|alpha_dash|unique:users,username',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:30|regex:/^[\d\s\+\-\(\)]+$/',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'username' => $data['username'] ?? Str::slug($data['name'], '_') . '_' . rand(100, 999),
            'email'    => $data['email'],
            'phone'    => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role'     => 'client',
        ]);

        $code = $this->otpService->generateCode($user, 'email_verify');
        $this->sendOtpEmail($user, $code, 'email_verify');

        return response()->json([
            'message' => 'Account created. Please verify your email with the OTP sent.',
            'user_id' => $user->id,
            'email'   => $user->email,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login'    => 'required|string',   // accepts email or username
            'password' => 'required|string',
        ]);

        $login = trim($request->login);

        // Resolve user by email or username
        $user = filter_var($login, FILTER_VALIDATE_EMAIL)
            ? User::where('email', $login)->first()
            : User::where('username', $login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => 'Invalid credentials. Check your email/username and password.',
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'login' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        // ── Admin: bypass OTP and device check entirely ───────────────────────
        if ($user->isAdmin()) {
            $user->update(['last_seen_at' => now()]);
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user'  => $this->userResponse($user),
            ]);
        }

        // ── Client: require email verification ───────────────────────────────
        if (!$user->email_verified_at) {
            $code = $this->otpService->generateCode($user, 'email_verify');
            $this->sendOtpEmail($user, $code, 'email_verify');

            return response()->json([
                'requires_verification' => true,
                'message' => 'Please verify your email first. A new OTP has been sent.',
                'user_id' => $user->id,
            ], 403);
        }

        // ── Client: new device check ──────────────────────────────────────────
        if (!$this->deviceService->isTrusted($user, $request)) {
            $this->deviceService->registerUnknown($user, $request);
            $code = $this->otpService->generateCode($user, 'new_device');
            $this->sendOtpEmail($user, $code, 'new_device');

            return response()->json([
                'requires_device_verification' => true,
                'message' => 'New device detected. Please verify with the OTP sent to your email.',
                'user_id' => $user->id,
            ]);
        }

        $user->update(['last_seen_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userResponse($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userResponse($request->user())]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp'     => 'required|string|size:6',
        ]);

        $user = User::findOrFail($data['user_id']);
        $this->otpService->verify($user, 'email_verify', $data['otp']);

        $user->update(['email_verified_at' => now()]);
        $this->deviceService->trust($user, $request);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully.',
            'token'   => $token,
            'user'    => $this->userResponse($user),
        ]);
    }

    public function verifyDevice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp'     => 'required|string|size:6',
        ]);

        $user = User::findOrFail($data['user_id']);
        $this->otpService->verify($user, 'new_device', $data['otp']);

        $this->deviceService->trust($user, $request);
        $user->update(['last_seen_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Device verified.',
            'token'   => $token,
            'user'    => $this->userResponse($user),
        ]);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type'    => 'required|in:email_verify,new_device,password_reset',
        ]);

        $user = User::findOrFail($data['user_id']);

        if (!$this->otpService->canResend($user, $data['type'])) {
            $cooldown = $this->otpService->getResendCooldown($user, $data['type']);
            return response()->json([
                'message'  => "Please wait {$cooldown} seconds before requesting a new OTP.",
                'cooldown' => $cooldown,
            ], 429);
        }

        $code = $this->otpService->generateCode($user, $data['type']);
        $this->sendOtpEmail($user, $code, $data['type']);

        return response()->json(['message' => 'OTP sent successfully.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if ($user) {
            $code = $this->otpService->generateCode($user, 'password_reset');
            $this->sendOtpEmail($user, $code, 'password_reset');
        }

        return response()->json([
            'message' => 'If this email exists, a password reset OTP has been sent.',
            'user_id' => $user?->id,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'  => 'required|exists:users,id',
            'otp'      => 'required|string|size:6',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::findOrFail($data['user_id']);
        $this->otpService->verify($user, 'password_reset', $data['otp']);

        $user->update(['password' => Hash::make($data['password'])]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully. Please log in.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'username'      => "sometimes|string|max:50|alpha_dash|unique:users,username,{$user->id}",
            'phone'         => 'nullable|string|max:30',
            'avatar'        => 'nullable|string',
            'company_name'  => 'nullable|string|max:255',
            'address'       => 'nullable|string|max:1000',
            'industry'      => 'nullable|string|max:255',
            'account_type'  => 'nullable|in:business,individual',
            'goals'         => 'nullable|string|max:1000',
        ]);

        $user->update(collect($data)->only(['name', 'username', 'phone', 'avatar'])->toArray());

        $settingsMap = ['company_name', 'address', 'industry', 'account_type', 'goals'];
        foreach ($settingsMap as $key) {
            if (array_key_exists($key, $data)) {
                Setting::set("user_profile_{$user->id}_{$key}", $data[$key] ?? '');
            }
        }

        return response()->json(['user' => $this->userResponse($user)]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Current password is incorrect.',
            ]);
        }

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    private function sendOtpEmail(User $user, string $code, string $type): void
    {
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(
                new \App\Mail\OtpMail($user, $code, $type)
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('OTP email failed', [
                'to'    => $user->email,
                'type'  => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function userResponse(User $user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'username'          => $user->username,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'role'              => $user->role,
            'avatar'            => $user->avatar,
            'company_name'      => Setting::get("user_profile_{$user->id}_company_name"),
            'address'           => Setting::get("user_profile_{$user->id}_address"),
            'industry'          => Setting::get("user_profile_{$user->id}_industry"),
            'account_type'      => Setting::get("user_profile_{$user->id}_account_type"),
            'goals'             => Setting::get("user_profile_{$user->id}_goals"),
            'email_verified_at' => $user->email_verified_at,
        ];
    }
}
