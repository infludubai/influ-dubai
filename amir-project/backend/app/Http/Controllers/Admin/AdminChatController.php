<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageFile;
use App\Services\SmsService;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AdminChatController extends Controller
{
    public function index(): JsonResponse
    {
        $chats = Chat::with(['user:id,name,email,phone', 'latestMessage'])
            ->where('type', 'support')
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($chat) {
                $chat->latest_message = $chat->latestMessage;
                return $chat;
            });

        return response()->json(['data' => $chats]);
    }

    public function messages(int $id): JsonResponse
    {
        $chat = Chat::findOrFail($id);

        // Mark client messages as read
        Message::where('chat_id', $id)
            ->where('sender_type', 'client')
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $chat->update(['unread_admin' => 0]);

        $messages = Message::where('chat_id', $id)
            ->with('files')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $messages]);
    }

    public function typingStatus(int $id): JsonResponse
    {
        Chat::findOrFail($id);

        return response()->json([
            'data' => [
                'client' => Cache::has("chat:{$id}:typing:client"),
            ],
        ]);
    }

    public function typing(int $id): JsonResponse
    {
        Chat::findOrFail($id);
        Cache::put("chat:{$id}:typing:admin", true, now()->addSeconds(6));

        return response()->json(['ok' => true]);
    }

    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $chat = Chat::findOrFail($id);
        $request->validate(['body' => 'required|string|max:5000']);

        $message = Message::create([
            'chat_id'     => $chat->id,
            'sender_id'   => $request->user()->id,
            'sender_type' => 'admin',
            'body'        => $request->body,
            'created_at'  => now(),
        ]);

        $chat->update([
            'last_message_at' => now(),
            'unread_client'   => $chat->unread_client + 1,
        ]);

        return response()->json(['data' => $message], 201);
    }

    public function uploadFile(Request $request, int $chatId, int $messageId): JsonResponse
    {
        $chat    = Chat::findOrFail($chatId);
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();

        $request->validate(['file' => 'required|file|max:20480']);

        $file = $request->file('file');
        $path = PublicFileStorage::store($file, "chats/{$chatId}");

        $mf = MessageFile::create([
            'message_id'    => $message->id,
            'file_path'     => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getMimeType(),
            'size'          => $file->getSize(),
            'created_at'    => now(),
        ]);

        return response()->json(['data' => $mf], 201);
    }

    public function sendSms(Request $request, int $id, SmsService $sms): JsonResponse
    {
        $chat = Chat::with('user')->findOrFail($id);
        $data = $request->validate(['body' => 'required|string|max:1600']);
        $phone = trim((string) $chat->user?->phone);

        if ($phone === '') {
            throw ValidationException::withMessages(['phone' => 'This client does not have a phone number.']);
        }

        $result = $sms->send($phone, $data['body']);

        $messageData = [
            'chat_id' => $chat->id,
            'sender_id' => $request->user()->id,
            'sender_type' => 'admin',
            'body' => $data['body'],
            'created_at' => now(),
        ];

        if (Schema::hasColumn('messages', 'channel')) {
            $messageData['channel'] = 'sms';
        }
        if (Schema::hasColumn('messages', 'sms_sid')) {
            $messageData['sms_sid'] = $result['sid'] ?? null;
        }
        if (Schema::hasColumn('messages', 'sms_status')) {
            $messageData['sms_status'] = $result['status'] ?? 'queued';
        }

        $message = Message::create($messageData);

        $chat->update([
            'last_message_at' => now(),
            'unread_client' => $chat->unread_client + 1,
        ]);

        return response()->json(['data' => $message, 'sms' => $result], 201);
    }
}
