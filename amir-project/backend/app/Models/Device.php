<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'fingerprint', 'user_agent', 'ip_address',
        'is_trusted', 'trusted_at', 'last_seen_at', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'is_trusted' => 'boolean',
            'trusted_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
