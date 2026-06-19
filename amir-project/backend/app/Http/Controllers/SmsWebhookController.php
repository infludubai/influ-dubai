<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Schema;

class SmsWebhookController extends Controller
{
    public function twilio(Request $request): Response
    {
        $expectedToken = trim((string) Setting::get('twilio_webhook_token', ''));

        if ($expectedToken !== '' && !hash_equals($expectedToken, (string) $request->query('token', ''))) {
            return response('Forbidden', 403)->header('Content-Type', 'text/plain');
        }

        $from = (string) $request->input('From', '');
        $body = trim((string) $request->input('Body', ''));

        if ($from === '' || $body === '') {
            return response('<Response></Response>', 200)->header('Content-Type', 'text/xml');
        }

        $user = $this->findUserByPhone($from);

        if (!$user) {
            return response('<Response></Response>', 200)->header('Content-Type', 'text/xml');
        }

        $chat = Chat::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'active', 'type' => 'support'],
            ['last_message_at' => now()]
        );

        $messageData = [
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'sender_type' => 'client',
            'body' => $body,
            'created_at' => now(),
        ];

        if (Schema::hasColumn('messages', 'channel')) {
            $messageData['channel'] = 'sms';
        }
        if (Schema::hasColumn('messages', 'sms_sid')) {
            $messageData['sms_sid'] = $request->input('MessageSid') ?: $request->input('SmsSid');
        }
        if (Schema::hasColumn('messages', 'sms_status')) {
            $messageData['sms_status'] = $request->input('SmsStatus');
        }

        Message::create($messageData);

        $chat->update([
            'last_message_at' => now(),
            'unread_admin' => $chat->unread_admin + 1,
        ]);

        return response('<Response></Response>', 200)->header('Content-Type', 'text/xml');
    }

    private function findUserByPhone(string $phone): ?User
    {
        $target = $this->normalizePhone($phone);

        return User::whereNotNull('phone')
            ->get(['id', 'phone'])
            ->first(fn (User $user) => $this->normalizePhone((string) $user->phone) === $target);
    }

    private function normalizePhone(string $phone): string
    {
        return preg_replace('/\D+/', '', $phone) ?: '';
    }
}
