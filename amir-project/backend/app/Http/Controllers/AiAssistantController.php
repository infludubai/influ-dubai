<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI;

class AiAssistantController extends Controller
{
    private string $systemPrompt = <<<PROMPT
You are Amir, an intelligent assistant for Amir Nazir's digital services platform at amirnazir.site.

You help potential clients understand services, packages, pricing, and the order process.

Services offered include:
- Web Design & Development (business, portfolio, landing pages, e-commerce)
- SEO (local SEO, technical SEO, monthly SEO management)
- Digital Marketing & Social Media
- Branding (logo, brand identity, UI/UX)
- Website Maintenance & Speed Optimization
- AI Chatbot & Live Chat Integration
- Google Analytics, Search Console, Google Business Profile setup
- Content Writing & Copywriting
- Hosting, domain, and email setup

Always be helpful, professional, and guide users toward choosing the right package or requesting a custom quote.
If asked about unrelated topics, politely redirect to services.
When users want to talk to a human, suggest the Live Chat option.

Format responses clearly. Keep them concise unless detail is needed.
PROMPT;

    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => 'required|string|max:2000',
            'chat_id' => 'nullable|integer|exists:chats,id',
        ]);

        $user = $request->user();
        $chatId = $data['chat_id'] ?? null;

        if ($chatId) {
            $chat = Chat::findOrFail($chatId);
        } elseif ($user) {
            $chat = Chat::firstOrCreate(
                ['user_id' => $user->id, 'type' => 'ai', 'status' => 'active'],
                ['created_at' => now(), 'updated_at' => now()]
            );
        } else {
            $chat = null;
        }

        if ($chat) {
            Message::create([
                'chat_id' => $chat->id,
                'sender_id' => $user?->id,
                'sender_type' => 'client',
                'body' => $data['message'],
                'created_at' => now(),
            ]);
        }

        $history = $chat
            ? Message::where('chat_id', $chat->id)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->reverse()
                ->map(fn ($m) => [
                    'role' => $m->sender_type === 'ai' ? 'assistant' : 'user',
                    'content' => $m->body,
                ])
                ->values()
                ->toArray()
            : [];

        $messages = array_merge(
            [['role' => 'system', 'content' => $this->systemPrompt]],
            $history,
            [['role' => 'user', 'content' => $data['message']]]
        );

        try {
            if (!config('openai.api_key')) {
                $aiResponse = $this->fallbackResponse($data['message']);
            } else {
                $response = OpenAI::chat()->create([
                    'model' => config('openai.model', 'gpt-4o-mini'),
                    'messages' => $messages,
                    'max_tokens' => 500,
                    'temperature' => 0.7,
                ]);
                $aiResponse = $response->choices[0]->message->content;
            }
        } catch (\Throwable) {
            $aiResponse = $this->fallbackResponse($data['message']);
        }

        if ($chat) {
            $aiMessage = Message::create([
                'chat_id' => $chat->id,
                'sender_id' => null,
                'sender_type' => 'ai',
                'body' => $aiResponse,
                'created_at' => now(),
            ]);

            $chat->update(['last_message_at' => now()]);
        }

        return response()->json([
            'reply' => $aiResponse,
            'chat_id' => $chat?->id,
        ]);
    }

    public function transfer(Request $request): JsonResponse
    {
        $request->validate(['chat_id' => 'required|exists:chats,id']);

        $chat = Chat::findOrFail($request->chat_id);
        $chat->update(['type' => 'support']);

        try {
            $adminEmail = Setting::get('admin_email', env('ADMIN_EMAIL'));
            \Illuminate\Support\Facades\Mail::to($adminEmail)
                ->send(new \App\Mail\NewChatSupportMail($chat));
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Chat transferred to human support.']);
    }

    private function fallbackResponse(string $message): string
    {
        $lower = strtolower($message);

        if (str_contains($lower, 'price') || str_contains($lower, 'cost') || str_contains($lower, 'package')) {
            return "We offer a range of packages starting from basic website development to full e-commerce solutions. You can view all packages on our Pricing page, or I can help you choose the right one. What type of website or service are you looking for?";
        }
        if (str_contains($lower, 'seo')) {
            return "We offer comprehensive SEO services including Local SEO, Technical SEO, and Monthly SEO Management packages. Would you like to know more about our SEO services or see pricing?";
        }
        if (str_contains($lower, 'contact') || str_contains($lower, 'human') || str_contains($lower, 'talk')) {
            return "Of course! You can reach Amir directly through the contact page or start a live chat. Click 'Chat with Amir' below to connect with a human.";
        }
        if (str_contains($lower, 'portfolio') || str_contains($lower, 'work') || str_contains($lower, 'example')) {
            return "You can view our portfolio of past projects on the Portfolio page. We've worked on business websites, e-commerce stores, and various digital marketing projects.";
        }

        return "Thank you for your message! I'm here to help you with information about our web design, development, SEO, and digital marketing services. What would you like to know more about? You can also browse our Services or Pricing pages, or request a custom quote.";
    }
}
