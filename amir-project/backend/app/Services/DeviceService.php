<?php

namespace App\Services;

use App\Models\Device;
use App\Models\User;
use Illuminate\Http\Request;

class DeviceService
{
    public function getFingerprint(Request $request): string
    {
        // Exclude IP — clients switch networks (home/mobile/office) and shouldn't
        // be forced to re-verify just because their IP changed.
        $data = implode('|', [
            $request->userAgent() ?? '',
            $request->header('Accept-Language') ?? '',
        ]);
        return hash('sha256', $data);
    }

    public function isTrusted(User $user, Request $request): bool
    {
        $fingerprint = $this->getFingerprint($request);

        $device = Device::where('user_id', $user->id)
            ->where('fingerprint', $fingerprint)
            ->where('is_trusted', true)
            ->first();

        if ($device) {
            $device->update(['last_seen_at' => now()]);
            return true;
        }

        return false;
    }

    public function trust(User $user, Request $request): Device
    {
        $fingerprint = $this->getFingerprint($request);

        return Device::updateOrCreate(
            ['user_id' => $user->id, 'fingerprint' => $fingerprint],
            [
                'user_agent' => $request->userAgent(),
                'ip_address' => $request->ip(),
                'is_trusted' => true,
                'trusted_at' => now(),
                'last_seen_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    public function registerUnknown(User $user, Request $request): Device
    {
        $fingerprint = $this->getFingerprint($request);

        return Device::updateOrCreate(
            ['user_id' => $user->id, 'fingerprint' => $fingerprint],
            [
                'user_agent' => $request->userAgent(),
                'ip_address' => $request->ip(),
                'is_trusted' => false,
                'last_seen_at' => now(),
                'created_at' => now(),
            ]
        );
    }
}
