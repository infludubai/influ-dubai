<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        try {
            if (Setting::get('smtp_enabled') !== '1') {
                return;
            }
        } catch (\Throwable) {
            return;
        }

        $host        = Setting::get('smtp_host');
        $port        = (int) Setting::get('smtp_port', 465);
        $username    = Setting::get('smtp_username', '');
        $password    = Setting::get('smtp_password', '');
        $fromAddress = Setting::get('smtp_from_address');

        if (!$host || !$fromAddress) {
            return;
        }

        $encryption = strtolower(Setting::get('smtp_encryption', 'smtps') ?: 'smtps');
        // Laravel 11 + Symfony Mailer: use 'smtps' for SSL/465, 'smtp' for STARTTLS/587
        $scheme = match($encryption) {
            'ssl', 'smtps' => 'smtps',
            'tls'          => 'smtp',
            default        => null,
        };

        config([
            'mail.default'                       => 'smtp',
            'mail.mailers.smtp.transport'        => 'smtp',
            'mail.mailers.smtp.host'             => $host,
            'mail.mailers.smtp.port'             => $port,
            'mail.mailers.smtp.scheme'           => $scheme,
            'mail.mailers.smtp.username'         => $username,
            'mail.mailers.smtp.password'         => $password,
            // Bypass Namecheap wildcard cert (*.web-hosting.com) CN mismatch
            'mail.mailers.smtp.stream'           => [
                'ssl' => [
                    'allow_self_signed' => true,
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                ],
            ],
            'mail.from.address'                  => $fromAddress,
            'mail.from.name'                     => Setting::get('smtp_from_name', config('app.name')),
        ]);
    }
}
