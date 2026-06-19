@extends('emails.layout')

@php
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) $siteUrl = 'https://a-mir.com';
@endphp

@section('content')
<h2>Order Confirmed 🎉</h2>
<p>Hi {{ $order->user->name ?? 'there' }},</p>
<p>Your order has been placed successfully! We'll review your requirements and get back to you within 24 hours.</p>

<table class="info-table">
  <tr><th>Order Number</th><td><strong>{{ $order->order_number }}</strong></td></tr>
  <tr><th>Package</th><td>{{ $order->package->name ?? 'N/A' }}</td></tr>
  <tr><th>Total Amount</th><td><strong>${{ number_format($order->total_price, 2) }}</strong></td></tr>
  <tr><th>Status</th><td><span class="badge badge-pending">Pending Review</span></td></tr>
  <tr><th>Date</th><td>{{ $order->created_at->format('M d, Y') }}</td></tr>
</table>

@if($order->addons && count($order->addons) > 0)
<p><strong>Add-ons selected:</strong><br>
@foreach($order->addons as $addon)
  • {{ $addon->name_snapshot }}<br>
@endforeach
</p>
@endif

<div class="cta-btn">
  <a href="{{ $siteUrl }}/dashboard/orders">View Your Order</a>
</div>

<p>Questions? Reply to this email or chat with us at <a href="https://a-mir.com">a-mir.com</a>.</p>
@endsection
