# SpennypPiggy.co

**A Creator-Centric Wishlist Platform Empowering Content Creators with Direct Fan Funding**

SpennypPiggy is a social wishlist platform that enables content creators ("Wishers") to receive direct financial support from their fans ("Gifters") through flexible payment models including one-time gifts, subscriptions, crowdfunding, memberships, bills, and tip jars. The platform prioritizes creator empowerment with 100% payouts and instant transfers to creator Stripe accounts.

![Platform Overview](https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/)

## 🎯 Project Overview

### Mission Statement
SpennypPiggy transforms the creator economy by providing a comprehensive platform where fans can directly support creators through personalized wishlist items, while creators maintain complete control over their content and earnings.

### Core Concept: Wisher/Gifter Model
- **Wishers (Creators)**: Post items on their wishlist, create membership tiers, set up bills, and receive funds
- **Gifters (Supporters)**: Browse creator profiles, purchase gifts, subscribe to content, and support campaigns
- **Platform Role**: Facilitates secure transactions while creators receive funds directly via Stripe Connect

### Key Differentiators
- **Creator-First**: 100% of earnings go directly to creators (minus payment processing fees)
- **Instant Payouts**: Funds transfer immediately to creator Stripe balance
- **No Traditional Business Model**: Focus on supporters, not customers
- **Human Support**: Real person assistance for creators
- **Flexible Revenue Streams**: Multiple monetization options in one platform

---

## ✨ Key Features & Functionality

### 🎁 Wishlist Management
- **Multiple Item Types**:
  - One-time purchases (standard gifts)
  - Subscription items (recurring access)
  - Crowdfunding campaigns (flexible goal-based funding)
- **Content Organization**: Categories, pinned items, rewards system
- **Visual Management**: Image thumbnails, watermarking, AI-generated content flagging
- **Approval Workflow**: Content moderation for creator safety

### 💰 Revenue Streams
1. **Wishlist Items**: Direct gift purchases from supporter wishlists
2. **Memberships**: Tiered subscription plans (Bronze, Silver, Gold, Platinum, Lifetime)
3. **Bills**: Request specific payments for services or expenses
4. **Tip Jar**: Direct donations with custom amounts
5. **Crowdfunding**: Goal-based campaigns with progress tracking

### 🌐 Social Integration
- **Twitter Integration**: OAuth authentication with auto-tweet capabilities
- **Automated Posting**: Tweets for new items, purchases, subscriptions, crowdfunding updates
- **Share Functionality**: Social sharing with Web Share API fallback
- **Follow System**: Creator discovery and fan engagement

### 💳 Payment & Checkout
- **Stripe Connect**: Direct creator payouts via connected accounts
- **Multi-Currency**: Support for USD, GBP, EUR, and international currencies
- **Guest Checkout**: Anonymous purchases without account registration
- **Tax Compliance**: Automatic VAT and tax calculations
- **Payment Methods**: Cards, digital wallets, international banking

### 🛍️ Shopping Experience
- **Device-Based Carts**: Persistent shopping carts across devices
- **Anonymous Support**: Privacy-focused gift giving options
- **Message System**: Attach personal messages and media to gifts
- **Quantity Support**: Multiple units of repeatable items

### 👤 User Management
- **Identity Verification**: KYC compliance through Stripe Identity
- **Profile Customization**: Bio, avatar, cover images, creator categories
- **Account Security**: Two-factor authentication, secure sessions
- **Compliance Monitoring**: Content moderation and approval systems

### 📱 Progressive Web App (PWA)
- **Offline Support**: Service worker implementation
- **Push Notifications**: Real-time updates via MagicBell
- **Mobile Optimization**: Responsive design with native app feel
- **Performance**: Critical CSS, font optimization, bundle splitting

---

## 🏗️ Technical Architecture

### Backend Stack
- **Framework**: Laravel 10.x (PHP 8.1+)
- **Database**: MySQL with comprehensive schema design
- **Queue System**: Laravel queues for background processing
- **Authentication**: Laravel Sanctum + Breeze
- **API**: RESTful APIs with Inertia.js integration

### Frontend Stack
- **Framework**: React 18 with Inertia.js
- **Styling**: Tailwind CSS + Bootstrap 5
- **State Management**: Redux Toolkit
- **Build Tool**: Vite 6.x with optimizations
- **UI Libraries**: Headless UI, React Icons, Chart.js

### Payment Infrastructure
- **Primary Gateway**: Stripe Connect for direct payouts
- **Features**: Subscriptions, one-time payments, marketplace
- **Compliance**: PCI DSS compliant via Stripe
- **Tax Handling**: Automatic calculation and collection

### File Storage & CDN
- **Image Management**: Uploadcare for image hosting and processing
- **Watermarking**: Dynamic watermark application
- **Optimization**: Automatic format conversion and compression
- **CDN**: Global content delivery via Uploadcare

### Social & Communication
- **Twitter API**: v2 integration for social features
- **Email Service**: Transactional emails via Laravel Mail
- **Push Notifications**: Real-time notifications via MagicBell
- **Analytics**: Custom analytics for creator insights

### Deployment & Infrastructure
- **Hosting**: Laravel Vapor (AWS Lambda serverless)
- **Environment**: Multi-stage (development, production)
- **Monitoring**: Error tracking, performance monitoring
- **Scaling**: Serverless auto-scaling capabilities

---

## 🗄️ Database Schema Overview

### Core Entities & Relationships

| Entity | Purpose | Key Features |
|--------|---------|--------------|
| **Users** | Creator & supporter accounts | Stripe Connect, KYC, social profiles |
| **WishItems** | Creator wishlist items | Multiple payment types, categories, approval |
| **UserCarts** | Shopping cart management | Device-based, multi-creator support |
| **StripePaymentDetails** | Payment transaction records | Guest support, anonymity options |
| **StripePaymentItems** | Line-item payment details | Media messages, quantity support |
| **Memberships** | Subscription tier management | Hierarchical levels, rewards |
| **Bills** | Custom payment requests | Flexible naming, tax compliance |
| **WishItemSubscriptions** | Recurring payment management | Trial periods, lifecycle tracking |
| **Follows** | Social relationship tracking | Creator discovery, engagement |

### Key Features
- **UUID Strategy**: Public APIs use UUID, internal operations use incremental IDs
- **Soft Deletes**: Complete audit trail with data recovery capabilities  
- **Foreign Key Integrity**: Comprehensive relationship mapping
- **Performance Indexing**: Optimized for common query patterns

### Entity Relationships
```
Users (1:Many) → WishItems → (1:Many) UserCarts → (1:1) StripePaymentItems
  ↓                                                        ↓
(1:Many) Memberships, Bills              StripePaymentDetails (1:Many)
  ↓
(1:Many) Subscriptions & Payments
```

---

## 🚀 Installation & Setup

### Prerequisites
- **PHP**: 8.1 or higher
- **Composer**: Latest version
- **Node.js**: 16+ with npm
- **Database**: MySQL 8.0+
- **Stripe Account**: For payment processing

### Environment Setup

1. **Clone the Repository**
```bash
git clone https://github.com/Future-Profilez/spennypiggy.co
cd spennypiggy.co
```

2. **Install Dependencies**
```bash
# PHP dependencies
composer install

# Node.js dependencies  
npm install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Generate application key
php artisan key:generate
```

4. **Configure Environment Variables**
```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=spennypiggy
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Stripe Configuration
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Uploadcare (Image Storage)
UPLOADCARE_PUBLIC_KEY=your_public_key
UPLOADCARE_SECRET_KEY=your_secret_key

# Twitter API (Optional)
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
```

5. **Database Setup**
```bash
# Run migrations
php artisan migrate

# Seed initial data (optional)
php artisan db:seed
```

6. **Development Servers**

**Terminal 1 - Vite Development Server:**
```bash
npm run dev
```

**Terminal 2 - Laravel Server:**
```bash
php artisan serve
```

Access the application at: `http://127.0.0.1:8000`

### Production Deployment (Laravel Vapor)
```bash
# Development environment
npm run devbuild

# Production environment  
npm run livebuild
```

---

## 🛠️ Development Workflow & Troubleshooting

### Common Local Setup Issues

#### Issue 1: 500 Internal Server Error - Inertia SSR Type Error
**Error:** `Inertia\Ssr\HttpGateway::dispatch(): Argument #1 ($page) must be of type array, string given`

**Solution:**
```bash
# Clear caches
php artisan view:clear
php artisan cache:clear
php artisan config:clear

# Temporarily disable custom Blade directives in app.blade.php
```

#### Issue 2: Vite Manifest Error
**Error:** `Unable to locate file in Vite manifest: resources/css/app.css`

**Solution**: Ensure CSS is imported in `resources/js/app.jsx` and only JS file is specified in Vite config

#### Issue 3: Blank Screen
**Symptoms**: Servers start but homepage shows blank screen

**Solution:**
```bash
# Check both servers are running
npm run dev    # Terminal 1 (wait for ready message)
php artisan serve  # Terminal 2

# Access Laravel server, not Vite server
# Visit: http://127.0.0.1:8000 (not http://localhost:5173)
```

### Development Commands

```bash
# Build & Testing
npm run build                 # Production build
npm run build:analyze        # Bundle analysis  
npm run test                 # Run tests
npm run test:coverage        # Coverage report

# Laravel Commands
php artisan test             # Run PHP tests
php artisan tinker          # Interactive shell

# Performance
npm run critical:generate    # Generate critical CSS
npm run fonts:optimize      # Optimize fonts
npm run performance:test    # Performance testing

# Deployment
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
```

---

## 📁 Project Structure

### Backend (Laravel)
```
app/
├── Console/           # Artisan commands
├── Http/
│   ├── Controllers/   # Request handling logic
│   └── Middleware/    # Request/response filtering
├── Jobs/              # Background job processing
├── Mail/              # Email templates and logic
├── Models/            # Eloquent database models
└── Services/          # Business logic services

database/
├── migrations/        # Database schema definitions
├── seeders/          # Test data population
└── factories/        # Model factories for testing

routes/
├── web.php           # Web application routes
├── api.php           # API endpoints
└── console.php       # Command line routes
```

### Frontend (React)
```
resources/
├── js/
│   ├── Components/    # Reusable UI components
│   ├── Pages/         # Inertia.js page components
│   ├── Layouts/       # Page layout components
│   └── assets/        # Static assets (images, fonts)
├── css/              # Styling (Tailwind, custom CSS)
└── views/            # Blade templates
```

### Key Utility Files
- **app/Helpers.php**: Core utility functions
- **app/TwitterHelper.php**: Social media content generation
- **app/StripeControl.php**: Payment processing utilities
- **app/WatermarkHelper.php**: Image processing
- **app/Traits/**: Shared model behaviors

---

## 🔌 API Endpoints & Routes

### Public Routes
| Method | Endpoint | Purpose |
|--------|----------|--------|
| GET | `/` | Homepage |
| GET | `/giftstore` | Gift store interface |
| GET | `/health` | System health check |
| POST | `/username-availablity` | Check username availability |
| GET | `/currency/{code}` | Set user currency preference |

### Authentication Required
| Method | Endpoint | Purpose |
|--------|----------|--------|
| POST | `/update-cover-or-avatar` | Profile media updates |
| GET | `/membership-dashboard` | Creator membership management |
| POST | `/create-cart` | Shopping cart operations |
| GET | `/magicbell/user-key` | Notification service keys |

### API Request Examples

**Update Profile Media:**
```javascript
POST /update-cover-or-avatar
{
    "type": "avatar", // or "cover"  
    "file": {
        // Uploadcare file object
    }
}
```

**Add to Cart:**
```javascript
POST /add-to-cart
{
    "wish_item_id": "uuid",
    "quantity": 1,
    "message": "Personal note",
    "anonymous": false
}
```

---

## 💼 Business Model & Compliance

### Revenue Model
- **Creator Focused**: 100% of payments go directly to creators
- **Platform Sustainability**: No platform fees on transactions
- **Payment Processing**: Standard Stripe processing fees apply
- **Currency Conversion**: Fees may apply for cross-currency transactions

### Fee Structure
- **Base Platform Fee**: 8% on transactions
- **VAT Handling**: Built-in customizable VAT percentage
- **No Hidden Charges**: Transparent fee structure
- **Instant Payouts**: Direct to creator Stripe balance

### Tax Compliance
- **Creator Responsibility**: Creators responsible for their tax obligations
- **Documentation**: Transaction records available on request
- **International Support**: Multi-jurisdiction compliance
- **VAT Automation**: Automatic calculation and collection where required

### Identity Verification (KYC)
- **Stripe Identity**: Integrated identity verification
- **Document Upload**: Government ID verification required
- **Address Verification**: International address validation  
- **Payout Requirements**: KYC required for payment processing

### Content Policy & Restrictions

**Prohibited Content**:
- Explicit sexual content or nudity
- Adult services or solicitation
- Illegal activities or regulated goods
- Content harmful to minors
- Fraudulent or deceptive practices

**Moderation System**:
- Pre-approval workflow for profiles and items
- Adult content detection via AI
- Community reporting system
- Human review process

---

## ⚡ Performance Optimizations

### Frontend Performance
- **Bundle Splitting**: Code splitting by route and vendor
- **Critical CSS**: Above-the-fold CSS inlined
- **Font Optimization**: WOFF2 format with display swap
- **Image Optimization**: WebP conversion, lazy loading
- **Resource Preloading**: DNS prefetch, preconnect for external resources

### Caching Strategy
- **Application Cache**: Redis for session and application data
- **Database Query Cache**: Optimized with eager loading scopes
- **CDN Caching**: Static assets via Uploadcare CDN
- **Browser Caching**: Optimized cache headers

### Database Optimizations
- **Eager Loading**: Reduce N+1 query problems
- **Optimized Scopes**: Pre-built query scopes for common operations
- **Indexing Strategy**: Performance indexes on frequently queried columns
- **Soft Delete Performance**: Archived data doesn't impact active queries

### PWA Features
- **Service Worker**: Offline functionality and asset caching
- **Background Sync**: Offline form submissions
- **Push Notifications**: Real-time engagement
- **App Shell**: Fast loading app structure
- **Manifest**: Native app-like installation

### Laravel Vapor Benefits
- **Auto-scaling**: Serverless scaling based on demand
- **Global CDN**: Worldwide content distribution
- **Database Scaling**: Managed database with read replicas
- **Queue Processing**: Dedicated queue workers
- **Zero Downtime**: Blue-green deployments

---

## 🤝 Contributing

### Development Guidelines
- **Code Standards**: Follow Laravel and React best practices
- **Testing Requirements**: Unit tests required for new features
- **Documentation**: Update documentation for API changes
- **Security**: Security review required for payment-related changes

### Contribution Process
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request with detailed description

---

## 📄 License & Support

### License
This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

### Support Channels
- **Technical Support**: support@spennypiggy.co
- **Business Hours**: Monday-Friday, 9 AM - 5 PM GMT
- **Phone Support**: 020 4587 3147 (UK)
- **Emergency Issues**: Create GitHub issue with "urgent" label

### Company Information
**Social Vortex, Inc. (DBA Spenny Piggy)**
- **US Address**: 1111B S Governors Ave STE 7527, Dover, DE 19904 US
- **UK Operations**: 55 Colmore Row, C/O WeWork, Birmingham, B3 2AA, UK
- **Business Type**: Delaware C-Corporation

---

*Last updated: December 2024*
*Version: 2.0.0*

For the latest updates and detailed technical documentation, visit our [documentation site](https://docs.spennypiggy.co) or contact our development team.
