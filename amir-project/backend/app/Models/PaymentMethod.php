<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'name', 'type', 'account_details', 'instructions',
        'logo_path', 'qr_code_path', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'account_details' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
