@extends('emails.layout')

@php
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) $siteUrl = 'https://a-mir.com';
@endphp

@section('content')
<h2>Order Status Update</h2>
<p>Hi {{ $order->user->name ?? 'there' }},</p>
<p>Your order status has been updated. Here are the details:</p>

<table class="info-table">
  <tr><th>Order Number</th><td><strong>{{ $order->order_number }}</strong></td></tr>
  <tr><th>New Status</th><td><span class="badge badge-approved">{{ str_replace('_', ' ', ucfirst($order->status)) }}</span></td></tr>
  <tr><th>Updated</th><td>{{ now()->format('M d, Y H:i') }}</td></tr>
</table>

<div class="cta-btn">
  <a href="{{ $siteUrl }}/dashboard/orders/{{ $order->id }}">View Order Details</a>
</div>
@endsection
