@extends('emails.layout')

@php
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) $siteUrl = 'https://a-mir.com';
@endphp

@section('content')
<h2>Quote Request Received</h2>
<p>Hi {{ $quote->name }},</p>
<p>Thank you for submitting a custom quote request. We've received your details and will prepare a custom proposal within <strong>1–3 business days</strong>.</p>

<table class="info-table">
  <tr><th>Service</th><td>{{ $quote->service_type }}</td></tr>
  @if($quote->budget_range)
  <tr><th>Budget Range</th><td>{{ $quote->budget_range }}</td></tr>
  @endif
  @if($quote->deadline)
  <tr><th>Desired Deadline</th><td>{{ \Carbon\Carbon::parse($quote->deadline)->format('M d, Y') }}</td></tr>
  @endif
</table>

<p>We'll email you with our proposal at <strong>{{ $quote->email }}</strong>. You can also track your quote status in your dashboard.</p>

<div class="cta-btn">
  <a href="{{ $siteUrl }}/contact">Contact Us</a>
</div>
@endsection
