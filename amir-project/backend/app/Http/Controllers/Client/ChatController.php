<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageFile;
use App\Models\Setting;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class ChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $chats = Chat::where('user_id', $request->user()->id)
            ->with('latestMessage')
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json(['data' => $chats]);
    }

    public function store(Request $request): JsonResponse
    {
        $chat = Chat::firstOrCreate(
            ['user_id' => $request->user()->id, 'status' => 'active', 'type' => 'support'],
            ['created_at' => now(), 'updated_at' => now()]
        );

        return response()->json(['data' => $chat], 201);
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $chat = Chat::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        Message::where('chat_id', $chat->id)
            ->where('sender_type', '!=', 'client')
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $chat->update(['unread_client' => 0]);

        $messages = Message::where('chat_id', $chat->id)
            ->with('files')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $messages]);
    }

    public function typingStatus(Request $request, int $id): JsonResponse
    {
        Chat::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        return response()->json([
            'data' => [
                'admin' => Cache::has("chat:{$id}:typing:admin"),
            ],
        ]);
    }

    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $chat = Chat::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $request->validate(['body' => 'required|string|max:5000']);

        $message = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $request->user()->id,
            'sender_type' => 'client',
            'body' => $request->body,
            'created_at' => now(),
        ]);

        $wasUnread = $chat->unread_admin;
        $chat->update([
            'last_message_at' => now(),
            'unread_admin' => $chat->unread_admin + 1,
        ]);

        // Email admin when they have no pending unread messages (first new message notification)
        if ($wasUnread == 0) {
            try {
                $adminEmail = Setting::get('admin_email', config('mail.from.address'));
                $clientName = $request->user()->name;
                $preview = strlen($request->body) > 100
                    ? substr($request->body, 0, 100) . '...'
                    : $request->body;

                Mail::raw(
                    "You have a new message from {$clientName}:\n\n\"{$preview}\"\n\nReply at: https://amirnazir.site/admin/chats",
                    function ($msg) use ($adminEmail, $clientName) {
                        $msg->to($adminEmail)
                            ->subject("💬 New message from {$clientName} — Amir Nazir Platform");
                    }
                );
            } catch (\Throwable) {
                // Silently fail — don't break message send if email fails
            }
        }

        try {
            broadcast(new \App\Events\MessageSent($message))->toOthers();
        } catch (\Throwable) {
        }

        return response()->json(['data' => $message], 201);
    }

    public function typing(Request $request, int $id): JsonResponse
    {
        Chat::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        Cache::put("chat:{$id}:typing:client", true, now()->addSeconds(6));

        try {
            broadcast(new \App\Events\ChatTyping($id, 'client'))->toOthers();
        } catch (\Throwable) {
        }

        return response()->json(['ok' => true]);
    }

    public function uploadFile(Request $request, int $chatId, int $messageId): JsonResponse
    {
        $chat = Chat::where('id', $chatId)->where('user_id', $request->user()->id)->firstOrFail();
        $message = Message::where('id', $messageId)->where('chat_id', $chat->id)->firstOrFail();

        $request->validate(['file' => 'required|file|max:10240']);

        $file = $request->file('file');
        $path = PublicFileStorage::store($file, "chats/{$chatId}");

        $mf = MessageFile::create([
            'message_id' => $message->id,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $mf], 201);
    }
}
