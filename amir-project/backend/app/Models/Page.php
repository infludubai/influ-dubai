<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'meta_title', 'meta_description', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function builderPages()
    {
        return $this->hasMany(BuilderPage::class);
    }

    public function publishedLayout()
    {
        return $this->hasOne(BuilderPage::class)
            ->where('status', 'published')
            ->latest('version');
    }

    public function draftLayout()
    {
        return $this->hasOne(BuilderPage::class)
            ->where('status', 'draft')
            ->latest('version');
    }
}
