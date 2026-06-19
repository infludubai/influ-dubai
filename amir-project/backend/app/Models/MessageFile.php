<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageFile extends Model
{
    public $timestamps = false;

    protected $fillable = ['message_id', 'file_path', 'original_name', 'mime_type', 'size', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
