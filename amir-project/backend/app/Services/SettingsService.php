<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    public function get(string $key, mixed $default = null): mixed
    {
        return Setting::get($key, $default);
    }

    public function set(string $key, mixed $value): void
    {
        Setting::set($key, $value);
    }

    public function getGroup(string $group): array
    {
        return Setting::getGroup($group);
    }

    public function getPublic(): array
    {
        $general = $this->getGroup('general');
        $social = $this->getGroup('social');
        $seo = $this->getGroup('seo');

        return array_merge($general, ['social' => $social, 'seo' => $seo]);
    }

    public function bulkUpdate(array $settings): void
    {
        foreach ($settings as $key => $value) {
            Setting::set($key, $value);
        }
    }
}
