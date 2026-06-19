<!DOCTYPE html>
<html lang="en">
<head>
@php
  $siteName = \App\Models\Setting::get('site_name', 'Amir Nazir');
  $brandEmail = \App\Models\Setting::get('contact_email', \App\Models\Setting::get('admin_email', 'info@a-mir.com'));
  $siteUrl = rtrim((string) \App\Models\Setting::get('frontend_url', env('FRONTEND_URL', 'https://a-mir.com')), '/');
  if ($siteUrl === '' || str_contains($siteUrl, 'localhost') || str_contains($siteUrl, '127.0.0.1')) {
      $siteUrl = 'https://a-mir.com';
  }

  $rawHeader = \App\Models\Setting::get('builder_header', '');
  $headerConfig = [];
  if (is_string($rawHeader) && $rawHeader !== '') {
      $headerConfig = json_decode($rawHeader, true) ?: [];
  }

  // Priority: Custom email logo > Header light logo > Fallback brand logo
  $rawLogo = \App\Models\Setting::get('email_logo_url', '')
      ?: ($headerConfig['logoImageLight'] ?? '')
      ?: (\App\Models\Setting::get('page_global_header_logo_image_light', '')
      ?: (\App\Models\Setting::get('page_global_header_logo_image', '')
      ?: ''));

  // Resolve logo to a fully-qualified URL suitable for email clients.
  // Storage files live on api.a-mir.com; brand files on a-mir.com.
  $apiBase = rtrim(env('APP_URL', 'https://api.a-mir.com'), '/');
  if ($apiBase === '' || str_contains($apiBase, 'localhost')) {
      $apiBase = 'https://api.a-mir.com';
  }

  if (!$rawLogo) {
      // Use the brand logo hosted on the API server (backend public folder)
      $logoUrl = $apiBase . '/brand/amirnazir-logo-light.png';
  } elseif (str_starts_with($rawLogo, 'http://localhost') || str_starts_with($rawLogo, 'https://localhost')) {
      // Stale localhost URL — rewrite to the API server
      $logoUrl = $apiBase . parse_url($rawLogo, PHP_URL_PATH);
  } elseif (str_starts_with($rawLogo, 'http')) {
      // Already a full URL — use as-is
      $logoUrl = $rawLogo;
  } elseif (str_starts_with($rawLogo, '/storage/')) {
      // Relative storage path — hosted on the API server
      $logoUrl = $apiBase . $rawLogo;
  } else {
      // Brand / public path — hosted on the frontend
      $logoUrl = $siteUrl . '/' . ltrim($rawLogo, '/');
  }

  $host = parse_url($siteUrl, PHP_URL_HOST) ?: 'a-mir.com';
@endphp
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $subject ?? $siteName }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #eef3f8; color: #1e293b; padding: 24px 12px; }
  .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
  .wrapper { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 50px rgba(15,23,42,0.10); border: 1px solid #e2e8f0; }
  .header { background: #050b1d; padding: 30px 40px; color: #fff; }
  .brand-row { display: table; width: 100%; }
  .brand-left, .brand-right { display: table-cell; vertical-align: middle; }
  .brand-right { text-align: right; }
  .brand-logo { display: block; max-height: 52px; max-width: 220px; object-fit: contain; }
  .brand-fallback { display: inline-block; color: #fff; font-size: 23px; font-weight: 800; letter-spacing: -0.4px; }
  .brand-pill { display: inline-block; margin-top: 12px; padding: 6px 11px; border-radius: 999px; background: rgba(37,99,235,0.18); color: #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
  .brand-url { color: #bfdbfe; text-decoration: none; font-size: 13px; font-weight: 600; }
  .body { padding: 40px; }
  .body h2 { font-size: 23px; font-weight: 800; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.4px; }
  .body p { font-size: 15px; line-height: 1.65; color: #475569; margin-bottom: 16px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 20px 0; }
  .amount { font-size: 28px; line-height: 1.2; font-weight: 800; color: #0f172a; letter-spacing: -0.8px; }
  .muted { color: #64748b; font-size: 13px; }
  .otp-box { background: #f0f7ff; border: 2px dashed #2563eb; border-radius: 12px; text-align: center; padding: 28px; margin: 24px 0; }
  .otp-code { font-size: 42px; font-weight: 800; color: #2563eb; letter-spacing: 8px; font-family: monospace; }
  .otp-expire { font-size: 13px; color: #94a3b8; margin-top: 8px; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table th { text-align: left; padding: 10px 14px; background: #f8fafc; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
  .info-table td { padding: 12px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-pending, .badge-sent, .badge-draft { background: #dbeafe; color: #1d4ed8; }
  .badge-approved, .badge-paid { background: #dcfce7; color: #166534; }
  .badge-overdue, .badge-cancelled { background: #fee2e2; color: #991b1b; }
  .cta-btn { display: block; margin: 24px auto; text-align: center; }
  .cta-btn a { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 10px 22px rgba(37,99,235,0.25); }
  .secondary-link { color: #2563eb; word-break: break-all; font-size: 13px; }
  .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
  .footer a { color: #2563eb; text-decoration: none; }
  @media only screen and (max-width: 640px) {
    body { padding: 0; background: #fff; }
    .wrapper { border-radius: 0; border: 0; }
    .header, .body, .footer { padding-left: 22px; padding-right: 22px; }
    .brand-left, .brand-right { display: block; text-align: left; }
    .brand-right { margin-top: 14px; }
  }
</style>
</head>
<body>
<div class="preheader">{{ $preheader ?? 'A message from ' . $siteName }}</div>
<div class="wrapper">
  <div class="header">
    <div class="brand-row">
      <div class="brand-left">
        @if($logoUrl)
          <img src="{{ $logoUrl }}" alt="{{ $siteName }}" class="brand-logo">
        @else
          <span class="brand-fallback">{{ $siteName }}</span>
        @endif
        <div class="brand-pill">Digital Services Platform</div>
      </div>
      <div class="brand-right">
        <a class="brand-url" href="{{ $siteUrl }}">{{ $host }}</a>
      </div>
    </div>
  </div>
  <div class="body">
    @yield('content')
  </div>
  <div class="footer">
    <p>
      {{ $siteName }} &middot; Digital Services &middot; <a href="{{ $siteUrl }}">{{ $host }}</a><br>
      <a href="mailto:{{ $brandEmail }}">{{ $brandEmail }}</a>
    </p>
    <p style="margin-top:8px;">You're receiving this email because you have an account or submitted a request on {{ $host }}.</p>
  </div>
</div>
</body>
</html>
