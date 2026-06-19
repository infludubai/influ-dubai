<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderAddon extends Model
{
    public $timestamps = false;

    protected $fillable = ['order_id', 'addon_id', 'price_snapshot', 'name_snapshot'];

    protected function casts(): array
    {
        return ['price_snapshot' => 'decimal:2'];
    }

    public function addon()
    {
        return $this->belongsTo(Addon::class);
    }
}
