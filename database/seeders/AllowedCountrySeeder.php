<?php

namespace Database\Seeders;

use App\Models\AllowedCountry;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AllowedCountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $countries = [
            ['name' => 'United States', 'code' => 'US', 'phone_code' => '1'],
            ['name' => 'United Kingdom', 'code' => 'GB', 'phone_code' => '44'],
            ['name' => 'Canada', 'code' => 'CA', 'phone_code' => '1'],
            ['name' => 'Australia', 'code' => 'AU', 'phone_code' => '61'],
            ['name' => 'India', 'code' => 'IN', 'phone_code' => '91'],
        ];

        foreach ($countries as $country) {
            AllowedCountry::firstOrCreate(
                ['code' => $country['code']],
                $country
            );
        }
    }
}
