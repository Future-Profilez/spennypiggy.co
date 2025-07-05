<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OfficialAccount extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::insert([
            'name' => 'Official Account',
            'username' => 'spenny_piggy',
            'email' => 'spennypiggyofficial@gmail.com',
            'password' => Hash::make('Jack@sp123'),
            'currency' => 'usd',
            'country' => 'US',
            'default_currency' => 'usd',
            'role' => 1,
            'email_verified_at' => now(),
        ]);
    }
}
