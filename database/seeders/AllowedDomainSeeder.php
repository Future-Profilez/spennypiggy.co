<?php

namespace Database\Seeders;

use App\Models\AllowedDomain;
use Illuminate\Database\Seeder;

class AllowedDomainSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $domains = [
            'gmail.com',
            'yahoo.com',
            'hotmail.com',
            'outlook.com',
            'icloud.com',
            'aol.com',
            'protonmail.com',
            'zoho.com',
            'yandex.com',
            'mail.com',
            'gmx.com',
        ];

        foreach ($domains as $domain) {
            AllowedDomain::firstOrCreate(['name' => $domain]);
        }
    }
}
