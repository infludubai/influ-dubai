<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $code,
        public string $type,
    ) {}

    public function envelope(): Envelope
    {
        $subjects = [
            'email_verify' => 'Verify Your Email – Amir Nazir',
            'new_device' => 'New Device Login – Amir Nazir',
            'password_reset' => 'Reset Your Password – Amir Nazir',
        ];

        return new Envelope(subject: $subjects[$this->type] ?? 'Your OTP – Amir Nazir');
    }

    public function content(): Content
    {
        $typeLabel = match ($this->type) {
            'email_verify' => 'verify your email address',
            'new_device' => 'verify your new device',
            'password_reset' => 'reset your password',
            default => 'complete your request',
        };

        return new Content(view: 'emails.otp', with: [
            'user' => $this->user,
            'code' => $this->code,
            'typeLabel' => $typeLabel,
        ]);
    }
}
