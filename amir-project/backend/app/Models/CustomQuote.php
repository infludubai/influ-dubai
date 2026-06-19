<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomQuote extends Model
{
    protected $fillable = [
        'user_id', 'name', 'email', 'phone', 'company',
        'business_industry', 'service_type', 'description',
        'budget_range', 'deadline', 'status', 'quoted_price',
        'quoted_delivery_days', 'admin_notes', 'proposal', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'quoted_price' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function files()
    {
        return $this->hasMany(QuoteFile::class, 'quote_id');
    }
}
