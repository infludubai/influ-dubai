<?php

namespace App\Services;

use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OtpService
{
    private const EXPIRY_MINUTES = 5;
    private const MAX_ATTEMPTS = 5;
    private const RESEND_COOLDOWN = 60;
    private const MAX_PER_HOUR = 5;

    public function generate(User $user, string $type): OtpVerification
    {
        $this->checkRateLimit($user, $type);

        OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->whereNull('used_at')
            ->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        return OtpVerification::create([
            'user_id' => $user->id,
            'type' => $type,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
            'last_sent_at' => now(),
            'created_at' => now(),
        ]);
    }

    public function generateCode(User $user, string $type): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->whereNull('used_at')
            ->delete();

        OtpVerification::create([
            'user_id' => $user->id,
            'type' => $type,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
            'last_sent_at' => now(),
            'created_at' => now(),
        ]);

        return $code;
    }

    public function verify(User $user, string $type, string $code): bool
    {
        $otp = OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->whereNull('used_at')
            ->latest('created_at')
            ->first();

        if (!$otp) {
            throw ValidationException::withMessages(['otp' => 'No active OTP found. Please request a new one.']);
        }

        if ($otp->isExpired()) {
            throw ValidationException::withMessages(['otp' => 'OTP has expired. Please request a new one.']);
        }

        $otp->increment('attempts');

        if ($otp->attempts > self::MAX_ATTEMPTS) {
            $otp->delete();
            throw ValidationException::withMessages(['otp' => 'Too many attempts. Please request a new OTP.']);
        }

        if (!Hash::check($code, $otp->code)) {
            $remaining = self::MAX_ATTEMPTS - $otp->attempts;
            throw ValidationException::withMessages([
                'otp' => "Invalid OTP. {$remaining} attempts remaining.",
            ]);
        }

        $otp->update(['used_at' => now()]);
        return true;
    }

    public function canResend(User $user, string $type): bool
    {
        $latest = OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->latest('created_at')
            ->first();

        if (!$latest || !$latest->last_sent_at) {
            return true;
        }

        return $latest->last_sent_at->diffInSeconds(now()) >= self::RESEND_COOLDOWN;
    }

    public function getResendCooldown(User $user, string $type): int
    {
        $latest = OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->latest('created_at')
            ->first();

        if (!$latest || !$latest->last_sent_at) {
            return 0;
        }

        $elapsed = $latest->last_sent_at->diffInSeconds(now());
        return max(0, self::RESEND_COOLDOWN - $elapsed);
    }

    private function checkRateLimit(User $user, string $type): void
    {
        $count = OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->where('created_at', '>=', now()->subHour())
            ->count();

        if ($count >= self::MAX_PER_HOUR) {
            throw ValidationException::withMessages([
                'otp' => 'Too many OTP requests. Please try again in an hour.',
            ]);
        }
    }
}
