<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class SmsService
{
    public function send(string $to, string $body): array
    {
        $enabled = Setting::get('twilio_sms_enabled', '0') === '1';
        $sid = trim((string) Setting::get('twilio_account_sid', ''));
        $token = trim((string) Setting::get('twilio_auth_token', ''));
        $from = trim((string) Setting::get('twilio_from_number', ''));

        if (!$enabled) {
            throw ValidationException::withMessages(['sms' => 'SMS is not enabled in Integrations.']);
        }

        if ($sid === '' || $token === '' || $from === '') {
            throw ValidationException::withMessages(['sms' => 'Twilio Account SID, Auth Token, and From Number are required.']);
        }

        $response = Http::asForm()
            ->withBasicAuth($sid, $token)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $from,
                'To' => $to,
                'Body' => $body,
            ]);

        if ($response->failed()) {
            $message = $response->json('message') ?: 'Twilio could not send the SMS.';
            throw ValidationException::withMessages(['sms' => $message]);
        }

        return $response->json();
    }
}
