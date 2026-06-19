<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderFile;
use App\Models\UserNotification;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user:id,name,email', 'package:id,name', 'payment:id,order_id,status,amount']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%"));
            });
        }

        $perPage = min((int) $request->get('per_page', 20), 200);
        $orders = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($orders);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with([
            'user', 'package', 'addons.addon',
            'payment.paymentMethod', 'invoice', 'files.uploader',
        ])->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pending_approval,payment_review,approved,in_progress,need_info,completed,rejected,cancelled,refunded',
            'note' => 'nullable|string|max:1000',
        ]);

        $order = Order::findOrFail($id);
        $old = ['status' => $order->status];

        // Save note to order if provided
        if (!empty($data['note'])) {
            $order->update(['status' => $data['status'], 'notes' => $data['note']]);
        } else {
            $order->update(['status' => $data['status']]);
        }

        AuditLog::record('order.status.updated', $order, $old, ['status' => $data['status']]);

        // Give a specific, actionable message for need_info
        $isNeedInfo = $data['status'] === 'need_info';
        $notifTitle = $isNeedInfo ? '⚠️ Action Required — Upload Files' : 'Order Status Updated';
        $notifBody  = $isNeedInfo
            ? "Amir needs additional info or files for Order #{$order->order_number}. Please visit your Progress page to upload. " . ($data['note'] ?? '')
            : "Your order #{$order->order_number} status: " . str_replace('_', ' ', $data['status']);

        UserNotification::create([
            'user_id'    => $order->user_id,
            'type'       => $isNeedInfo ? 'need_info' : 'order_status_updated',
            'title'      => $notifTitle,
            'body'       => trim($notifBody),
            'data'       => ['order_id' => $order->id, 'status' => $data['status']],
            'created_at' => now(),
        ]);

        try {
            \Illuminate\Support\Facades\Mail::to($order->user->email)
                ->send(new \App\Mail\OrderStatusUpdatedMail($order));
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Status updated.', 'data' => $order]);
    }

    public function addNote(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $request->validate(['note' => 'required|string|max:2000']);

        $order->update(['admin_notes' => $request->note]);

        return response()->json(['message' => 'Note saved.']);
    }

    public function uploadDelivery(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $request->validate(['file' => 'required|file|max:51200']);

        $file = $request->file('file');
        $path = PublicFileStorage::store($file, "orders/{$id}/delivery");

        $orderFile = OrderFile::create([
            'order_id' => $order->id,
            'uploaded_by' => $request->user()->id,
            'type' => 'delivery',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $orderFile], 201);
    }
}
