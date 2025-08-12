# Social Engagement Migration Documentation

## Overview

This document outlines the migration from monetary-based fields to social engagement metrics across all data models and API endpoints. The change focuses on measuring success through community engagement rather than financial transactions.

## Schema Changes

### Deprecated Fields

The following monetary fields have been deprecated across all models:

- `price` - Replaced by `supporter_count` and `engagement_level`
- `currency` - No longer needed with social metrics
- `amount` - Replaced by `supporter_count`
- `fullfill_amount` - Replaced by engagement tracking
- `tax_amount` - No longer applicable
- `target` (in TipGoals) - Replaced by `rising_score` and `supporter_count`
- `default_price` - Replaced by social engagement metrics
- `special_member_price` - Replaced by engagement-based tiers

### New Social Engagement Fields

All main content models (WishItem, Bills, TipGoal, Shop, Membership) now include:

| Field | Type | Description | Values |
|-------|------|-------------|---------|
| `supporter_count` | integer | Number of supporters/followers | 0-∞ |
| `gift_frequency` | enum | How often gifts/interactions occur | daily, weekly, monthly, rarely |
| `creator_growth_rate` | decimal | Creator's growth percentage | 0.00-100.00 |
| `rising_score` | integer | Popularity/trending score | 0-100 |
| `engagement_level` | enum | Content engagement category | low, medium, high, viral |
| `trending_status` | boolean | Whether content is currently trending | true/false |

## Model Updates

### WishItem Model

```php
// OLD - Monetary fields (deprecated)
'price' => 25.00,
'currency' => 'GBP',
'tax_amount' => 2.50,
'fullfill_amount' => 27.50

// NEW - Social engagement fields
'supporter_count' => 342,
'gift_frequency' => 'weekly',
'creator_growth_rate' => 15.75,
'rising_score' => 87,
'engagement_level' => 'high',
'trending_status' => true
```

### Bills Model

```php
// OLD - Monetary fields (deprecated)
'price' => 100.00,
'currency' => 'USD',
'tax_amount' => 8.00

// NEW - Social engagement fields
'supporter_count' => 156,
'gift_frequency' => 'monthly',
'creator_growth_rate' => 22.30,
'rising_score' => 65,
'engagement_level' => 'medium',
'trending_status' => false
```

## API Changes

### Old Price-Based Endpoints (Deprecated)

```bash
# OLD - Price-based filtering
GET /api/wishes?price_min=10&price_max=50&currency=GBP

# OLD - Price-based sorting  
GET /api/wishes?sort=price_asc
```

### New Social Engagement Endpoints

```bash
# NEW - Engagement-based filtering
GET /api/social-engagement/trending?limit=20
GET /api/social-engagement/engagement-level/high?type=wishes
GET /api/social-engagement/supporter-count?min_supporters=100&max_supporters=1000
GET /api/social-engagement/high-growth?min_growth_rate=15.0
GET /api/social-engagement/gift-frequency-stats
```

### Example API Responses

#### Trending Content Response
```json
{
    "success": true,
    "data": {
        "trending_wishes": [
            {
                "id": 1,
                "wishname": "Gaming Setup",
                "supporter_count": 542,
                "gift_frequency": "daily",
                "creator_growth_rate": 45.67,
                "rising_score": 95,
                "engagement_level": "viral",
                "trending_status": true,
                "user": {
                    "username": "gamer_pro"
                }
            }
        ]
    },
    "meta": {
        "total_trending_items": 15,
        "sorted_by": "social_engagement_metrics",
        "deprecated_fields": "price, currency, amount fields are deprecated"
    }
}
```

#### Engagement Level Filtering Response
```json
{
    "success": true,
    "data": {
        "wishes": [
            {
                "id": 2,
                "wishname": "Art Supplies",
                "supporter_count": 234,
                "engagement_level": "high",
                "rising_score": 78
            }
        ]
    },
    "meta": {
        "engagement_level": "high",
        "type": "wishes",
        "sorted_by": "supporter_count_desc,rising_score_desc",
        "note": "Results sorted by social engagement metrics instead of monetary values"
    }
}
```

## Database Migrations

### New Field Migrations

Run these migrations to add the new fields:

```bash
php artisan migrate --path=database/migrations/2025_01_21_120000_add_social_engagement_fields_to_wish_items_table.php
php artisan migrate --path=database/migrations/2025_01_21_120100_add_social_engagement_fields_to_bills_table.php
php artisan migrate --path=database/migrations/2025_01_21_120200_add_social_engagement_fields_to_tip_goals_table.php
php artisan migrate --path=database/migrations/2025_01_21_120300_add_social_engagement_fields_to_shops_table.php
php artisan migrate --path=database/migrations/2025_01_21_120400_add_social_engagement_fields_to_memberships_table.php
php artisan migrate --path=database/migrations/2025_01_21_120500_deprecate_monetary_fields_across_tables.php
```

### Seeding Sample Data

```bash
php artisan db:seed --class=SocialEngagementDataSeeder
```

## Factory Updates

All factories have been updated to generate social engagement data instead of monetary values:

```php
// WishItemFactory - NEW
'supporter_count' => fake()->numberBetween(0, 1000),
'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
'rising_score' => fake()->numberBetween(0, 100),
'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
'trending_status' => fake()->boolean(),
```

## Backend Integration Points

### Calculating Social Metrics

Social engagement metrics should be calculated from actual platform interactions:

```php
// Example calculation logic
$supporterCount = $user->followers()->count() + $item->likes()->count();
$giftFrequency = $this->calculateGiftFrequency($item);
$creatorGrowthRate = $this->calculateGrowthRate($user);
$risingScore = $this->calculateRisingScore($item);
$engagementLevel = $this->determineEngagementLevel($supporterCount, $giftFrequency);
```

### Trending Algorithm

Items become trending based on:
- High `rising_score` (> 75)
- Recent increase in `supporter_count`
- Frequent `gift_frequency` (daily/weekly)
- High `engagement_level` (high/viral)

## Migration Benefits

1. **Social Focus**: Measures community engagement rather than financial transactions
2. **Creator Growth**: Tracks creator momentum and rising popularity
3. **Engagement Patterns**: Understands how users interact with content
4. **Trending Detection**: Identifies popular content through social signals
5. **Non-Monetary Success**: Success is measured by community support, not monetary value

## Backward Compatibility

- Old monetary fields remain in database with deprecation comments
- Existing API endpoints continue to work but return deprecation warnings
- New endpoints provide richer social engagement data
- Migration can be reversed if needed

## Next Steps

1. Deploy migrations to add new fields
2. Update frontend to use new social engagement APIs
3. Implement background jobs to calculate engagement metrics
4. Gradually deprecate old monetary-based endpoints
5. Remove deprecated fields after full transition (future phase)

## Testing

```bash
# Run tests with new factory data
php artisan test --filter=SocialEngagement

# Test API endpoints
curl -X GET "http://localhost/api/social-engagement/trending"
curl -X GET "http://localhost/api/social-engagement/engagement-level/viral"
```
