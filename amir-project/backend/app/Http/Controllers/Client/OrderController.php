<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderFile;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['package:id,name,slug', 'payment:id,order_id,status,amount'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($orders);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['package', 'addons', 'payment.paymentMethod', 'invoice', 'files'])
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function files(Request $request, int $id): JsonResponse
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json(['data' => $order->files()->with('uploader:id,name')->get()]);
    }

    public function uploadFile(Request $request, int $id): JsonResponse
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'file' => 'required|file|max:20480',
            'type' => 'required|in:requirement,revision,reference',
        ]);

        $file = $request->file('file');
        $path = PublicFileStorage::store($file, "orders/{$order->id}/client");

        $orderFile = OrderFile::create([
            'order_id' => $order->id,
            'uploaded_by' => $request->user()->id,
            'type' => $request->type,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $orderFile], 201);
    }
}
