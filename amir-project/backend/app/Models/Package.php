<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'short_description',
        'price', 'currency', 'delivery_days', 'revisions',
        'features', 'is_featured', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function addons()
    {
        return $this->belongsToMany(Addon::class, 'package_addons');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
