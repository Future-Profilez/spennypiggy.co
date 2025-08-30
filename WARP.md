# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SpennypPiggy.co is a creator-centric wishlist platform built with Laravel 10 (PHP 8.1+) backend and React 18 frontend using Inertia.js. The platform enables content creators to receive direct financial support from fans through multiple revenue streams including wishlists, subscriptions, memberships, bills, and tips.

## Technology Stack

### Core Architecture
- **Backend**: Laravel 10 with Inertia.js server-side rendering
- **Frontend**: React 18 with Inertia.js client-side routing
- **Database**: MySQL with comprehensive Eloquent models
- **Build System**: Vite 6.x with React plugin
- **Styling**: Tailwind CSS + Bootstrap 5
- **State Management**: Redux Toolkit
- **Testing**: PHPUnit (Laravel) + Jest (JavaScript)

### Key Integrations
- **Payments**: Stripe Connect for direct creator payouts
- **File Storage**: Uploadcare for image hosting and processing
- **Push Notifications**: MagicBell for real-time notifications
- **Social Media**: Twitter API v2 integration
- **Deployment**: Laravel Vapor (AWS Lambda serverless)
- **Monitoring**: Sentry for error tracking

## Development Commands

### Essential Development Workflow
```bash
# Start development environment (run in separate terminals)
npm run dev        # Vite dev server (wait for ready message)
php artisan serve  # Laravel server at http://127.0.0.1:8000

# Database operations
php artisan migrate              # Run migrations
php artisan migrate:fresh --seed # Fresh install with test data
php artisan db:seed             # Seed data only
```

### Building & Testing
```bash
# Production builds
npm run build                   # Standard production build
npm run build:analyze          # Build with bundle analysis
npm run build:critical         # Build with critical CSS extraction
npm run build:production       # Full production build with service worker

# Testing
npm run test                    # JavaScript tests
npm run test:coverage           # Coverage report
php artisan test               # All PHP tests
php artisan test tests/Unit/   # Unit tests only
php artisan test tests/Feature/ # Feature tests only
php artisan test tests/Integration/ # Integration tests only
```

### Performance & Optimization
```bash
# Performance testing
npm run performance:test        # Quick performance tests
npm run performance:mobile     # Mobile performance
npm run performance:desktop    # Desktop performance
npm run performance:all        # All performance tests
npm run performance:report     # View test reports

# Font & Asset optimization
npm run fonts:optimize         # Optimize fonts for localhost
npm run fonts:optimize:prod    # Optimize fonts for production
npm run critical:generate      # Generate critical CSS
```

### Deployment
```bash
# Laravel Vapor deployments
npm run devbuild               # Deploy to development
npm run livebuild              # Deploy to production
npm run deploy:staging         # Staging deployment
npm run deploy:production      # Production deployment
```

### Service Worker & PWA
```bash
npm run sw:build               # Build service worker
npm run sw:dev                 # Generate SW for development
```

## Application Architecture

### Backend Structure (Laravel)
The application follows Laravel's MVC pattern with several architectural highlights:

**Key Models & Relationships:**
- `User` → Central entity for creators and supporters
- `WishItem` → Creator wishlist items with Stripe product integration
- `Membership` → Subscription tiers (Bronze, Silver, Gold, Platinum, Lifetime)
- `Bills` → Custom payment requests
- `Shop` → Creator shop items with reward systems
- `Post` → Social media content with approval workflow
- `StripePaymentDetails` → Payment transaction records
- `UserCart` → Device-based shopping cart system

**Business Logic Services:**
- `StripeControl.php` → Payment processing utilities
- `TwitterHelper.php` → Social media automation
- `WatermarkHelper.php` → Image processing
- `EmailService.php` → Transactional email handling
- `CurrencyExchange.php` → Multi-currency support

**Background Processing:**
- Queue-based job system for payments, emails, and social media
- Automated content moderation and approval workflows
- Twitter integration for automatic posting
- Stripe webhook processing for payment events

### Frontend Structure (React + Inertia)
```
resources/js/
├── Components/          # Reusable UI components
├── Pages/              # Inertia.js page components
├── Layouts/            # Page layout templates
└── assets/             # Static assets and images
```

**Key Frontend Patterns:**
- Inertia.js for SPA-like experience with server-side routing
- Redux Toolkit for complex state management (payment flows, carts)
- Progressive Web App (PWA) with offline support
- Component-based architecture with reusable UI elements

### Database Design Philosophy
- **UUID Strategy**: Public APIs use UUIDs, internal operations use incremental IDs
- **Soft Deletes**: Complete audit trail with data recovery capabilities
- **Approval Workflows**: Content moderation system for creator safety
- **Multi-Currency**: Flexible currency support with exchange rates
- **Device-Based Carts**: Shopping carts tied to devices, not users

## Testing Strategy

### PHP Testing (PHPUnit)
- `tests/Unit/` → Model relationships, business logic, utilities
- `tests/Feature/` → HTTP endpoints, authentication, integrations
- `tests/Integration/` → Complex workflows, payment processing

**Key Test Classes:**
- `ModelRelationshipsTest.php` → Validates Eloquent relationships
- `LeaderboardSecurityTest.php` → Security and authorization
- `SocialEngagementTest.php` → Social media integrations
- `PendingApprovalTest.php` → Content approval workflows

### JavaScript Testing (Jest)
- Component unit tests
- Integration tests for payment flows
- Utility function testing

## Development Guidelines

### Common Development Tasks

**Adding a New Creator Revenue Stream:**
1. Create migration for new model (follow existing patterns)
2. Create Eloquent model with proper relationships
3. Add Stripe product integration in model
4. Create controller with proper authorization
5. Add approval workflow if needed
6. Create React components for frontend
7. Add background jobs for automation (emails, tweets)
8. Write tests for model relationships and workflows

**Working with Payments:**
- All payments go through Stripe Connect for direct creator payouts
- Use `StripeControl.php` utilities for consistent payment handling
- Implement proper webhook handling for payment events
- Always test with Stripe test mode before production

**Content Moderation:**
- All creator content goes through approval workflow
- Use AI content detection for adult content
- Implement proper soft delete patterns for content removal
- Log all moderation actions for audit trails

### Important Development Patterns

**Model Relationships:**
- User relationships filter out suspended accounts (`suspended_account = 0`)
- UK users are filtered out (`is_uk = 0`) due to business constraints
- Always use proper Eloquent scopes for data filtering
- Implement graceful null handling in relationships

**Payment Processing:**
- Always use UUIDs for public payment references
- Implement proper currency conversion handling
- Use queue jobs for payment processing to avoid timeouts
- Log all payment attempts for debugging

**Frontend State Management:**
- Use Redux for complex state (shopping carts, payment flows)
- Prefer Inertia.js props for server-state synchronization
- Implement proper loading states for async operations
- Handle offline scenarios with service worker

## Common Issues & Solutions

### Development Setup Issues

**500 Internal Server Error with Inertia SSR:**
```bash
# Clear all caches
php artisan view:clear
php artisan cache:clear
php artisan config:clear
```

**Vite Manifest Error:**
- Ensure CSS is imported in `resources/js/app.jsx`
- Check that only JS file is specified in Vite config
- Make sure Vite dev server is running before Laravel server

**Blank Screen on Startup:**
- Access Laravel server at `http://127.0.0.1:8000` (NOT Vite server)
- Wait for Vite "ready" message before accessing application
- Check browser console for JavaScript errors

### Performance Optimization

**Critical CSS Generation:**
```bash
npm run critical:generate      # Laravel command
npm run critical:penthouse     # Node.js alternative
```

**Font Optimization:**
```bash
npm run fonts:optimize         # Local development
npm run fonts:optimize:prod    # Production URLs
npm run fonts:subset           # Create font subsets
```

**Bundle Analysis:**
```bash
npm run build:analyze          # Generates bundle report
```

## Security Considerations

- All creator content requires approval before going live
- Stripe Connect ensures PCI DSS compliance
- User relationships filter suspended/restricted accounts
- API endpoints use proper authorization middleware
- Sensitive data is handled through environment variables

## Deployment & Infrastructure

### Laravel Vapor (Production)
- Serverless deployment on AWS Lambda
- Automatic scaling based on traffic
- Built-in database connection pooling
- Redis cache for session and queue management

### Environment-Specific Commands
```bash
# Health check endpoint
curl http://localhost:8000/health  # Local
curl https://spennypiggy.co/health # Production

# Manual triggers (debugging)
/pending-approval/manual-trigger   # Trigger approval jobs
/seed/{seeder}                     # Run specific seeder
```

## Key Business Logic

### Creator Economy Model
- Creators receive 100% of payments minus payment processing fees
- Multiple revenue streams: gifts, subscriptions, memberships, bills, tips
- Direct payout via Stripe Connect to creator accounts
- Multi-currency support with automatic conversion

### Social Integration
- Automated Twitter posting for new items and purchases
- OAuth-based Twitter authentication
- Customizable social sharing functionality
- Follow system for creator discovery

### Progressive Web App Features
- Service worker for offline functionality
- Push notifications via MagicBell
- Mobile-optimized interface
- App-like installation on mobile devices

This documentation covers the essential patterns and workflows needed to effectively develop and maintain the SpennypPiggy.co platform. Focus on understanding the creator-centric business model and the approval-based content moderation system when making changes.
