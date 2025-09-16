# 📦 Content Delivery + SLA System Implementation Plan

## Overview

This document outlines the implementation plan for the Content Delivery + SLA (Service Level Agreement) System for Spenny Piggy. The system ensures that every purchase results in a tangible deliverable, provides audit trails for Stripe compliance, and enforces SLA requirements for creators.

## 🎯 System Objectives

1. **Stripe Compliance**: Every payment must have a tangible deliverable for dispute protection
2. **SLA Enforcement**: Automated tracking and enforcement of delivery timelines
3. **Audit Trail**: Complete transaction and delivery logging for compliance
4. **User Experience**: Clear expectations and status updates for buyers
5. **Creator Accountability**: Automated penalties for missed deliverables

## 🏗️ System Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Stripe        │    │   Deliverable   │    │   SLA           │
│   Webhook       │───▶│   Generator     │───▶│   Monitor       │
│   Handler       │    │   System        │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Transaction   │    │   Certificate   │    │   Notification  │
│   Logger        │    │   Generator     │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Product Types & Deliverables

| Product Type | Deliverable | Generation Flow | SLA |
|--------------|-------------|-----------------|-----|
| **Piggy Bank** | 🎖 Supporter Certificate (PDF) + Supporter Wall entry | Auto-generate cert → send email + dashboard | Instant (0h) |
| **Membership** | 📩 Access Certificate + last approved post | Auto-generate cert → fetch last post → grant access | Instant (0h) |
| **Wish Subscription** | 🎖 Subscription Certificate + access entitlement | Auto-generate cert → unlock wish feed | Instant (0h) |
| **Bill Subscription** | 🧾 Monthly Receipt PDF + entitlement window | Auto-generate invoice-style PDF → email + dashboard | 1 day |
| **Wish (one-off)** | 🎁 Uploaded artifact + receipt PDF | Auto-send creator's uploaded artifact + receipt | 0.5 day |
| **Shop Item** | 📦 Uploaded artifact + receipt | Auto-send artifact + receipt | 0.5 day |

## 🔄 System Flow

### 1. Purchase Initiation
```
User Purchase → Stripe Checkout → checkout.session.completed → Webhook Handler
```

**Data Captured:**
- Transaction ID
- Creator ID  
- Buyer ID
- Product Type
- Metadata (purpose, status = pending)

### 2. Deliverable Generation

**Instant Deliverables (0h SLA):**
- Piggy Bank: Auto-generate supporter certificate
- Membership: Generate access certificate + fetch last post
- Wish Subscription: Generate subscription certificate

**Pending Deliverables (0.5-1d SLA):**
- Wish Items: Wait for creator upload
- Shop Items: Wait for creator upload
- Bill Subscriptions: Generate monthly receipt

### 3. Delivery Logging

Every deliverable is logged in the `deliverables` table:

```json
{
  "transaction_id": "tx_123",
  "buyer_id": "user_456", 
  "creator_id": "cr_789",
  "product_type": "wish",
  "product_id": "wish_001",
  "deliverable_url": "https://cdn.spennypiggy.com/deliverables/tx_123.pdf",
  "receipt_url": "https://cdn.spennypiggy.com/receipts/tx_123.pdf",
  "status": "delivered",
  "delivered_at": "2025-01-15T12:05:00Z",
  "sla_deadline": "2025-01-15T12:05:00Z",
  "sla_status": "on_time"
}
```

### 4. SLA Enforcement

**Monitoring:**
- System tracks time since purchase
- Compares against SLA deadlines
- Automated status updates (pending → late → escalated)

**Escalation Process:**
1. **Warning**: Email alert to creator
2. **Late**: Dashboard notification + admin flag
3. **Escalated**: Penalty system trigger

**Penalty System:**
- 1 missed order: Warning email only
- 2+ missed orders: 1-day payout restriction
- 3+ missed orders: Escalating restrictions (3, 7, 10 days)
- Admin override capability

## 🗄️ Database Schema

### Deliverables Table
```sql
CREATE TABLE deliverables (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    transaction_id VARCHAR(255) NOT NULL,
    stripe_session_id VARCHAR(255),
    buyer_id BIGINT UNSIGNED NOT NULL,
    creator_id BIGINT UNSIGNED NOT NULL,
    product_type ENUM('piggy_bank', 'membership', 'wish_subscription', 'bill_subscription', 'wish', 'shop_item') NOT NULL,
    product_id VARCHAR(255),
    deliverable_url TEXT,
    receipt_url TEXT,
    certificate_url TEXT,
    status ENUM('pending', 'delivered', 'late', 'escalated', 'revoked') DEFAULT 'pending',
    sla_deadline TIMESTAMP,
    sla_status ENUM('on_time', 'late', 'escalated') DEFAULT 'on_time',
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_creator_id (creator_id),
    INDEX idx_status (status),
    INDEX idx_sla_deadline (sla_deadline),
    INDEX idx_transaction_id (transaction_id),
    
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### SLA Violations Table
```sql
CREATE TABLE sla_violations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    deliverable_id BIGINT UNSIGNED NOT NULL,
    creator_id BIGINT UNSIGNED NOT NULL,
    violation_type ENUM('late', 'escalated') NOT NULL,
    penalty_applied ENUM('warning', 'restriction_1d', 'restriction_3d', 'restriction_7d', 'restriction_10d'),
    penalty_start_date TIMESTAMP NULL,
    penalty_end_date TIMESTAMP NULL,
    admin_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_creator_id (creator_id),
    INDEX idx_violation_type (violation_type),
    
    FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Creator Penalties Table
```sql
CREATE TABLE creator_penalties (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT UNSIGNED NOT NULL,
    penalty_type ENUM('payout_restriction', 'account_warning', 'account_suspension'),
    penalty_reason TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    admin_override BOOLEAN DEFAULT FALSE,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_creator_id (creator_id),
    INDEX idx_penalty_type (penalty_type),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);
```

## 🔧 Implementation Components

### 1. Models

**Deliverable Model** (`app/Models/Deliverable.php`)
- Relationships with User (buyer/creator)
- SLA calculation methods
- Status management
- URL generation for certificates/receipts

**SlaViolation Model** (`app/Models/SlaViolation.php`)
- Violation tracking
- Penalty calculation
- Admin override functionality

**CreatorPenalty Model** (`app/Models/CreatorPenalty.php`)
- Active penalty checking
- Payout restriction logic
- Admin management

### 2. Services

**DeliverableService** (`app/Services/DeliverableService.php`)
- Generate deliverables by product type
- Certificate creation
- Receipt generation
- File storage management

**SlaEnforcementService** (`app/Services/SlaEnforcementService.php`)
- SLA monitoring
- Violation detection
- Penalty application
- Escalation handling

**CertificateGeneratorService** (`app/Services/CertificateGeneratorService.php`)
- PDF certificate generation
- Template management
- Branding and customization

### 3. Jobs

**ProcessDeliverable** (`app/Jobs/ProcessDeliverable.php`)
- Async deliverable generation
- File processing
- Email notifications

**SlaMonitoringJob** (`app/Jobs/SlaMonitoringJob.php`)
- Scheduled SLA checking
- Violation detection
- Automated escalation

**SendDeliverableNotification** (`app/Jobs/SendDeliverableNotification.php`)
- Buyer notifications
- Creator alerts
- Admin notifications

### 4. Webhook Handlers

**Enhanced StripeWebhookController**
- Handle `checkout.session.completed`
- Create deliverable records
- Trigger deliverable generation
- Update transaction status

### 5. Commands

**CheckSlaViolations** (`app/Console/Commands/CheckSlaViolations.php`)
- Scheduled command for SLA monitoring
- Run every hour
- Detect and process violations

**GeneratePendingDeliverables** (`app/Console/Commands/GeneratePendingDeliverables.php`)
- Process pending deliverables
- Retry failed generations
- Clean up expired items

## 📧 Notification System

### Email Templates

1. **Deliverable Ready** - Buyer notification
2. **SLA Warning** - Creator alert
3. **SLA Violation** - Creator penalty notice
4. **Admin Alert** - SLA breach notification
5. **Deliverable Pending** - Buyer status update

### Dashboard Notifications

1. **Creator Dashboard**: Pending deliverables with countdown
2. **Buyer Dashboard**: Purchase history with delivery status
3. **Admin Dashboard**: SLA violations and penalty management

## 🔐 Security & Compliance

### File Storage
- Secure CDN with signed URLs
- Expiry-based access control
- Prevent public sharing/leaks
- Audit trail for file access

### Data Protection
- Encrypted sensitive data
- GDPR compliance for EU users
- Data retention policies
- Right to deletion handling

### Stripe Compliance
- Complete audit trail for disputes
- Tangible deliverable for every payment
- Metadata preservation
- Refund handling with deliverable revocation

## 🚀 Deployment Plan

### Phase 1: Core Infrastructure
1. Database migrations
2. Model creation
3. Basic deliverable generation
4. Webhook handler updates

### Phase 2: SLA System
1. SLA monitoring service
2. Violation detection
3. Penalty system
4. Admin dashboard

### Phase 3: User Experience
1. Dashboard enhancements
2. Notification system
3. Email templates
4. Mobile responsiveness

### Phase 4: Advanced Features
1. Analytics and reporting
2. Advanced penalty rules
3. Creator performance metrics
4. Automated refund handling

## 📈 Success Metrics

### Compliance Metrics
- 100% deliverable coverage for payments
- <1% SLA violations
- 0 unresolved Stripe disputes
- Complete audit trail coverage

### User Experience Metrics
- <5 second certificate generation
- 95% buyer satisfaction with deliverables
- <2% creator penalty rate
- 99% uptime for deliverable system

### Business Metrics
- Reduced Stripe dispute rate
- Improved creator accountability
- Enhanced platform trust
- Streamlined compliance processes

## 🔄 Maintenance & Monitoring

### Automated Monitoring
- SLA violation alerts
- System health checks
- File storage monitoring
- Performance metrics

### Regular Reviews
- Monthly SLA performance review
- Quarterly penalty system audit
- Annual compliance assessment
- Continuous improvement planning

---

*This document serves as the master implementation guide for the Content Delivery + SLA System. All development should follow this specification to ensure consistency and compliance.*