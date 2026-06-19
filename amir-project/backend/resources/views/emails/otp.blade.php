@extends('emails.layout')

@section('content')
<h2>Your One-Time Code</h2>
<p>Hi {{ $user->name }},</p>
<p>Use the following code to <strong>{{ $typeLabel }}</strong>. This code expires in <strong>5 minutes</strong>.</p>

<div class="otp-box">
  <div class="otp-code">{{ $code }}</div>
  <div class="otp-expire">Expires in 5 minutes · Do not share this code</div>
</div>

<p>If you did not request this code, please ignore this email or contact us immediately at <a href="mailto:info@a-mir.com">info@a-mir.com</a>.</p>
@endsection
