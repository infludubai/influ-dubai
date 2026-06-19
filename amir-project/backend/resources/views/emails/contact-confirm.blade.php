@extends('emails.layout')

@php
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) $siteUrl = 'https://a-mir.com';
@endphp

@section('content')
<h2>Thank You, {{ $data['name'] }}!</h2>
<p>We've received your message and will get back to you within <strong>24 hours</strong>.</p>
<p>In the meantime, feel free to browse our services or portfolio.</p>

<div class="cta-btn">
  <a href="{{ $siteUrl }}/services">View Our Services</a>
</div>
@endsection
