<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            [
                'name' => 'Bank Transfer',
                'type' => 'bank',
                'account_details' => [
                    'bank_name' => 'Your Bank Name',
                    'account_name' => 'Amir Nazir',
                    'account_number' => 'XXXXXXXXXXXXXXXX',
                    'iban' => 'PKXX XXXX XXXX XXXX XXXX XX',
                ],
                'instructions' => 'Please transfer the exact amount to the bank account above. Include your Order Number as the payment reference. Upload your transaction receipt after transfer.',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'JazzCash',
                'type' => 'mobile_wallet',
                'account_details' => [
                    'account_name' => 'Amir Nazir',
                    'mobile_number' => '03XX-XXXXXXX',
                ],
                'instructions' => 'Send payment to the JazzCash number above. Upload your transaction screenshot and enter the Transaction ID below.',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'EasyPaisa',
                'type' => 'mobile_wallet',
                'account_details' => [
                    'account_name' => 'Amir Nazir',
                    'mobile_number' => '03XX-XXXXXXX',
                ],
                'instructions' => 'Send payment to the EasyPaisa account above. Upload your transaction screenshot and enter the Transaction ID.',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::firstOrCreate(['name' => $method['name']], $method);
        }
    }
}
