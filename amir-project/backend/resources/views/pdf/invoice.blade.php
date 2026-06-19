<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice {{ $invoice->invoice_number }}</title>
@php
  $pdfLogo = \App\Models\Setting::get('page_global_header_logo_image_dark', \App\Models\Setting::get('logo_url', ''));
  if (!$pdfLogo) {
      $pdfLogo = public_path('brand/amirnazir-logo-dark.png');
  } elseif (!str_starts_with($pdfLogo, 'http') && !str_starts_with($pdfLogo, '/')) {
      $pdfLogo = public_path($pdfLogo);
  } elseif (str_starts_with($pdfLogo, '/')) {
      $pdfLogo = public_path(ltrim($pdfLogo, '/'));
  }
@endphp
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
  .page { padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
  .logo-img { max-width: 190px; max-height: 44px; object-fit: contain; }
  .logo { font-size: 22px; font-weight: 700; color: #0c90e7; }
  .logo span { color: #6366f1; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 32px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; }
  .invoice-number { color: #64748b; font-size: 14px; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .party-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
  .party-block p { font-size: 14px; line-height: 1.6; color: #334155; }
  .divider { border: none; border-top: 2px solid #f1f5f9; margin: 32px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #0c90e7; color: #fff; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .text-right { text-align: right; }
  .totals { width: 260px; margin-left: auto; }
  .totals table { width: 100%; }
  .totals td { padding: 8px 12px; font-size: 14px; }
  .totals .total-row td { font-size: 18px; font-weight: 700; color: #0c90e7; border-top: 2px solid #e2e8f0; padding-top: 12px; }
  .status-badge { display: inline-block; padding: 4px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .status-paid { background: #dcfce7; color: #166534; }
  .status-sent { background: #dbeafe; color: #1d4ed8; }
  .status-draft { background: #f1f5f9; color: #64748b; }
  .footer { margin-top: 48px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      @if($pdfLogo)
        <img src="{{ $pdfLogo }}" alt="Amir Nazir" class="logo-img">
      @else
        <div class="logo">Amir<span>Nazir</span></div>
      @endif
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number"># {{ $invoice->invoice_number }}</div>
      <div style="margin-top:8px;">
        <span class="status-badge status-{{ $invoice->status }}">{{ ucfirst($invoice->status) }}</span>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party-block">
      <h4>From</h4>
      <p><strong>Amir Nazir</strong><br>Digital Services<br>info@a-mir.com<br>a-mir.com</p>
    </div>
    <div class="party-block" style="text-align:right;">
      <h4>Bill To</h4>
      <p>
        <strong>{{ $invoice->user->name ?? 'N/A' }}</strong><br>
        {{ $invoice->user->email ?? '' }}<br>
        @if($invoice->user->phone) {{ $invoice->user->phone }} @endif
      </p>
    </div>
  </div>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach($invoice->line_items as $item)
      <tr>
        <td>{{ $item['label'] }}</td>
        <td class="text-right">{{ $item['qty'] }}</td>
        <td class="text-right">${{ number_format($item['unit_price'], 2) }}</td>
        <td class="text-right">${{ number_format($item['qty'] * $item['unit_price'], 2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td class="text-right">${{ number_format($invoice->subtotal, 2) }}</td></tr>
      @if($invoice->tax_rate > 0)
      <tr><td>Tax ({{ $invoice->tax_rate }}%)</td><td class="text-right">${{ number_format($invoice->tax_amount, 2) }}</td></tr>
      @endif
      @if($invoice->discount > 0)
      <tr><td>Discount</td><td class="text-right">-${{ number_format($invoice->discount, 2) }}</td></tr>
      @endif
      <tr class="total-row"><td><strong>Total</strong></td><td class="text-right"><strong>${{ number_format($invoice->total, 2) }}</strong></td></tr>
    </table>
  </div>

  @if($invoice->notes)
  <div style="margin-top:32px;background:#f8fafc;border-radius:8px;padding:16px;">
    <h4 style="font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">Notes</h4>
    <p style="font-size:13px;color:#475569;">{{ $invoice->notes }}</p>
  </div>
  @endif

  <div class="footer">
    Amir Nazir · Digital Services · a-mir.com · info@a-mir.com<br>
    Generated on {{ now()->format('M d, Y') }}
  </div>
</div>
</body>
</html>
