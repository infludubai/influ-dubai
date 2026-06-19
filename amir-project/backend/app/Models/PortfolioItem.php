<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioItem extends Model
{
    protected $fillable = [
        'title', 'slug', 'category', 'description', 'short_description',
        'thumbnail', 'images', 'tech_stack', 'results', 'live_url',
        'is_featured', 'is_active', 'sort_order', 'completed_at',
        'meta_title', 'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'tech_stack' => 'array',
            'results' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'completed_at' => 'date',
        ];
    }
}
