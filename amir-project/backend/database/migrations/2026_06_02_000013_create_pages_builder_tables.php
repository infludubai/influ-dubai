<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pages')) {
            return;
        }
        if (!Schema::hasTable('pages')) Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        if (!Schema::hasTable('builder_pages')) Schema::create('builder_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->longText('layout');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['page_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_pages');
        Schema::dropIfExists('pages');
    }
};
