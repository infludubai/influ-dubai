@extends('emails.layout')

@php
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) $siteUrl = 'https://a-mir.com';
@endphp

@section('content')
<h2>New Live Chat Request</h2>
<p>A client has requested human support and needs your attention.</p>

<table class="info-table">
  <tr><th>Client</th><td>{{ $chat->user->name ?? 'Unknown' }}</td></tr>
  <tr><th>Email</th><td>{{ $chat->user->email ?? 'N/A' }}</td></tr>
  <tr><th>Chat ID</th><td>#{{ $chat->id }}</td></tr>
  <tr><th>Started</th><td>{{ $chat->created_at->format('M d, Y H:i') }}</td></tr>
</table>

<div class="cta-btn">
  <a href="{{ $siteUrl }}/admin/chats">Open Chat</a>
</div>
@endsection
