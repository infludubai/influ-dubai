<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderFile extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id', 'uploaded_by', 'type',
        'file_path', 'original_name', 'mime_type', 'size',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
