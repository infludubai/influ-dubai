<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class InvoiceAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['user:id,name,email', 'order:id,order_number'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($invoices);
    }

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => 'nullable|exists:orders,id',
            'line_items' => 'required|array',
            'line_items.*.label' => 'required|string',
            'line_items.*.qty' => 'required|integer|min:1',
            'line_items.*.unit_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:draft,sent,paid,overdue,cancelled',
        ]);

        $order = isset($data['order_id']) ? Order::with('user')->find($data['order_id']) : null;

        $subtotal = collect($data['line_items'])->sum(fn ($item) => $item['qty'] * $item['unit_price']);
        $taxRate = $data['tax_rate'] ?? 0;
        $discount = $data['discount'] ?? 0;
        $taxAmount = $subtotal * ($taxRate / 100);
        $total = $subtotal + $taxAmount - $discount;

        $invoice = Invoice::create([
            'order_id' => $order?->id,
            'user_id' => $order?->user_id,
            'line_items' => $data['line_items'],
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'discount' => $discount,
            'total' => $total,
            'status' => $data['status'] ?? 'draft',
            'due_date' => $data['due_date'] ?? null,
            'paid_at' => ($data['status'] ?? null) === 'paid' ? now() : null,
            'notes' => $data['notes'] ?? null,
        ]);

        $this->generatePdf($invoice);

        return response()->json(['data' => $invoice->fresh()], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => Invoice::with(['user', 'order.package'])->findOrFail($id)]);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::with(['user', 'order'])->findOrFail($id);

        $data = $request->validate([
            'email' => 'nullable|email',
        ]);

        $email = $data['email'] ?? $invoice->user?->email;

        if (!$email) {
            throw ValidationException::withMessages([
                'email' => 'Please enter a valid recipient email address.',
            ]);
        }

        try {
            Mail::to($email)->send(new \App\Mail\InvoiceMail($invoice));
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to send invoice email. Please check SMTP settings and try again.',
            ], 500);
        }

        $invoice->update(['status' => 'sent']);

        return response()->json(['message' => 'Invoice sent to ' . $email . '.']);
    }

    public function markPaid(int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);

        return response()->json(['message' => 'Invoice marked as paid.']);
    }

    public function download(int $id)
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->pdf_path || !Storage::exists($invoice->pdf_path)) {
            $this->generatePdf($invoice);
        }

        return response()->file(
            Storage::path($invoice->pdf_path),
            ['Content-Type' => 'application/pdf']
        );
    }

    private function generatePdf(Invoice $invoice): void
    {
        $invoice->load(['user', 'order.package']);
        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);
        $path = "invoices/INV-{$invoice->invoice_number}.pdf";
        Storage::put($path, $pdf->output());
        $invoice->update(['pdf_path' => $path]);
    }
}
