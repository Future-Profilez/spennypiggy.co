<?php

namespace Database\Seeders;

use App\Models\WishItem;
use App\Models\Bills;
use App\Models\TipGoal;
use App\Models\Shop;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SocialEngagementDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder populates the new social engagement fields with sample data
     * to demonstrate the transition from monetary-based metrics to social engagement metrics.
     */
    public function run(): void
    {
        $this->command->info('Seeding social engagement data...');

        // Create some sample users if they don't exist
        $users = User::factory(10)->create();

        // Seed WishItems with social engagement data
        $this->command->info('Seeding WishItem social engagement data...');
        WishItem::factory(50)->create()->each(function ($wishItem) use ($users) {
            $wishItem->update([
                'user_id' => $users->random()->id,
                'supporter_count' => fake()->numberBetween(0, 1000),
                'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
                'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
                'rising_score' => fake()->numberBetween(0, 100),
                'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
                'trending_status' => fake()->boolean(20), // 20% chance of trending
            ]);
        });

        // Seed Bills with social engagement data
        $this->command->info('Seeding Bills social engagement data...');
        Bills::factory(30)->create()->each(function ($bill) use ($users) {
            $bill->update([
                'user_id' => $users->random()->id,
                'supporter_count' => fake()->numberBetween(0, 500),
                'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
                'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
                'rising_score' => fake()->numberBetween(0, 100),
                'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
                'trending_status' => fake()->boolean(15), // 15% chance of trending
            ]);
        });

        // Seed TipGoals with social engagement data
        $this->command->info('Seeding TipGoal social engagement data...');
        TipGoal::factory(20)->create()->each(function ($tipGoal) use ($users) {
            $tipGoal->update([
                'user_id' => $users->random()->id,
                'supporter_count' => fake()->numberBetween(0, 300),
                'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
                'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
                'rising_score' => fake()->numberBetween(0, 100),
                'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
                'trending_status' => fake()->boolean(25), // 25% chance of trending
            ]);
        });

        // Seed Shops with social engagement data
        $this->command->info('Seeding Shop social engagement data...');
        Shop::factory(40)->create()->each(function ($shop) use ($users) {
            $shop->update([
                'user_id' => $users->random()->id,
                'supporter_count' => fake()->numberBetween(0, 800),
                'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
                'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
                'rising_score' => fake()->numberBetween(0, 100),
                'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
                'trending_status' => fake()->boolean(18), // 18% chance of trending
            ]);
        });

        // Seed Memberships with social engagement data
        $this->command->info('Seeding Membership social engagement data...');
        Membership::factory(25)->create()->each(function ($membership) use ($users) {
            $membership->update([
                'user_id' => $users->random()->id,
                'supporter_count' => fake()->numberBetween(0, 2000),
                'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
                'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
                'rising_score' => fake()->numberBetween(0, 100),
                'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
                'trending_status' => fake()->boolean(12), // 12% chance of trending
            ]);
        });

        $this->command->info('Social engagement data seeded successfully!');
        
        // Output some sample statistics
        $this->outputSampleStatistics();
    }

    /**
     * Output some sample statistics to demonstrate the new fields
     */
    private function outputSampleStatistics(): void
    {
        $this->command->info("\n--- Sample Social Engagement Statistics ---");
        
        // Top trending items across all models
        $trendingWishes = WishItem::where('trending_status', true)->count();
        $viralEngagement = WishItem::where('engagement_level', 'viral')->count();
        $highSupporters = WishItem::where('supporter_count', '>', 500)->count();
        
        $this->command->info("Trending wish items: {$trendingWishes}");
        $this->command->info("Viral engagement wish items: {$viralEngagement}");
        $this->command->info("High supporter count (>500): {$highSupporters}");
        
        // Average growth rates
        $avgGrowthRate = WishItem::avg('creator_growth_rate');
        $this->command->info("Average creator growth rate: " . number_format($avgGrowthRate, 2) . "%");
        
        $this->command->info("--- End Statistics ---\n");
    }
}
