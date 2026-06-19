@extends('emails.layout')

@section('content')
<h2>New Contact Form Submission</h2>

<table class="info-table">
  <tr><th>Name</th><td>{{ $data['name'] }}</td></tr>
  <tr><th>Email</th><td><a href="mailto:{{ $data['email'] }}">{{ $data['email'] }}</a></td></tr>
  @if(!empty($data['phone']))<tr><th>Phone</th><td>{{ $data['phone'] }}</td></tr>@endif
  @if(!empty($data['subject']))<tr><th>Subject</th><td>{{ $data['subject'] }}</td></tr>@endif
</table>

<p><strong>Message:</strong></p>
<div style="background:#f8fafc;border-left:4px solid #0c90e7;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  {{ $data['message'] }}
</div>

<div class="cta-btn">
  <a href="mailto:{{ $data['email'] }}">Reply to {{ $data['name'] }}</a>
</div>
@endsection
