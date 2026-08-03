<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TopSupportersTest extends TestCase
{
    use RefreshDatabase;

    public function test_top_supporters_returns_successful_response(): void
    {
        $creator = User::factory()->create();
        $supporter = User::factory()->create([
            'name' => 'John Doe',
            'username' => 'johndoe',
        ]);

        FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'source_type' => 'App\Models\TipGoalsPayment',
            'source_id' => 1,
            'type' => 'income',
            'gross_amount' => 10.00,
            'platform_fee' => 1.00,
            'stripe_fee' => 0.50,
            'vat_amount' => 0.00,
            'net_amount' => 8.50,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'tip',
            'transaction_date' => now(),
        ]);

        $response = $this->actingAs($creator)->getJson('/earnings/top-supporters/all');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                '*' => [
                    'username',
                    'name',
                    'media',
                    'amount',
                    'has_hold',
                    'has_dispute',
                ],
            ],
        ]);

        $this->assertEquals('johndoe', $response->json('data.0.username'));
        $this->assertEquals(8.5, $response->json('data.0.amount'));
    }
}
