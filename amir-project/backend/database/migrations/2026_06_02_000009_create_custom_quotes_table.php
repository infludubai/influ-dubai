<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('custom_quotes')) {
            return;
        }
        if (!Schema::hasTable('custom_quotes')) Schema::create('custom_quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 30)->nullable();
            $table->string('company')->nullable();
            $table->string('business_industry')->nullable();
            $table->string('service_type');
            $table->text('description');
            $table->string('budget_range', 100)->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired'])->default('new');
            $table->decimal('quoted_price', 10, 2)->nullable();
            $table->integer('quoted_delivery_days')->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('proposal')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        if (!Schema::hasTable('quote_files')) Schema::create('quote_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained('custom_quotes')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_files');
        Schema::dropIfExists('custom_quotes');
    }
};
