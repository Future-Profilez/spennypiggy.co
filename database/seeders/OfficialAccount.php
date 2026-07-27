<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

class OfficialAccount extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'spennypiggyofficial@gmail.com')->exists();
        if (! $user) {
            User::insert([
                'uuid' => Uuid::uuid4(),
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
}
