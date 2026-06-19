<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\UserNotification;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with(['order:id,order_number', 'user:id,name,email', 'paymentMethod:id,name'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($payments);
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with('order.user')->findOrFail($id);
        $payment->update([
            'status' => 'verified',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        $payment->order->update(['status' => 'approved']);

        AuditLog::record('payment.verified', $payment);

        UserNotification::create([
            'user_id' => $payment->user_id,
            'type' => 'payment_verified',
            'title' => 'Payment Verified',
            'body' => "Your payment for order #{$payment->order->order_number} has been verified.",
            'data' => ['order_id' => $payment->order_id],
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Payment verified.']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $payment = Payment::with('order.user')->findOrFail($id);

        $payment->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        AuditLog::record('payment.rejected', $payment);

        UserNotification::create([
            'user_id' => $payment->user_id,
            'type' => 'payment_rejected',
            'title' => 'Payment Rejected',
            'body' => "Your payment for order #{$payment->order->order_number} was rejected: {$request->reason}",
            'data' => ['order_id' => $payment->order_id],
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Payment rejected.']);
    }

    public function paymentMethods(): JsonResponse
    {
        return response()->json(['data' => PaymentMethod::orderBy('sort_order')->get()]);
    }

    public function storePaymentMethod(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'account_details' => 'nullable|array',
            'instructions' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo_path'] = PublicFileStorage::store($request->file('logo'), 'payment-methods');
        }
        if ($request->hasFile('qr_code')) {
            $data['qr_code_path'] = PublicFileStorage::store($request->file('qr_code'), 'payment-methods');
        }

        return response()->json(['data' => PaymentMethod::create($data)], 201);
    }

    public function updatePaymentMethod(Request $request, int $id): JsonResponse
    {
        $method = PaymentMethod::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:50',
            'account_details' => 'nullable|array',
            'instructions' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $method->update($data);
        return response()->json(['data' => $method]);
    }

    public function destroyPaymentMethod(int $id): JsonResponse
    {
        PaymentMethod::findOrFail($id)->delete();
        return response()->json(['message' => 'Payment method deleted.']);
    }
}
