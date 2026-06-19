@extends('emails.layout')

@php
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) {
      $siteUrl = 'https://a-mir.com';
  }
  $invoiceUrl = $siteUrl . '/dashboard/invoices/' . $invoice->id;
  $lineItems = is_array($invoice->line_items) ? $invoice->line_items : [];
@endphp

@section('content')
<h2>Invoice {{ $invoice->invoice_number }}</h2>
<p>Hi {{ $invoice->user->name ?? 'there' }},</p>
<p>Your invoice is ready. You can review the details below, then open your account to view or download the PDF.</p>

<div class="summary-card">
  <p class="muted" style="margin-bottom:6px;">Amount due</p>
  <div class="amount">${{ number_format($invoice->total, 2) }}</div>
  <p class="muted" style="margin-top:8px;margin-bottom:0;">
    Invoice #{{ $invoice->invoice_number }}
    @if($invoice->order?->order_number)
      &middot; Order #{{ $invoice->order->order_number }}
    @endif
  </p>
</div>

<table class="info-table">
  <tr><th>Status</th><td><span class="badge badge-{{ $invoice->status }}">{{ ucfirst($invoice->status) }}</span></td></tr>
  @if($invoice->due_date)
  <tr><th>Due Date</th><td>{{ $invoice->due_date->format('M d, Y') }}</td></tr>
  @endif
  <tr><th>Subtotal</th><td>${{ number_format($invoice->subtotal, 2) }}</td></tr>
  @if($invoice->tax_rate > 0)
  <tr><th>Tax</th><td>${{ number_format($invoice->tax_amount, 2) }} ({{ $invoice->tax_rate }}%)</td></tr>
  @endif
  @if($invoice->discount > 0)
  <tr><th>Discount</th><td>-${{ number_format($invoice->discount, 2) }}</td></tr>
  @endif
</table>

@if(count($lineItems))
<table class="info-table">
  <tr>
    <th>Item</th>
    <th>Qty</th>
    <th>Total</th>
  </tr>
  @foreach($lineItems as $item)
  <tr>
    <td>{{ $item['label'] ?? 'Service' }}</td>
    <td>{{ $item['qty'] ?? 1 }}</td>
    <td>${{ number_format(($item['qty'] ?? 1) * ($item['unit_price'] ?? 0), 2) }}</td>
  </tr>
  @endforeach
</table>
@endif

<div class="cta-btn">
  <a href="{{ $invoiceUrl }}">View &amp; Download Invoice</a>
</div>

<p class="muted" style="text-align:center;margin-bottom:0;">If the button does not open, copy this link:</p>
<p style="text-align:center;margin-top:6px;"><a class="secondary-link" href="{{ $invoiceUrl }}">{{ $invoiceUrl }}</a></p>
@endsection
