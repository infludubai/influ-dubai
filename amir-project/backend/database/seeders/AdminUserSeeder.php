<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'info@a-mir.com'],
            [
                'name'               => 'Amir Nazir',
                'username'           => 'amir',
                'email'              => 'info@a-mir.com',
                'password'           => Hash::make('Admin@123456'),
                'role'               => 'admin',
                'email_verified_at'  => now(),
                'is_active'          => true,
            ]
        );

        // Update username if the admin was seeded before username column was added
        User::where('email', 'info@a-mir.com')
            ->whereNull('username')
            ->update(['username' => 'amir']);
    }
}
