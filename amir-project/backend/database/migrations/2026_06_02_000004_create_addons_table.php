<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('addons')) {
            return;
        }
        if (!Schema::hasTable('addons')) Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('delivery_days_extra')->default(0);
            $table->enum('billing_type', ['one_time', 'monthly'])->default('one_time');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        if (!Schema::hasTable('package_addons')) Schema::create('package_addons', function (Blueprint $table) {
            $table->foreignId('package_id')->constrained()->cascadeOnDelete();
            $table->foreignId('addon_id')->constrained()->cascadeOnDelete();
            $table->primary(['package_id', 'addon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_addons');
        Schema::dropIfExists('addons');
    }
};
