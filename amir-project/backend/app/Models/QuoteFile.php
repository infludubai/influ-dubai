<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuoteFile extends Model
{
    public $timestamps = false;

    protected $fillable = ['quote_id', 'file_path', 'original_name', 'size'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
