<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'channel')) {
                $table->string('channel', 20)->default('chat')->after('sender_type');
            }

            if (!Schema::hasColumn('messages', 'sms_sid')) {
                $table->string('sms_sid', 100)->nullable()->after('channel');
            }

            if (!Schema::hasColumn('messages', 'sms_status')) {
                $table->string('sms_status', 50)->nullable()->after('sms_sid');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            foreach (['sms_status', 'sms_sid', 'channel'] as $column) {
                if (Schema::hasColumn('messages', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
