<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::where('user_id', $request->user()->id)
            ->with('order:id,order_number')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $invoices]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with('order.package')
            ->firstOrFail();

        return response()->json(['data' => $invoice]);
    }

    public function download(Request $request, int $id): BinaryFileResponse
    {
        $invoice = Invoice::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (!$invoice->pdf_path || !Storage::exists($invoice->pdf_path)) {
            abort(404, 'Invoice PDF not available yet.');
        }

        return response()->file(
            Storage::path($invoice->pdf_path),
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="invoice-' . $invoice->invoice_number . '.pdf"',
            ]
        );
    }
}
