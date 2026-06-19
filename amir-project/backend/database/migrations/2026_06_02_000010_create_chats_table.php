<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('chats')) {
            return;
        }
        if (!Schema::hasTable('chats')) Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['ai', 'support'])->default('ai');
            $table->enum('status', ['active', 'resolved', 'archived'])->default('active');
            $table->timestamp('last_message_at')->nullable();
            $table->unsignedInteger('unread_client')->default(0);
            $table->unsignedInteger('unread_admin')->default(0);
            $table->timestamps();
        });

        if (!Schema::hasTable('messages')) Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('sender_type', ['client', 'admin', 'ai'])->default('client');
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        if (!Schema::hasTable('message_files')) Schema::create('message_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_files');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('chats');
    }
};
