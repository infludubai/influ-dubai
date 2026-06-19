<?php

namespace App\Mail;

use App\Models\Chat;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewChatSupportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Chat $chat) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'New Live Chat Request – Amir Nazir Platform');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.new-chat-support', with: ['chat' => $this->chat]);
    }
}
