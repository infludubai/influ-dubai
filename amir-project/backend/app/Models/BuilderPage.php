<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuilderPage extends Model
{
    protected $fillable = [
        'page_id', 'version', 'status', 'layout', 'created_by', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'layout' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function page()
    {
        return $this->belongsTo(Page::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
