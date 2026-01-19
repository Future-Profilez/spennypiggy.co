# Spenny Piggy - AI Coding Guidelines

## Project Overview
Spenny Piggy is a Laravel 10 + Inertia.js + React SPA platform for creators to receive support through wishes, bills, memberships, and Throne.com-integrated e-commerce gifting. Uses Stripe for payments, Twitter OAuth, and PWA features.

## Architecture
- **Backend**: Laravel 10 with Eloquent models, controllers, and services in `app/Services/`
- **Frontend**: React components in `resources/js/` with Inertia.js for SPA routing
- **Build**: Vite with Laravel plugin, Tailwind CSS, Workbox for PWA
- **Data Flow**: Controllers pass props to Inertia pages, which render React components

## Key Patterns
- **Services**: Business logic in dedicated services (e.g., `StripeControl`, `DiscoveryService`)
- **Helpers**: Utility functions in `app/Helpers.php` and `app/Helpers/` directory
- **Models**: Complex relationships (User has WishItems, Bills, Memberships; payments via StripePaymentDetail)
- **Components**: Reusable React components in `resources/js/Components/`, pages in `resources/js/Pages/`
- **Validation**: Use Laravel Form Requests and custom Rules in `app/Rules/`
- **Jobs**: Queue background tasks in `app/Jobs/` for emails, notifications
- **Content Blocking**: Filter blocked words/emojis in `Helpers::checkBlockData()`

## Development Workflow
- **Frontend Build**: `npm run build` (includes service worker via `npm run sw:build`)
- **Backend Commands**: `php artisan` for migrations, cache clear (`npm run clear`)
- **Critical CSS**: `npm run build:critical` for performance optimization
- **Font Optimization**: `npm run fonts:optimize` for web fonts
- **Local Dev**: `npm run dev` (Vite HMR), `php artisan serve`

## Testing
- **Backend**: PHPUnit with `php artisan test` (unit/feature/integration)
- **Frontend**: Jest with `npm test`, coverage in `coverage/`
- **Performance**: Playwright with `npm run performance:test`, Lighthouse CI
- **Health Check**: `npm run health:check` for deployment verification

## Deployment
- **Platform**: Laravel Vapor (`npm run deploy:production`)
- **Build Process**: `npm run build:production` includes critical CSS and PWA
- **Environment**: Separate `.env` files, production uses `.env.production`
- **Migrations**: Run via Vapor or `php artisan migrate` in production

## Integrations
- **Payments**: Stripe via `StripeControl` service, webhooks in `StripeWebhookController`
- **Auth**: Twitter OAuth via `TwitterAuthService`, social links in `SocialLinks` model
- **Images**: Uploadcare via `Uploadcare` service
- **E-commerce**: Throne.com/RYE integration for wishlists (see `COMPLETE_THRONE_RYE_FLOW_MASTER_DOC.md`)
- **Notifications**: MagicBell via `MagicBellService`, Intercom via `IntercomService`
- **SEO**: `SeoMeta` service for meta tags

## Code Style
- **PHP**: PSR-4 autoload, use Laravel conventions
- **JS**: ES6+ with React hooks, import from `@/` alias
- **Styling**: Tailwind CSS classes, responsive design
- **Error Handling**: Log to Laravel logs, use try-catch in services
- **Security**: Sanitize inputs, use Laravel's built-in CSRF protection

Reference: `app/Models/`, `routes/web.php`, `vite.config.js`, `package.json`