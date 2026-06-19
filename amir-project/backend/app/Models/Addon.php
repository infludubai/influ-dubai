<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Addon extends Model
{
    protected $fillable = [
        'name', 'description', 'price', 'delivery_days_extra',
        'billing_type', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function packages()
    {
        return $this->belongsToMany(Package::class, 'package_addons');
    }
}
