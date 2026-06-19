<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "New Contact: {$this->data['name']} – {$this->data['subject'] ?? 'No Subject'}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.contact-admin', with: ['data' => $this->data]);
    }
}
