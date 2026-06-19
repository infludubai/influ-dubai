<?php

use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Admin\AdminChatController;
use App\Http\Controllers\Admin\BlogController;
use App\Http\Controllers\Admin\BuilderController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvoiceAdminController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\PackageController;
use App\Http\Controllers\Admin\PaymentAdminController;
use App\Http\Controllers\Admin\PortfolioController;
use App\Http\Controllers\Admin\QuoteAdminController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserAdminController;
use App\Http\Controllers\Client\ChatController;
use App\Http\Controllers\Client\InvoiceController;
use App\Http\Controllers\Client\NotificationController;
use App\Http\Controllers\Client\OrderController;
use App\Http\Controllers\Client\QuoteController;
use App\Http\Controllers\Public\BlogPublicController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\PackagePublicController;
use App\Http\Controllers\Public\PortfolioPublicController;
use App\Http\Controllers\SmsWebhookController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('verify-device', [AuthController::class, 'verifyDevice']);
    Route::post('resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // OAuth
    Route::get('google/url', [OAuthController::class, 'googleAuthUrl']);
    Route::post('google/callback', [OAuthController::class, 'googleCallback']);

    Route::middleware('auth:sanctum')->get('me', [AuthController::class, 'me']);
    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
});

Route::get('packages', [PackagePublicController::class, 'index']);
Route::get('packages/{slug}', [PackagePublicController::class, 'show']);
Route::get('addons', [PackagePublicController::class, 'addons']);

Route::get('portfolio', [PortfolioPublicController::class, 'index']);
Route::get('portfolio/{slug}', [PortfolioPublicController::class, 'show']);

Route::get('blog', [BlogPublicController::class, 'index']);
Route::get('blog/categories', [BlogPublicController::class, 'categories']);
Route::get('blog/{slug}', [BlogPublicController::class, 'show']);

Route::get('pages/{slug}', [ContactController::class, 'page']);
Route::get('settings/public', [ContactController::class, 'settings']);
Route::post('contact', [ContactController::class, 'submit']);

Route::post('ai/chat', [AiAssistantController::class, 'chat']);
Route::post('ai/transfer', [AiAssistantController::class, 'transfer']);
Route::post('sms/twilio/webhook', [SmsWebhookController::class, 'twilio']);

Route::get('checkout/payment-methods', [CheckoutController::class, 'paymentMethods']);
Route::post('checkout/extract-transaction', [CheckoutController::class, 'extractTransactionId']);

// ─── Authenticated (any logged-in user) ───────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Profile
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('auth/profile/password', [AuthController::class, 'updatePassword']);

    // Checkout
    Route::post('checkout/place', [CheckoutController::class, 'place']);
    Route::post('checkout/upload-screenshot', [CheckoutController::class, 'uploadScreenshot']);

    // Orders
    Route::get('client/orders', [OrderController::class, 'index']);
    Route::get('client/orders/{id}', [OrderController::class, 'show']);
    Route::get('client/orders/{id}/files', [OrderController::class, 'files']);
    Route::post('client/orders/{id}/files', [OrderController::class, 'uploadFile']);

    // Invoices
    Route::get('client/invoices', [InvoiceController::class, 'index']);
    Route::get('client/invoices/{id}', [InvoiceController::class, 'show']);
    Route::get('client/invoices/{id}/download', [InvoiceController::class, 'download']);

    // Quotes
    Route::get('client/quotes', [QuoteController::class, 'index']);
    Route::get('client/quotes/{id}', [QuoteController::class, 'show']);
    Route::post('client/quotes/{id}/files', [QuoteController::class, 'uploadFile']);

    // Chats
    Route::get('client/chats', [ChatController::class, 'index']);
    Route::post('client/chats', [ChatController::class, 'store']);
    Route::get('client/chats/{id}/messages', [ChatController::class, 'messages']);
    Route::get('client/chats/{id}/typing-status', [ChatController::class, 'typingStatus']);
    Route::post('client/chats/{id}/messages', [ChatController::class, 'sendMessage']);
    Route::post('client/chats/{id}/typing', [ChatController::class, 'typing']);
    Route::post('client/chats/{chatId}/messages/{messageId}/files', [ChatController::class, 'uploadFile']);

    // Notifications
    Route::get('client/notifications', [NotificationController::class, 'index']);
    Route::post('client/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('client/notifications/read-all', [NotificationController::class, 'markAllRead']);
});

// Allow guests to submit quotes
Route::post('quotes', [QuoteController::class, 'store']);

// ─── Admin ────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'stats']);
    Route::get('stats', [DashboardController::class, 'stats']);
    Route::get('recent-orders', [DashboardController::class, 'recentOrders']);
    Route::get('revenue-chart', [DashboardController::class, 'revenueChart']);

    // Users
    Route::get('users', [UserAdminController::class, 'index']);
    Route::post('users', [UserAdminController::class, 'store']);
    Route::put('users/{id}', [UserAdminController::class, 'update']);
    Route::delete('users/{id}', [UserAdminController::class, 'destroy']);

    // Custom Quotes
    Route::get('quotes', [QuoteAdminController::class, 'index']);
    Route::put('quotes/{id}', [QuoteAdminController::class, 'update']);

    // Orders
    Route::get('orders', [OrderAdminController::class, 'index']);
    Route::get('orders/{id}', [OrderAdminController::class, 'show']);
    Route::put('orders/{id}/status', [OrderAdminController::class, 'updateStatus']);
    Route::post('orders/{id}/notes', [OrderAdminController::class, 'addNote']);
    Route::post('orders/{id}/files', [OrderAdminController::class, 'uploadDelivery']);

    // Payments
    Route::get('payments', [PaymentAdminController::class, 'index']);
    Route::put('payments/{id}/verify', [PaymentAdminController::class, 'verify']);
    Route::put('payments/{id}/reject', [PaymentAdminController::class, 'reject']);
    Route::get('payment-methods', [PaymentAdminController::class, 'paymentMethods']);
    Route::post('payment-methods', [PaymentAdminController::class, 'storePaymentMethod']);
    Route::put('payment-methods/{id}', [PaymentAdminController::class, 'updatePaymentMethod']);
    Route::delete('payment-methods/{id}', [PaymentAdminController::class, 'destroyPaymentMethod']);

    // Admin Chats
    Route::get('chats', [AdminChatController::class, 'index']);
    Route::get('chats/{id}/messages', [AdminChatController::class, 'messages']);
    Route::get('chats/{id}/typing-status', [AdminChatController::class, 'typingStatus']);
    Route::post('chats/{id}/messages', [AdminChatController::class, 'sendMessage']);
    Route::post('chats/{id}/typing', [AdminChatController::class, 'typing']);
    Route::post('chats/{id}/send-sms', [AdminChatController::class, 'sendSms']);
    Route::post('chats/{chatId}/messages/{messageId}/files', [AdminChatController::class, 'uploadFile']);

    // Invoices
    Route::get('invoices', [InvoiceAdminController::class, 'index']);
    Route::post('invoices', [InvoiceAdminController::class, 'generate']);
    Route::get('invoices/{id}', [InvoiceAdminController::class, 'show']);
    Route::post('invoices/{id}/send', [InvoiceAdminController::class, 'send']);
    Route::post('invoices/{id}/mark-paid', [InvoiceAdminController::class, 'markPaid']);
    Route::get('invoices/{id}/download', [InvoiceAdminController::class, 'download']);

    // Packages & Add-ons
    Route::get('packages', [PackageController::class, 'index']);
    Route::post('packages', [PackageController::class, 'store']);
    Route::get('packages/{id}', [PackageController::class, 'show']);
    Route::put('packages/{id}', [PackageController::class, 'update']);
    Route::delete('packages/{id}', [PackageController::class, 'destroy']);
    Route::get('addons', [PackageController::class, 'addons']);
    Route::post('addons', [PackageController::class, 'storeAddon']);
    Route::put('addons/{id}', [PackageController::class, 'updateAddon']);
    Route::delete('addons/{id}', [PackageController::class, 'destroyAddon']);

    // Portfolio
    Route::get('portfolio', [PortfolioController::class, 'index']);
    Route::post('portfolio', [PortfolioController::class, 'store']);
    Route::put('portfolio/{id}', [PortfolioController::class, 'update']);
    Route::delete('portfolio/{id}', [PortfolioController::class, 'destroy']);
    Route::post('portfolio/reorder', [PortfolioController::class, 'reorder']);

    // Blog
    Route::get('blog', [BlogController::class, 'index']);
    Route::post('blog', [BlogController::class, 'store']);
    Route::post('blog/upload-image', [BlogController::class, 'uploadImage']);
    Route::get('blog/{id}', [BlogController::class, 'show']);
    Route::put('blog/{id}', [BlogController::class, 'update']);
    Route::delete('blog/{id}', [BlogController::class, 'destroy']);
    Route::get('blog-categories', [BlogController::class, 'categories']);
    Route::post('blog-categories', [BlogController::class, 'storeCategory']);
    Route::delete('blog-categories/{id}', [BlogController::class, 'destroyCategory']);

    // Settings & Email Templates
    Route::get('settings', [SettingsController::class, 'index']);
    Route::put('settings', [SettingsController::class, 'update']);
    Route::post('settings/test-email', [SettingsController::class, 'testEmail']);
    Route::post('settings/clear-cache', [SettingsController::class, 'clearCache']);
    Route::post('settings/upload-image', [SettingsController::class, 'uploadImage']);
    Route::get('email-templates', [SettingsController::class, 'emailTemplates']);
    Route::get('email-templates/{key}', [SettingsController::class, 'getEmailTemplate']);
    Route::put('email-templates/{key}', [SettingsController::class, 'updateEmailTemplate']);

    // Builder
    Route::get('builder/blocks', [BuilderController::class, 'blockPalette']);
    Route::get('builder/design-tokens', [BuilderController::class, 'designTokens']);
    Route::put('builder/design-tokens', [BuilderController::class, 'updateDesignTokens']);
    Route::get('builder/pages', [BuilderController::class, 'pages']);
    Route::get('builder/{slug}', [BuilderController::class, 'load']);
    Route::post('builder/{slug}/save', [BuilderController::class, 'save']);
    Route::post('builder/{slug}/publish', [BuilderController::class, 'publish']);
    Route::get('builder/{slug}/history', [BuilderController::class, 'history']);
    Route::post('builder/{slug}/restore/{versionId}', [BuilderController::class, 'restore']);
    Route::put('builder/{slug}/meta', [BuilderController::class, 'updatePageMeta']);
    Route::delete('builder/{slug}', [BuilderController::class, 'destroy']);
});
