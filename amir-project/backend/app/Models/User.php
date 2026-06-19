<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'username', 'email', 'phone', 'password', 'role',
        'google_id', 'github_id', 'avatar', 'is_active',
        'email_verified_at', 'last_seen_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function customQuotes()
    {
        return $this->hasMany(CustomQuote::class);
    }

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    public function notifications()
    {
        return $this->hasMany(UserNotification::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    public function otpVerifications()
    {
        return $this->hasMany(OtpVerification::class);
    }
}
