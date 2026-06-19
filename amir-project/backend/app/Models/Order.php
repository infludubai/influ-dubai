<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'package_id', 'status',
        'company_name', 'website_type', 'project_description',
        'website_goals', 'existing_url', 'reference_urls',
        'business_industry', 'base_price', 'addons_total',
        'total_price', 'currency', 'deadline', 'admin_notes',
        'completed_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'addons_total' => 'decimal:2',
            'total_price' => 'decimal:2',
            'deadline' => 'date',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function addons()
    {
        return $this->hasMany(OrderAddon::class);
    }

    public function files()
    {
        return $this->hasMany(OrderFile::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function chat()
    {
        return $this->hasOne(Chat::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->order_number)) {
                $order->order_number = 'ORD-' . date('Y') . str_pad(
                    Order::whereYear('created_at', date('Y'))->count() + 1,
                    4,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });
    }
}
