<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomQuote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $quotes = CustomQuote::with('files')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($quotes);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $quote = CustomQuote::findOrFail($id);
        $data = $request->validate([
            'status'        => 'sometimes|in:new,reviewing,quoted,accepted,rejected',
            'quoted_price'  => 'nullable|numeric|min:0',
            'admin_message' => 'nullable|string|max:2000',
            'admin_notes'   => 'nullable|string|max:2000',
        ]);

        // Map admin_message → admin_notes (frontend sends admin_message)
        if (isset($data['admin_message'])) {
            $data['admin_notes'] = $data['admin_message'];
            unset($data['admin_message']);
        }
        $quote->update($data);

        return response()->json(['data' => $quote, 'message' => 'Quote updated.']);
    }
}
