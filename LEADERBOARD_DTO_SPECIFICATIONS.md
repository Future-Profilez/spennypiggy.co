# 🏆 Leaderboard DTO Specifications v2.0
## Secure Data Transfer Objects for Public Access

---

## 🎯 **Current Existing Sections (Enhanced)**

### 1. **Top Creators** - `/v2/leaderboard/public/creators/{period}`

#### Public DTO (Enhanced):
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/creators",
  "data": {
    "meta": {
      "period": "all|monthly|weekly|daily",
      "total_creators": 1250,
      "updated_at": "2025-01-11T10:30:00Z",
      "next_update": "2025-01-11T11:00:00Z"
    },
    "top_creators": [
      {
        "rank": 1,
        "username": "creator123",
        "display_name": "Jane Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "cover_url": "https://example.com/cover.jpg",
        "role": "creator",
        "is_verified": true,
        "profile_status_lock": 2,
        "badge_type": "gold_star",
        "badge_categories": ["top_creator", "community_favorite"],
        "rank_position": "1st",
        "percentile_rank": "Top 1%",
        "support_streak": "12 days",
        "join_date": "2024-03-15",
        "supporter_count": 245,
        "category_participation": ["wishes", "tips", "memberships"]
      }
    ],
    "rising_creators": [
      {
        "rank": 4,
        "username": "newbie456", 
        "display_name": "Alex Smith",
        "avatar_url": "https://example.com/avatar2.jpg",
        "trend_indicator": "🔥 Rising Fast",
        "growth_badge": "trending_up",
        "days_active": 15,
        "momentum_score": "High"
      }
    ]
  }
}
```

### 2. **Top Supporters/Gifters** - `/v2/leaderboard/public/supporters`

#### Public DTO (Enhanced):
```json
{
  "version": "2.0", 
  "endpoint": "/v2/leaderboard/public/supporters",
  "data": {
    "meta": {
      "period": "alltime",
      "total_supporters": 5420,
      "updated_at": "2025-01-11T10:30:00Z"
    },
    "top_supporters": [
      {
        "rank": 1,
        "username": "generous_heart",
        "display_name": "Support Queen",
        "avatar_url": "https://example.com/supporter1.jpg",
        "role": "supporter",
        "is_verified": false,
        "badge_type": "platinum_supporter",
        "supporter_level": "Champion",
        "total_contributions": "£250.00",
        "currency": "GBP",
        "creators_supported": 12,
        "support_streak": "30 days",
        "favorite_category": "wishes",
        "join_date": "2024-01-20"
      }
    ]
  }
}
```

### 3. **Recent Activity** - `/v2/leaderboard/public/recent-activity`

#### Public DTO (Enhanced):
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/recent-activity", 
  "data": {
    "meta": {
      "timeframe": "last_24_hours",
      "activity_count": 45,
      "updated_at": "2025-01-11T10:30:00Z"
    },
    "recent_supporters": [
      {
        "username": "kind_soul",
        "display_name": "Anonymous",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "supporter",
        "contribution_amount": "£15.00",
        "currency": "GBP",
        "support_type": "wish",
        "timestamp": "2 minutes ago",
        "is_anonymous": false,
        "creator_supported": "creator123"
      }
    ]
  }
}
```

---

## 🚀 **NEW PUBLIC-FRIENDLY SECTIONS**

### 4. **Community Highlights** - `/v2/leaderboard/public/community-highlights`

#### Public DTO:
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/community-highlights",
  "data": {
    "meta": {
      "updated_at": "2025-01-11T10:30:00Z",
      "highlight_period": "this_week"
    },
    "milestone_achievements": [
      {
        "type": "creator_milestone",
        "username": "amazing_creator",
        "display_name": "Sarah Johnson",
        "avatar_url": "https://example.com/avatar.jpg",
        "milestone_title": "First 100 Supporters!",
        "milestone_description": "Reached 100+ supporters this week",
        "badge_earned": "community_builder",
        "celebration_emoji": "🎉",
        "achieved_date": "2025-01-10"
      },
      {
        "type": "supporter_milestone", 
        "username": "super_supporter",
        "display_name": "Mike Chen",
        "avatar_url": "https://example.com/avatar2.jpg",
        "milestone_title": "10 Creators Supported",
        "milestone_description": "Showed love to 10 different creators",
        "badge_earned": "spread_the_love",
        "celebration_emoji": "💝",
        "achieved_date": "2025-01-09"
      }
    ],
    "trending_categories": [
      {
        "category": "wishes",
        "display_name": "Wish Lists",
        "trend_direction": "up",
        "activity_level": "high",
        "description": "Hot category this week",
        "icon": "🎁"
      }
    ]
  }
}
```

### 5. **Leaderboard Stats** - `/v2/leaderboard/public/platform-stats`

#### Public DTO:
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/platform-stats",
  "data": {
    "meta": {
      "updated_at": "2025-01-11T10:30:00Z",
      "stats_period": "all_time"
    },
    "platform_overview": {
      "total_creators": 2847,
      "total_supporters": 12450,
      "active_this_week": 892,
      "countries_represented": 47,
      "total_wishes_fulfilled": 5621,
      "community_mood": "🔥 Active"
    },
    "popular_regions": [
      {
        "country": "United Kingdom", 
        "country_code": "GB",
        "creator_count": 456,
        "flag_emoji": "🇬🇧"
      },
      {
        "country": "United States",
        "country_code": "US", 
        "creator_count": 234,
        "flag_emoji": "🇺🇸"
      }
    ]
  }
}
```

### 6. **Creator Spotlights** - `/v2/leaderboard/public/creator-spotlights`

#### Public DTO:
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/creator-spotlights",
  "data": {
    "meta": {
      "updated_at": "2025-01-11T10:30:00Z",
      "rotation_period": "weekly"
    },
    "featured_creators": [
      {
        "username": "spotlight_creator",
        "display_name": "Emma Wilson",
        "avatar_url": "https://example.com/avatar.jpg",
        "cover_url": "https://example.com/cover.jpg",
        "spotlight_reason": "Rising Star",
        "description": "New creator making waves in the community",
        "categories": ["wishes", "tips"],
        "supporter_count": 67,
        "join_date": "2024-12-15",
        "fun_fact": "Creates amazing digital art",
        "badges": ["new_talent", "community_favorite"]
      }
    ],
    "creator_of_the_week": {
      "username": "weekly_winner",
      "display_name": "David Kim", 
      "avatar_url": "https://example.com/winner.jpg",
      "achievement": "Most Supportive Community",
      "highlight": "Built an amazing community of 200+ supporters"
    }
  }
}
```

### 7. **Live Activity Feed** - `/v2/leaderboard/public/live-feed`

#### Public DTO:
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/live-feed",
  "data": {
    "meta": {
      "updated_at": "2025-01-11T10:30:00Z",
      "refresh_rate": "30_seconds",
      "activity_window": "last_hour"
    },
    "live_activities": [
      {
        "id": "activity_001",
        "type": "support_given",
        "supporter": {
          "username": "generous_fan",
          "display_name": "Anonymous",
          "avatar_url": "https://example.com/avatar.jpg",
          "is_anonymous": false
        },
        "creator": {
          "username": "lucky_creator",
          "display_name": "Kate Brown"
        },
        "action_text": "just supported",
        "support_type": "wish", 
        "timestamp": "2 minutes ago",
        "celebration_emoji": "💝"
      },
      {
        "id": "activity_002",
        "type": "milestone_reached",
        "creator": {
          "username": "growing_creator",
          "display_name": "Tom Garcia",
          "avatar_url": "https://example.com/creator.jpg"
        },
        "milestone_text": "reached 50 supporters!",
        "timestamp": "5 minutes ago",
        "celebration_emoji": "🎉"
      }
    ]
  }
}
```

### 8. **Leaderboard Achievements** - `/v2/leaderboard/public/achievements`

#### Public DTO:
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/public/achievements",
  "data": {
    "meta": {
      "updated_at": "2025-01-11T10:30:00Z",
      "achievement_categories": ["creator", "supporter", "community"]
    },
    "recent_achievements": [
      {
        "username": "badge_collector",
        "display_name": "Lisa Wang",
        "avatar_url": "https://example.com/avatar.jpg",
        "achievement_type": "creator_badge",
        "badge_name": "Community Builder",
        "badge_description": "Built a strong community of supporters",
        "badge_icon": "🏗️",
        "earned_date": "2025-01-10",
        "rarity": "rare"
      }
    ],
    "available_badges": [
      {
        "badge_name": "First Steps",
        "badge_description": "Create your first wish list",
        "badge_icon": "👶",
        "category": "creator",
        "rarity": "common"
      }
    ]
  }
}
```

---

## 🔒 **AUTHENTICATED DTO (Owner/Admin Only)**

### Private Creator Analytics - `/v2/leaderboard/private/creator-analytics`

#### Authenticated DTO (Self-view only):
```json
{
  "version": "2.0",
  "endpoint": "/v2/leaderboard/private/creator-analytics",
  "data": {
    "meta": {
      "user_id": "user_12345",
      "access_level": "owner",
      "updated_at": "2025-01-11T10:30:00Z"
    },
    "personal_stats": {
      "total_revenue": 1250.75,
      "currency": "GBP",
      "revenue_breakdown": {
        "wishes": 450.25,
        "tips": 300.50,
        "memberships": 400.00,
        "subscriptions": 100.00
      },
      "growth_metrics": {
        "monthly_growth_percentage": 15.5,
        "supporter_growth": 12,
        "revenue_trend": "increasing"
      },
      "detailed_analytics": {
        "average_support_amount": 12.50,
        "top_supporter_amount": 50.00,
        "conversion_rate": 8.5,
        "retention_rate": 75.2
      }
    }
  }
}
```

---

## 🔄 **API VERSIONING STRATEGY**

### Version Headers:
```
Accept: application/json
API-Version: 2.0
Client-Version: mobile-1.2.0
```

### Backward Compatibility:
- `/v1/leaderboard/*` - Legacy endpoints (maintain for 6 months)
- `/v2/leaderboard/*` - New secure endpoints
- Auto-redirect v1 → v2 with warning headers

### Version Deprecation:
```json
{
  "deprecated": true,
  "deprecation_date": "2025-07-01",
  "sunset_date": "2025-12-31", 
  "migration_guide": "https://docs.spennypiggy.co/api/v2-migration"
}
```

---

## 🎨 **ENHANCED UI FEATURES**

### Public Leaderboard Enhancements:

1. **Real-time Updates** - Live activity feed updating every 30 seconds
2. **Interactive Badges** - Hover/click for badge descriptions  
3. **Celebration Animations** - When milestones are reached
4. **Community Mood Indicator** - Show platform activity level
5. **Trending Categories** - Highlight popular support types
6. **Creator Spotlights** - Weekly featured creators
7. **Global Stats Counter** - Rolling numbers for platform totals
8. **Achievement Gallery** - Showcase community accomplishments
9. **Country Flags** - Show global community representation
10. **Support Type Icons** - Visual indicators for wishes/tips/etc

### Mobile-First Considerations:
- Swipe gestures for period switching
- Pull-to-refresh functionality
- Compact card layouts for small screens
- Progressive loading for long lists
- Offline caching for basic data

---

## ✅ **IMPLEMENTATION CHECKLIST**

- [ ] Create v2 API routes with versioning
- [ ] Implement public DTO filtering middleware
- [ ] Add authentication checks for private endpoints  
- [ ] Create frontend components for new sections
- [ ] Add real-time WebSocket updates
- [ ] Implement badge system database
- [ ] Create achievement tracking logic
- [ ] Add analytics for engagement metrics
- [ ] Set up automated data refresh jobs
- [ ] Create migration path from v1 to v2

---

## 🔐 **PRIVACY COMPLIANCE**

All public DTOs comply with:
- ✅ GDPR data minimization principles
- ✅ User consent for display names/avatars
- ✅ Anonymous support options
- ✅ No sensitive financial data exposure
- ✅ Right to be forgotten compatibility
- ✅ Data retention policies

**Zero sensitive data** in public endpoints - only public-safe fields as classified in `LEADERBOARD_DATA_CLASSIFICATION.md`.
