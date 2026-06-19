<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\CustomQuote;
use App\Models\QuoteFile;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $quotes = CustomQuote::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->with('files')
            ->get();

        return response()->json(['data' => $quotes]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'company' => 'nullable|string|max:255',
            'business_industry' => 'nullable|string|max:255',
            'service_type' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'budget_range' => 'nullable|string|max:100',
            'deadline' => 'nullable|date|after:today',
        ]);

        $data['user_id'] = $request->user()?->id;

        $quote = CustomQuote::create($data);

        try {
            \Illuminate\Support\Facades\Mail::to($data['email'])
                ->send(new \App\Mail\QuoteReceivedMail($quote));
        } catch (\Throwable) {
        }

        return response()->json(['data' => $quote, 'message' => 'Quote request submitted.'], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $quote = CustomQuote::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with('files')
            ->firstOrFail();

        return response()->json(['data' => $quote]);
    }

    public function uploadFile(Request $request, int $id): JsonResponse
    {
        $quote = CustomQuote::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $request->validate(['file' => 'required|file|max:10240']);

        $file = $request->file('file');
        $path = PublicFileStorage::store($file, "quotes/{$quote->id}");

        $qf = QuoteFile::create([
            'quote_id' => $quote->id,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $qf], 201);
    }
}
