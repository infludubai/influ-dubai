<?php

namespace App\Http\Controllers;

use App\Models\Addon;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderAddon;
use App\Models\OrderFile;
use App\Models\Package;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\UserNotification;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function place(Request $request): JsonResponse
    {
        $data = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'addon_ids' => 'nullable|array',
            'addon_ids.*' => 'exists:addons,id',
            'company_name' => 'nullable|string|max:255',
            'website_type' => 'nullable|string|max:255',
            'project_description' => 'required|string|max:5000',
            'website_goals' => 'nullable|string|max:2000',
            'existing_url' => 'nullable|string|max:500',
            'reference_urls' => 'nullable|string|max:1000',
            'business_industry' => 'nullable|string|max:255',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'transaction_id' => 'nullable|string|max:255',
        ]);

        $package = Package::findOrFail($data['package_id']);
        $addons = Addon::whereIn('id', $data['addon_ids'] ?? [])->where('is_active', true)->get();

        $addonsTotal = $addons->sum('price');
        $totalPrice = $package->price + $addonsTotal;

        $order = DB::transaction(function () use ($data, $package, $addons, $addonsTotal, $totalPrice, $request) {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'package_id' => $package->id,
                'company_name' => $data['company_name'] ?? null,
                'website_type' => $data['website_type'] ?? null,
                'project_description' => $data['project_description'],
                'website_goals' => $data['website_goals'] ?? null,
                'existing_url' => $data['existing_url'] ?? null,
                'reference_urls' => $data['reference_urls'] ?? null,
                'business_industry' => $data['business_industry'] ?? null,
                'base_price' => $package->price,
                'addons_total' => $addonsTotal,
                'total_price' => $totalPrice,
                'currency' => $package->currency,
            ]);

            foreach ($addons as $addon) {
                OrderAddon::create([
                    'order_id' => $order->id,
                    'addon_id' => $addon->id,
                    'price_snapshot' => $addon->price,
                    'name_snapshot' => $addon->name,
                ]);
            }

            Payment::create([
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
                'payment_method_id' => $data['payment_method_id'],
                'transaction_id' => $data['transaction_id'] ?? null,
                'amount' => $totalPrice,
                'currency' => $package->currency,
            ]);

            AuditLog::record('order.created', $order, [], ['status' => 'pending_approval']);

            UserNotification::create([
                'user_id' => $request->user()->id,
                'type' => 'order_placed',
                'title' => 'Order Placed Successfully',
                'body' => "Your order #{$order->order_number} has been placed and is pending approval.",
                'data' => ['order_id' => $order->id],
                'created_at' => now(),
            ]);

            return $order;
        });

        try {
            \Illuminate\Support\Facades\Mail::to($request->user()->email)
                ->send(new \App\Mail\OrderConfirmedMail($order->load('package', 'addons')));
        } catch (\Throwable) {
        }

        return response()->json([
            'message' => 'Order placed successfully!',
            'order' => $order->load('package', 'addons', 'payment'),
        ], 201);
    }

    public function uploadScreenshot(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'screenshot' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $path = PublicFileStorage::store($request->file('screenshot'), 'payments/screenshots');

        $payment = $order->payment;
        if ($payment) {
            $payment->update(['screenshot_path' => $path]);
        }

        return response()->json(['message' => 'Screenshot uploaded.', 'path' => $path]);
    }

    /**
     * Extract transaction ID from a payment screenshot using OpenAI Vision.
     * Falls back gracefully if no API key is set.
     */
    public function extractTransactionId(Request $request): JsonResponse
    {
        $request->validate(['screenshot' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120']);

        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        if (!$apiKey) {
            return response()->json(['transaction_id' => null, 'message' => 'OCR not configured']);
        }

        try {
            $file     = $request->file('screenshot');
            $base64   = base64_encode(file_get_contents($file->getPathname()));
            $mimeType = $file->getMimeType();

            $response = \Illuminate\Support\Facades\Http::timeout(20)
                ->withHeaders(['Authorization' => "Bearer {$apiKey}", 'Content-Type' => 'application/json'])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'      => 'gpt-4o-mini',
                    'max_tokens' => 100,
                    'messages'   => [[
                        'role'    => 'user',
                        'content' => [
                            ['type' => 'text',      'text' => 'Extract ONLY the transaction/reference/confirmation ID or number from this payment screenshot. Return just the ID value, nothing else. If not found, return "NOT_FOUND".'],
                            ['type' => 'image_url', 'image_url' => ['url' => "data:{$mimeType};base64,{$base64}", 'detail' => 'low']],
                        ],
                    ]],
                ]);

            $text = trim($response->json('choices.0.message.content') ?? '');

            if (!$text || $text === 'NOT_FOUND' || strlen($text) < 3) {
                return response()->json(['transaction_id' => null]);
            }

            // Clean up: keep only the core ID (remove labels like "Transaction ID:")
            $cleaned = preg_replace('/^[^:]+:\s*/i', '', $text);
            $cleaned = preg_replace('/[^\w\-\/\.#]+/', '', $cleaned);

            return response()->json(['transaction_id' => $cleaned ?: null]);

        } catch (\Throwable $e) {
            return response()->json(['transaction_id' => null, 'error' => $e->getMessage()]);
        }
    }

    public function paymentMethods(): JsonResponse
    {
        $methods = PaymentMethod::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $methods]);
    }
}
