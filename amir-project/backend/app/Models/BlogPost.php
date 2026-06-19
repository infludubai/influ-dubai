<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $fillable = [
        'category_id', 'author_id', 'title', 'slug', 'excerpt',
        'body', 'featured_image', 'tags', 'meta_title',
        'meta_description', 'status', 'published_at', 'views',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function category()
    {
        return $this->belongsTo(BlogCategory::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
