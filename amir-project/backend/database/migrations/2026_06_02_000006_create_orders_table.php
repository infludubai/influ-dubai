<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            return;
        }
        if (!Schema::hasTable('orders')) Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 20)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('package_id')->constrained()->restrictOnDelete();
            $table->enum('status', [
                'pending_approval', 'payment_review', 'approved',
                'in_progress', 'need_info', 'completed',
                'rejected', 'cancelled', 'refunded'
            ])->default('pending_approval');
            $table->string('company_name')->nullable();
            $table->string('website_type')->nullable();
            $table->text('project_description')->nullable();
            $table->text('website_goals')->nullable();
            $table->string('existing_url')->nullable();
            $table->text('reference_urls')->nullable();
            $table->string('business_industry')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->decimal('addons_total', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->date('deadline')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        if (!Schema::hasTable('order_addons')) Schema::create('order_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('addon_id')->constrained()->restrictOnDelete();
            $table->decimal('price_snapshot', 10, 2);
            $table->string('name_snapshot');
        });

        if (!Schema::hasTable('order_files')) Schema::create('order_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['requirement', 'delivery', 'revision', 'reference']);
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_files');
        Schema::dropIfExists('order_addons');
        Schema::dropIfExists('orders');
    }
};
