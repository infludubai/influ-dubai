<?php

namespace App\Mail;

use App\Models\CustomQuote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public CustomQuote $quote) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'We Received Your Quote Request – Amir Nazir');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.quote-received', with: ['quote' => $this->quote]);
    }
}
