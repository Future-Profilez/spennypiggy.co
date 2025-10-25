# Founder Bonus System - Complete Implementation Flow

## 1. Overview

The Founder Bonus is a special incentive program for creators who perform exceptionally in their first 30 days. Only the first 150 qualifying creators can become Founders and receive a 10% bonus on monthly gifter spend (£500–£10,000) paid by the platform.

## 2. Key Configuration

### Thresholds & Limits
- **Minimum first 30-day earnings**: £2,500
- **Monthly spend for bonus**: £500–£10,000
- **Bonus percentage**: 10%
- **Maximum Founder seats**: 150

### Job Schedule
- **Qualification check**: 6th of each month
- **Payout processing**: 7th of each month

### Admin Capabilities
- Reject payout with reason (email sent to creator)
- Reduce first 30-day minimum threshold if needed
- View all Founder bonus history and status

### Frontend Features
- Profile badge for Founders
- Announcement area (Homepage or Profile)
- Founder Bonus page showing current month progress

## 3. Database Schema

### founder_bonus Table
```sql
CREATE TABLE founder_bonus (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT UNSIGNED NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    first_30d_earnings DECIMAL(10,2) DEFAULT 0.00,
    founder_qualified_at TIMESTAMP NULL,
    monthly_earnings DECIMAL(10,2) DEFAULT 0.00,
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    payout_status ENUM('pending', 'paid', 'rejected') DEFAULT 'pending',
    payout_date TIMESTAMP NULL,
    payout_rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_creator_month (creator_id, month),
    INDEX idx_month (month),
    INDEX idx_payout_status (payout_status),
    INDEX idx_qualified_at (founder_qualified_at)
);
```

### Users Table Addition
```sql
ALTER TABLE users ADD COLUMN is_founder BOOLEAN DEFAULT FALSE;
```

## 4. Implementation Workflow

### Step 1: Track First 30 Days Earnings

**Trigger**: Daily job or real-time on gift transactions

1. For each creator, calculate `first_30d_earnings` = SUM(gifter_spend) for first 30 days from account creation
2. If `first_30d_earnings >= £2,500` AND Founder seats available (< 150):
   - Set `founder_qualified_at = current_date`
   - Create row in `founder_bonus` table with `month = month of qualification`
   - Update `users.is_founder = true`
   - Send congratulations email

### Step 2: Monthly Bonus Calculation

**Schedule**: 6th of each month

1. For all active Founders (`users.is_founder = true`):
   - Calculate total gifter spend for previous month
   - If spend is between £500–£10,000:
     - Calculate `bonus = 10% × monthly_spend`
     - Store in `founder_bonus` table for that month
   - Handle refunds: subtract from next month's bonus if refunds occurred after previous payout
2. Send congratulations email to qualifying Founders with:
   - Bonus amount
   - Link to Founder Bonus page
   - Badge reminder

### Step 3: Payout Processing

**Schedule**: 7th of each month

1. For rows with `bonus_amount > 0` and `payout_status = 'pending'`:
   - Attempt payout via Stripe from platform funds
   - Update `payout_status = 'paid'` and `payout_date` on success
   - If payout fails or admin rejects:
     - Set `payout_status = 'rejected'`
     - Store rejection reason
     - Email reason to creator

### Step 4: Frontend Display

#### Profile Badge
- Display "Founder" badge if `users.is_founder = true`
- Vintage-themed design matching site aesthetic

#### Announcement
- Homepage/Profile banner about Founder program
- Show qualification progress for eligible creators

#### Founder Bonus Page
- Current month progress:
  - Total gifter spend this month
  - Bonus earned (if applicable)
  - Amount remaining to qualify (if under threshold)
- Historical bonus summary (optional)

## 5. Edge Cases & Business Rules

### Founder Seats Management
- Only first 150 creators qualify (sequential based on who meets £2,500 first)
- If fewer qualify in a month, remaining seats roll over
- Once 150 seats filled, no new Founders can be created

### Refund Handling
- If bonus paid and refunds occur later, deduct from next month's bonus
- Negative bonus amounts carry forward until offset by positive earnings

### Admin Override Capabilities
- Reject payout with mandatory reason (stored and emailed)
- Adjust minimum first 30-day threshold globally
- View comprehensive Founder analytics

### Data Integrity
- All monthly calculations stored in `founder_bonus` table
- Jobs must be idempotent (re-running should not double count)
- Use database transactions for critical operations

## 6. Technical Implementation Details

### Models Required
- `FounderBonus` model with relationships to `User`
- Update `User` model with `is_founder` attribute and relationships

### Jobs Required
- `CheckFounderQualification` (daily or monthly on 6th)
- `ProcessFounderPayouts` (monthly on 7th)
- `CalculateFirstThirtyDayEarnings` (daily)

### Mail Classes Required
- `FounderQualificationMail` (congratulations)
- `FounderBonusMail` (monthly bonus notification)
- `FounderPayoutRejectionMail` (rejection notification)

### Controllers Required
- `FounderBonusController` (frontend pages)
- `Admin\FounderBonusController` (admin management)

### Frontend Components Required
- `FounderBadge` component
- `FounderAnnouncement` component
- `FounderBonusPage` component
- Admin dashboard components

### Routes Required
```php
// Public routes
Route::get('/founder/bonus', [FounderBonusController::class, 'index'])->name('founder.bonus');

// Admin routes
Route::prefix('admin')->group(function () {
    Route::get('/founder/bonus', [Admin\FounderBonusController::class, 'index']);
    Route::post('/founder/bonus/{id}/reject', [Admin\FounderBonusController::class, 'reject']);
    Route::post('/founder/bonus/settings', [Admin\FounderBonusController::class, 'updateSettings']);
});
```

### Stripe Integration
- Use Stripe Connect or direct payouts
- Store metadata: `creator_id`, `month`, `bonus_amount`, `payout_status`, `payout_date`
- Handle webhook events for payout status updates

## 7. Configuration Management

### Environment Variables
```env
FOUNDER_BONUS_ENABLED=true
FOUNDER_BONUS_MAX_SEATS=150
FOUNDER_BONUS_MIN_EARNINGS=2500
FOUNDER_BONUS_PERCENTAGE=10
FOUNDER_BONUS_MIN_MONTHLY=500
FOUNDER_BONUS_MAX_MONTHLY=10000
```

### Admin Settings (Database)
- Configurable thresholds
- Enable/disable program
- Seat management

## 8. Testing Strategy

### Unit Tests
- Model relationships and calculations
- Job logic and edge cases
- Email notifications

### Integration Tests
- End-to-end qualification flow
- Payout processing
- Admin rejection workflow

### Performance Tests
- Monthly job execution time
- Database query optimization
- Large dataset handling

## 9. Monitoring & Analytics

### Metrics to Track
- Total Founders created
- Monthly bonus payouts
- Average bonus amounts
- Qualification success rate
- Payout success rate

### Logging Requirements
- All qualification events
- Payout attempts and results
- Admin actions
- Error conditions

## 10. Deployment Checklist

- [ ] Database migration executed
- [ ] Models and relationships created
- [ ] Jobs scheduled in cron
- [ ] Email templates configured
- [ ] Frontend components integrated
- [ ] Admin interface functional
- [ ] Stripe integration tested
- [ ] Configuration values set
- [ ] Monitoring enabled
- [ ] Documentation updated

## 11. Future Enhancements

### Potential Features
- Tiered Founder levels (Gold, Silver, Bronze)
- Seasonal bonus multipliers
- Founder-only features and perks
- Community recognition system
- Advanced analytics dashboard

### Scalability Considerations
- Partition `founder_bonus` table by month
- Implement caching for frequently accessed data
- Consider queue-based processing for large datasets
- Archive old bonus records

---

This document serves as the complete specification for implementing the Founder Bonus system. Each section provides detailed requirements and technical guidance for development teams.