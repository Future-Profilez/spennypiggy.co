<?php

/*
|--------------------------------------------------------------------------
| Load The Cached Routes
|--------------------------------------------------------------------------
|
| Here we will decode and unserialize the RouteCollection instance that
| holds all of the route information for an application. This allows
| us to instantaneously load the entire route map into the router.
|
*/

app('router')->setCompiledRoutes(
    array (
  'compiled' => 
  array (
    0 => false,
    1 => 
    array (
      '/sanctum/csrf-cookie' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'sanctum.csrf-cookie',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/vapor/signed-storage-url' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::ER7jwPlT7jiJLq0n',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/manifest.json' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'manifest.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/offline' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'laravelpwa.',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/_ignition/health-check' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'ignition.healthCheck',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/_ignition/execute-solution' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'ignition.executeSolution',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/_ignition/update-config' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'ignition.updateConfig',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/user' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::w56aa3xqsXW3XhYm',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/products' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::QQXw1lZTeYlLLGF2',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/create-product' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::D08L5Z4U3BbYC66C',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/analytics/web-vitals' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::5d3FIbJXg8lcjAIv',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'generated::oIbhmyFsdS5QARtu',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/analytics/web-vitals/trends' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::fYtAVCzjZikzIT1a',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/alerts/performance' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::dSyLBrrwLwY4hxAS',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/founder/qualify-winners' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::BY0beZ7KGUHV7NWg',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/deliverables' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.deliverables.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/risk/evaluate' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::2mCM4kT8tADEEiuW',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/risk/step-up/verify' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::MiX9rMuAjK0zZiIV',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/risk/step-up/resend' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::A6AJ4dUQZNwyGInc',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/risk/step-up/verify-passkey' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::Kfma8I5e64ZEwHfP',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/risk/limits' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::L57828k4lj1QIup5',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/payments/create-intent' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::bVp2Yfsrs9wgVSY6',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/internal/sync-financials' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::Egn47z9kN0gwTSom',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/admin/dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::S5ZVUasHIt8GLy8Y',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/admin/export/audit-pack' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::DnWbyRwe9YirjH7X',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/admin/risk/override' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::EeUjgLWnuEHpBEpv',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/admin/risk/reset' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::O55qhoL5FMy15ukW',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/admin/payout/preview' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::6yuReVyFcBDruoav',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/admin/payout/execute' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::pXyVVev851sALODS',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/emulate-stop' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.emulate.stop',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug/cache-check' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::BHSoJ3NgAG698aj0',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/csrf-cookie' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::qB9zQpPaSFrq3200',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/activity/logs' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'activity.logs',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug-cart-api' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'debug.cart.api',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/send-test-mail' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::JaaAFanYSRURzd1T',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'home',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/pride' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'pride.landing',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/membership-dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membershipDashboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/get-cart' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'get.cart',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/analytics/search-click' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'analytics.search-click',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/feature-suggestion' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'feature-suggestion.store',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/report-content' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.report.store',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/rye-webhook' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'rye.webhook',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webhook/payment' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.webhook.unified',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/webhook' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::EenbamHywAZ1YqjT',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/giftstore' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'giftStore',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creators' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creators',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creators/stripe-safe' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creators.stripe-safe',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creators/keep-100' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creators.keep-100',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creators/features' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creators.features',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creators/disputes' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creators.disputes',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creators/founder-bonus' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creators.founder-bonus',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/create-product-for-creator-and-gifter' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::J6yMcezotjxFkE62',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/delete-all-products' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'delete.all.products',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/archived-all-products' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'archived.all.products',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/send-identity-verification-failed-emails' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::IVcwvmvACwCaWHWO',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/migrate-covers' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::epggOIFjSGVN96MX',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/username-availablity' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'check.username',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/register/validate' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'register.validate',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dashboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/creator/risk-status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::1f90tRrd11ud6ZI5',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/risk-test-panel' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'risk.test.panel',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/test/risk/on' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::DS74VGKE2unLnEtU',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/test/risk/off' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::vFWrI2Qpz2VIBZau',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/test/platform/freeze' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::QFVlh8nZqQIn7eCh',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/test/platform/normal' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::sqND4sqQj9OQb9kf',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/test/creator/reserve' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::nGW4oID60Wwhg4ms',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/api/test/creator/joined-days-ago' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::2RH82abjCT0Botsf',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/profile' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'profile.edit',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'profile.update',
          ),
          1 => NULL,
          2 => 
          array (
            'PATCH' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        2 => 
        array (
          0 => 
          array (
            '_route' => 'profile.destroy',
          ),
          1 => NULL,
          2 => 
          array (
            'DELETE' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/subscriptions' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'subscriptions',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/stripe/search' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.stripe.search',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/stripe/checkout' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.stripe.checkout',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/adult-content-check' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.adult-check',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/email' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/founder-email' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::y09Wh6qe3UdgBuTv',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/debug-user-status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::iMmmRt9iEPC6Cv1i',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/c-data' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::QEYVbZ2WBVmdDZJE',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/x-api' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::o9fPbYGk9Xxd9A1x',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/meta' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::JvFmfzjNaKDIpNcM',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/x-1' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::KLl1oY1u8urKfKuE',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/ip' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::YAm9QqgHMxJJ8V2X',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/pwa-test' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'pwa.test',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/pwa-debug' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'pwa.debug',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/app/check' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'app.check',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/seed-user-verification-status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::GMK42I6dYwCh7Vqi',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test-push' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::TNHj46jg4MybpHL3',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug/test-support-image' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'debug.test-support-image',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/activity' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.activity',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/activity/status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.activity.status',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/activity/refresh' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.activity.refresh',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/activity/suggestions' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.activity.suggestions',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/subscription/status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.subscription.status',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/subscription/validate-payment' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.subscription.validate-payment',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/subscription/dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.subscription.dashboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/subscription/warnings' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.subscription.warnings',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/subscription/sync' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.subscription.sync',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/disputes' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.disputes.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/payouts/reserves' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.payouts.reserves',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/finance/review-holds' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.finance.review_holds',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/security/sessions' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.security.sessions',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/security/sessions/revoke' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.security.sessions.revoke',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/security/blocked-users' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.security.blocked-users',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/security/block-user' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.security.block-user',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator/security/search-users' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.security.search-users',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/service-worker.js' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'service.worker',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/new-service-worker.js' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'new-service-worker',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/site.webmanifest' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'site.manifest.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/android-chrome-192x192.png' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => '192.image.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/android-chrome-512x512.png' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => '512.image.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/favicon-16x16.png' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => '16.image.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/favicon-32x32.png' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => '32.image.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/splashscreen.png' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'splash.image.file',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/app-robots-file' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'app.robots',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/app-sitemap-index' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'app.sitemap.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/app-sitemap-pages' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'app.sitemap.static',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/app-sitemap-users' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'app.sitemap.creators',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/app-sitemap-items' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'app.sitemap.wishlists',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dynamic-robots' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dynamic.robots',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dynamic-sitemap' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dynamic.sitemap',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dynamic-sitemap-pages' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dynamic.sitemap.pages',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dynamic-sitemap-users' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dynamic.sitemap.users',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dynamic-sitemap-items' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dynamic.sitemap.items',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/seo-status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'seo.status',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/robots.txt' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'robots.txt',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/sitemap.xml' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'sitemap.custom',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/seo/sitemap-static.xml' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'sitemap.static.redirect',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/seo/sitemap-creators.xml' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'sitemap.creators.redirect',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/seo/sitemap-wishlists.xml' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'sitemap.wishlists.redirect',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/seo/clear-cache' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'seo.clear.cache',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/404' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'error.404',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/ping' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'ping',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/health' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'health.check',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/health/detailed' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'health.detailed',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug-wish-creation' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::fGQ6JZJTBk8apbPn',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug-wish-creation-test' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::XQFmPpM1Mp3jP5QY',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug-wish-no-middleware' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::zy7cpIqhWbAYsheP',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/founder/bonuses' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonuses.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/founder/bonuses/data' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonuses.data',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/founder/bonus-settings' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonus-settings.get',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonus-settings.update',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/founder/bonus-settings-page' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonus-settings.page',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/founder/bonuses/trigger-qualification-check' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonuses.trigger-qualification',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/tasks' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.tasks.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/feature-suggestions' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.feature-suggestions.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/system-diagnostics' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.system-diagnostics.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/admin/system-diagnostics/run' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.system-diagnostics.run',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug-sentry' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::XPu94GHKadLHv2Tk',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/register' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'register',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'generated::aezy97WviSnuT0BA',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/login' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'login',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/verify/login' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'login-user',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/verify-2fa' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'verify2FA',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/verify-user' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'verifyUser',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/forgot-password' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'password.email',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'password.request',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/reset-password' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'password.store',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/update-2fa-key' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::GLKqRH0fZvGYWtJ7',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug/webauthn-credentials' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::tqUI7gaIZVPjBeG4',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/debug-webauthn-credential' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::zVfauzaa2RmIVGDZ',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webauthn/check' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.check',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webauthn/login/options' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.login.options',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webauthn/login/options-userless' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.login.userless.options',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webauthn/login' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.login',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webauthn/register/options' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.register.options',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/webauthn/register' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.register',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/identity/verify' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.identity.verify',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/discover/creators/categories' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'allcreators_categories',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/logout' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'logout',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/verification' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'verification.notice',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/email/send-verification-email' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'verification.email',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/save_wish_item' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'save_wish_item',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/bill/save' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill.save',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/membership/save' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.save',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/membership/dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.dashboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/membership/graph' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.graph',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop/add' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'add-shop',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop/add/save-category' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.save-category',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/post/save' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.save',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/user/save-category' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'save-category',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/save_social_links' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'save_social_links',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/authorize' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/mor-consent' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.mor-consent.store',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/response' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.return',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/login' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.login',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/enable_card_payments' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.enable.card.payments',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/upgrade-express-account' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.upgrade.account',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/gifter-card-verification' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter.card.verification',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/confirm-password' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::iOnq1WXuEXVf0sG6',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/password' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'password.update',
          ),
          1 => NULL,
          2 => 
          array (
            'PUT' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/edit-profile' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'edit-profile',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/notification-switch' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'notification-switch',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/setup/multi-step-verification' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'account.2fa',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/account' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'account',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/refer-and-earn' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'refer-and-earn',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/refer-and-earn/create-link' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'create-referral-link',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/refer-and-earn/redeem' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'referral.redeem',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/auto-tweet-setting' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'auto-tweet-setting',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/unlink-twitter' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'unlink-twitter',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/user-tips' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user-tips',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/bill-tracker' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill-tracker',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/membership-tracker' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.tracker',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop-tracker' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.tracker',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/subscribed' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'subscribed',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/twitter/init' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'x.init',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/twitter/authorize' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'x.handle',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/add-goal' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'add-goal',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/all-goals' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'all-goals',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/update/intro/video' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'save',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/intro/save' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'intro.save',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/intro/list' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'intro.list',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/intro/remove' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'intro.remove',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/deliveries/dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'deliveries.dashboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/deliveries/stats' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'deliveries.stats',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/mandatory-checkout' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'mandatory.checkout',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/activate-subscription' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'activate-subscription',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/dalle-image' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'dalle.image',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/upload-dalle-image' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'upload.dalle.image',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/identity-verification' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.identity.verification',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/update/move-wish' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'move-wish',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/earnings' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'earnings-page',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/piggy-bank-setting' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'piggy-bank-setting',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/get-notification' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'get-notification',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/mark-as-read' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'mark-as-read',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/delete-all-notifications' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'delete-all-notifications',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/refresh' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.refresh',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/history' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.history',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/profile' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.profile.update',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/export/csv' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.export.csv',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/statement' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.statement',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/certificate' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.certificate',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/financial/expenses' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.expenses.index',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'financial.expenses.store',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/earnings/graph-data' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'graph-data',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop/orders-list' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'orders-list',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/create-applicant' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::QzoexCC9VVgPU4Uj',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/generate-verification-link' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::HROljq29ekrDQ7qf',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/generate-backup-code' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::7J9RbeOtJFkd4grs',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/show-2fa-qr' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::IxEG40wPteXX6epU',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/switch-2fa' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::LXLP3YcvPg96JVhp',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/verification-2fa' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::gj3sgwUGWKITOEqB',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/report-content' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'report-content',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/history' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'support.history.page',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/history-feed' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'transactions.feed',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/redirecting' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'redirecting',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator-store-address' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.store.address',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/get-creator-address' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'get.creator.address',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/create-creator-product' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'create.creator.product',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/create-cart' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'create.cart',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/handle-rye-product-payment' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'handle.rye.product.payment',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/store-product-order-details' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'store.product.order.details',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/users' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'users',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/send-surprize' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'send-surprize',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/update-profile-lock-status' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'update.profile.lock.status',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/user-follow-unfollow' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.follow.unfollow',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/send-pwa-to-follower' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'send.pwa.to.follower',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/send-automatically-follow-request-to-all' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'send.automatically.follow.request.to.all',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop/shipping-profiles' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.shipping-profiles',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/shop/shipping-profile/save' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.shipping-profile.save',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/get-cart-details' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'get.cart.details',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/authenticated-cart' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'authenticated-cart',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/cart' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'cart',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/how-it-works' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'how-it-works',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/terms-and-conditions' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'terms-and-conditions',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator-agreement' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator-agreement',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/supporter-terms' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'supporter-terms',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/creator-supporter-contract' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator-supporter-contract',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/mor-agreement' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'mor-agreement',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/reserves-and-payments-policy' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'reserves-and-payments-policy',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/paid-tasks-terms' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'paid-tasks-terms',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/return-policy' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'return-policy',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/us-addendum' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'us-addendum',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/copyright-policy' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'copyright-policy',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/accept-terms' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'accept-terms',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/promotion-terms' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'promotion-terms',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/leaderboard/star/lists' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'leaderboard.stars',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/largest/gifts/alltime' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'largest.gifts.alltime',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/top-supporters/frequency' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top-supporters-frequency',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/leaderboard/platform-analytics' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'leaderboard.platform-analytics',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/leaderboard/growth-trends' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'leaderboard.growth-trends',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/leaderboard/category-leaders' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'leaderboard.category-leaders',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/leaderboard/vip-supporters' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'leaderboard.vip-supporters',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/test' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test-intercom-diagnostic' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'intercom.diagnostic',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/problem-solving' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'problem-solving',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/twitter-token' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::pLOzTn3dAupQq4DQ',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/twitter/login' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::ZZa938D0KtICofbn',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/founder/bonus' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'founder.bonus',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/founder/data' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'founder.data',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/founder/leaderboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'founder.leaderboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/founder-program' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'founder.program',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/founder/qualify-winners' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'founder.qualify-winners',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/founder/settle-payouts' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'founder.settle-payouts',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/task/dashboard' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.dashboard',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/task/create' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.create',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/task' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.store',
          ),
          1 => NULL,
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/stripe/manual/payout' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe-payout',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/force-error/error/file' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::T9cy89SZLs5rTqfQ',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      '/test/scheduler/is/running' => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::c8aQE3gkCrYFJwEL',
          ),
          1 => NULL,
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
    ),
    2 => 
    array (
      0 => '{^(?|/a(?|pi/(?|pro(?|ducts/([^/]++)(*:38)|file/([^/]++)/posts(*:64))|remove\\-from\\-cart/([^/]++)(?:/([^/]++))?(*:113)|deliverables/([^/]++)(?|(*:145)|/certificate/download(*:174))|admin/risk/(?|creators/([^/]++)/(?|disputes(*:226)|reserves(*:242))|recalculate/([^/]++)(*:271)))|d(?|min/(?|emulate\\-login/([^/]++)(*:315)|f(?|ounder/bonuses/([^/]++)/(?|reject(*:360)|approve(*:375))|eature\\-suggestions/([^/]++)/status(*:419))|tasks/([^/]++)/resolve(*:450))|d\\-to\\-cart/([^/]++)/([^/]++)/([^/]++)(?:/([^/]++))?(*:511))|nonymous\\-cart/([^/]++)(*:543))|/m(?|a(?|gicbell(?|(?:/(.*))?(*:581)|/(?|user\\-key(*:602)|send\\-notification(*:628)))|rk\\-complete\\-goal/([^/]++)(*:665))|embership/(?|edit/([^/]++)(*:700)|remove/([^/]++)(*:723)|checkout/([^/]++)(?:/([^/]++))?(*:762)|handle/([^/]++)(?:/([^/]++))?(*:799)))|/d(?|e(?|bug\\-subscription/([^/]++)(*:844)|l(?|iverable/access/([^/]++)(*:880)|ete\\-(?|wish\\-item/([^/]++)(*:915)|c(?|ategory/([^/]++)(*:943)|reator\\-products/([^/]++)(*:976))|stripe\\-account/([^/]++)(*:1009))))|iscover(?|/(?|wishes/([^/]++)/([^/]++)/([^/]++)(*:1068)|creators/([^/]++)/([^/]++)(*:1103))|(?:/([^/]++)(?:/([^/]++))?)?(*:1141)))|/s(?|eed/([^/]++)(*:1169)|u(?|bscriptions/([^/]++)(?|/cancel(*:1212)|(*:1221))|pport(?|/([^/]++)/([^/]++)(*:1257)|\\-story/([^/]++)/([^/]++)(?|(*:1294)|/re(?|act(*:1312)|ply(*:1324))))|ccess\\-checkout/([^/]++)(*:1360))|hop/(?|u(?|pdate/([^/]++)(*:1395)|ser_shop_category/([^/]++)(*:1430))|de(?|lete/([^/]++)(*:1458)|activate/([^/]++)(*:1484))|list/([^/]++)(*:1507)|item/([^/]++)/([^/]++)(?:/([^/]++))?(*:1552)|buy/([^/]++)(*:1573)|answer\\-to\\-payment/([^/]++)(*:1610)|s(?|uccess\\-payment/([^/]++)(*:1647)|hipping\\-pr(?|ice/([^/]++)(*:1682)|ofile/([^/]++)(*:1705)))|cancel\\-payment/([^/]++)(*:1740)|fulfillment/([^/]++)(*:1769))|tripe/connect\\-init(?:/([^/]++)(?:/([^/]++))?)?(*:1826)|canning/check\\-adult\\-content/([^/]++)(*:1873)|ay\\-thankyou/([^/]++)(*:1903)|ociallinks/([^/]++)(*:1931))|/c(?|reat(?|e\\-(?|product/([^/]++)(*:1975)|checkout\\-session/([^/]++)(?:/([^/]++))?(*:2024))|or/(?|dispute(?|\\-packs/([^/]++)/([^/]++)(*:2075)|s/([^/]++)(?|(*:2097)|/submit(*:2113)))|security/unblock\\-user/([^/]++)(*:2155)))|h(?|eck\\-(?|c(?|oupon\\-code/([^/]++)(*:2202)|art\\-exist/([^/]++)(*:2230))|referral\\-code/([^/]++)(*:2263)|username/([^/]++)(*:2289))|ange\\-password/([^/]++)(*:2322))|urrency/([^/]++)(*:2348)|a(?|r(?|d\\-verification\\-(?|success/([^/]++)(*:2401)|failed/([^/]++)(*:2425))|t\\-update\\-quantity/([^/]++)/([^/]++)(*:2472))|ncel\\-(?|subs(?|cription/([^/]++)(*:2515)|/([^/]++)(*:2533))|checkout/([^/]++)(*:2560)))|lear\\-cart/([^/]++)/([^/]++)(*:2599)|o(?|unter/([^/]++)(*:2626)|mments/([^/]++)(*:2650)))|/t(?|est/(?|stripe/checkout\\-callback(?:/([^/]++))?(*:2712)|rates(?:/([^/]++))?(*:2740)|items(?:/([^/]++))?(*:2768))|witter/share/([^/]++)/([^/]++)(*:2808)|ip\\-jar/(?|pay/([^/]++)(*:2840)|handle/([^/]++)(?:/([^/]++))?(*:2878))|ask/(?|([^/]++)/(?|purchase(*:2915)|success(*:2931)|download(*:2948))|order/([^/]++)(*:2972)|purchase/([^/]++)/(?|upload(*:3008)|review(*:3023))|([^/]++)(?|/(?|edit(*:3052)|update(*:3067)|purchase(*:3084))|(*:3094))))|/f(?|orgot\\-password/([^/]++)(*:3135)|i(?|nancial/(?|dashboard(?:/([^/]++))?(*:3182)|e(?|xpenses/([^/]++)(?|(*:3214))|vidence\\-pack/([^/]++)(*:3246)))|les/([^/]++)(*:3269)|rst\\-three\\-leaderboard(?:/([^/]++))?(*:3315)))|/r(?|e(?|set\\-password/([^/]++)(*:3357)|ad\\-status/([^/]++)/([^/]++)(*:3394)|move\\-cart/([^/]++)(*:3422)|cent\\-gifters(?:/([^/]++))?(*:3458))|ye\\-(?|success\\-payment/([^/]++)(*:3500)|cancel\\-payment/([^/]++)(*:3533)))|/verify\\-token/([^/]++)(*:3567)|/w(?|ebauthn/delete(?:/([^/]++))?(*:3609)|ish\\-subscribe/checkout/([^/]++)(?:/([^/]++))?(*:3664))|/u(?|pdate(?|_wish_item/([^/]++)(*:3706)|\\-vat/([^/]++)(*:3729))|ser/(?|tip/goal(?:/([^/]++))?(*:3768)|([^/]++)(*:3785)|category/([^/]++)(*:3811)))|/bill/(?|edit/([^/]++)(*:3844)|remove/([^/]++)(*:3868)|checkout/([^/]++)(?:/([^/]++))?(*:3908)|handle/([^/]++)(?:/([^/]++))?(*:3946))|/p(?|ost/(?|edit/([^/]++)(*:3981)|delete/([^/]++)(*:4005)|like/([^/]++)(*:4027)|comment(?|/([^/]++)(*:4055)|\\-(?|reply/([^/]++)(*:4083)|approve/([^/]++)(*:4108)|delete/([^/]++)(*:4132)))|reply\\-(?|approve/([^/]++)(*:4169)|delete/([^/]++)(*:4193)))|in\\-item/([^/]++)(*:4221))|/e(?|dit\\-category/([^/]++)(*:4258)|arnings/(?|all\\-data(?:/([^/]++))?(*:4301)|top\\-(?|wishes(?:/([^/]++))?(*:4338)|s(?|ubscription(?:/([^/]++))?(*:4376)|hop(?:/([^/]++))?(*:4402))|p(?|aid\\-task(?:/([^/]++))?(*:4439)|iggy\\-bank(?:/([^/]++))?(*:4472))|bill(?:/([^/]++))?(*:4500))))|/handle/([^/]++)/([^/]++)(*:4537)|/g(?|ift(?|er\\-(?|wish\\-items/([^/]++)(*:4584)|subs(?|/([^/]++)(*:4609)|criptions/([^/]++)(*:4636))|t(?|ips/([^/]++)(*:4662)|hanks\\-message/([^/]++)(*:4694))|access\\-posts/([^/]++)(*:4726)|me(?|mberships/([^/]++)(*:4758)|dias/([^/]++)(*:4780))|content/([^/]++)(*:4806)|bills/([^/]++)(*:4829))|\\-items/([^/]++)(*:4855))|et_category_data/([^/]++)/([^/]++)(*:4899))|/leaderboard(?:/([^/]++))?(*:4935)|/items/([^/]++)(?:/([^/]++))?(*:4973)|/([^/]++)(?|/wish/([^/]++)(*:5008)|(?:/([^/]++))?(*:5031))|/wish/(?|checkout/([^/]++)(?:/([^/]++))?(*:5081)|handle/([^/]++)/([^/]++)(*:5114))|/payment/thankyou/([^/]++)(*:5150)|/membership/handle/([^/]++)/([^/]++)(*:5195)|/bill/handle/([^/]++)/([^/]++)(*:5234)|/image/dalle(*:5255)|/remove\\-from\\-cart/([^/]++)(?:/([^/]++))?(*:5306)|/de(?|lete\\-connected\\-account/([^/]++)(*:5354)|bug\\-(?|middleware\\-test(*:5387)|intercom(*:5404)))|/stripe/(?|migrate\\-account(?:/([^/]++))?(*:5456)|check\\-migration(?:/([^/]++))?(*:5495))|/test\\-(?|date/(?|subscription/([^/]++)(*:5544)|current(*:5560)|october\\-(?|3(*:5582)|4(*:5592)))|subscription/(?|my\\-status(*:5629)|user/([^/]++)(*:5651)|validate\\-payment(*:5677)|creators\\-needing\\-warnings(*:5713))|intercom(*:5731))|/_preview/pending\\-approval(*:5768)|/api/user\\-country(*:5795))/?$}sDu',
    ),
    3 => 
    array (
      38 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::rQBk0H8Hm3jJrcCQ',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'PUT' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      64 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.profile.posts',
          ),
          1 => 
          array (
            0 => 'user',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      113 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.remove-from-cart',
            'device_id' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'device_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      145 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.deliverables.show',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      174 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.deliverables.certificate',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      226 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::ru0R3ynnLbNiKkaz',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      242 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::3o4fU9884zUXEZ7m',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      271 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::RLfZeedum1M7mJ2t',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      315 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.emulate.login',
          ),
          1 => 
          array (
            0 => 'user',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      360 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonuses.reject',
          ),
          1 => 
          array (
            0 => 'bonus',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      375 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.founder/bonuses.approve',
          ),
          1 => 
          array (
            0 => 'bonus',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      419 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.feature-suggestions.update-status',
          ),
          1 => 
          array (
            0 => 'suggestion',
          ),
          2 => 
          array (
            'PATCH' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      450 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'admin.tasks.resolve',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      511 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'add-to-cart',
            'amount' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'device_id',
            2 => 'sub',
            3 => 'amount',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      543 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'anonymous-cart',
          ),
          1 => 
          array (
            0 => 'deviceId',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      581 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::qRwkwYcDkSFzinFv',
            'path' => NULL,
          ),
          1 => 
          array (
            0 => 'path',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'PUT' => 2,
            'PATCH' => 3,
            'DELETE' => 4,
            'OPTIONS' => 5,
            'HEAD' => 6,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      602 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::O4pBSUnYvp6yKy8U',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      628 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::kthD3ueHsFjqhNL2',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      665 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'mark-goal',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      700 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.edit',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      723 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.remove',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      762 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.checkout',
            'reccure' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'reccure',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      799 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.handle.auth',
            'status' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      844 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::AESTepjXXdgxfi07',
          ),
          1 => 
          array (
            0 => 'userId',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      880 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'deliverable.access',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      915 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'delete_wish_item',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      943 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'delete-category',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      976 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'delete.creator.products',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1009 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'deleteStripeAccount',
          ),
          1 => 
          array (
            0 => 'accountid',
          ),
          2 => 
          array (
            'GET' => 0,
            'DELETE' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1068 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'discover_wish',
          ),
          1 => 
          array (
            0 => 'order',
            1 => 'type',
            2 => 'price',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1103 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'discover_creators',
          ),
          1 => 
          array (
            0 => 'order',
            1 => 'gender',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1141 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'discover',
            'type' => NULL,
            'category' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
            1 => 'category',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1169 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::wVkbqXzdh2u0YIWw',
          ),
          1 => 
          array (
            0 => 'seeder',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1212 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'subscriptions.cancel',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      1221 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'subscriptions.show',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1257 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'support.story.page',
          ),
          1 => 
          array (
            0 => 'creator',
            1 => 'gifter',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1294 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'support.story',
          ),
          1 => 
          array (
            0 => 'creator',
            1 => 'gifter',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1312 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'support.story.react',
          ),
          1 => 
          array (
            0 => 'creator',
            1 => 'gifter',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      1324 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'support.story.reply',
          ),
          1 => 
          array (
            0 => 'creator',
            1 => 'gifter',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      1360 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'checkout.success',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1395 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'update-shop',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1430 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.shop.category',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1458 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'delete-shop',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1484 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'deactivate-shop',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1507 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop-list',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1552 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'single-shop-list',
            'session_id' => NULL,
          ),
          1 => 
          array (
            0 => 'slug',
            1 => 'uuid',
            2 => 'session_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1573 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'buy-shop-item',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1610 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'answerPayment',
          ),
          1 => 
          array (
            0 => 'payment_id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1647 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.success-payment',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1682 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.shipping-price',
          ),
          1 => 
          array (
            0 => 'shop_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1705 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.shipping-profile.delete',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'DELETE' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1740 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.cancel-payment',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1769 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'shop.fulfillment.update',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1826 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.connect',
            'country' => NULL,
            'currency' => NULL,
          ),
          1 => 
          array (
            0 => 'country',
            1 => 'currency',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1873 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'check-adult-content',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1903 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'say-thankyou',
          ),
          1 => 
          array (
            0 => 'payment_id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1931 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.sociallinks',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      1975 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'create.product',
          ),
          1 => 
          array (
            0 => 'price',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2024 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'create.checkout',
            'user_id_or_device' => NULL,
          ),
          1 => 
          array (
            0 => 'creator_id',
            1 => 'user_id_or_device',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2075 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.dispute-pack.download',
          ),
          1 => 
          array (
            0 => 'disputeId',
            1 => 'fileName',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2097 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.disputes.show',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2113 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.disputes.submit',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      2155 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'creator.security.unblock-user',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'DELETE' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2202 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'checkCouponCode',
          ),
          1 => 
          array (
            0 => 'code',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2230 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'check.cart.exist',
          ),
          1 => 
          array (
            0 => 'creator_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2263 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::uhZcvqt9RnADT1qU',
          ),
          1 => 
          array (
            0 => 'code',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2289 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'username.check',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2322 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'changePassword',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2348 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'change.currency',
          ),
          1 => 
          array (
            0 => 'c',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2401 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'card.verification.success',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2425 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'card.verification.failed',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2472 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'cart.updatequantity',
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'quantity',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2515 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'cancel-subscription',
          ),
          1 => 
          array (
            0 => 'subscription_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2533 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'cancel-subs',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2560 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'checkout.cancel',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2599 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'clear-cart',
          ),
          1 => 
          array (
            0 => 'device_id',
            1 => 'ownerid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2626 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'counter',
          ),
          1 => 
          array (
            0 => 'deviceid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2650 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.posts.comments',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2712 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.stripe.callback',
            'status' => NULL,
          ),
          1 => 
          array (
            0 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2740 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::MQAebegIy2d3D6FP',
            'c' => NULL,
          ),
          1 => 
          array (
            0 => 'c',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2768 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.generated::FGEh2boK0un8hpB1',
            'c' => NULL,
          ),
          1 => 
          array (
            0 => 'c',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2808 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'x.share',
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2840 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'tip-jar.pay',
          ),
          1 => 
          array (
            0 => 'creator_uid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2878 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'tip-jar.handle',
            'status' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      2915 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.purchase',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      2931 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.success',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      2948 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.download',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      2972 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.order',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3008 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.upload-proof',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      3023 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.review-proof',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      3052 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.edit',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      3067 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.update',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      3084 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.purchase.redirect',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      3094 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'task.show',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3135 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::wWHpU0WCZKrWWXIu',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3182 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.dashboard',
            'tab' => NULL,
          ),
          1 => 
          array (
            0 => 'tab',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3214 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.expenses.update',
          ),
          1 => 
          array (
            0 => 'expense',
          ),
          2 => 
          array (
            'PUT' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
        1 => 
        array (
          0 => 
          array (
            '_route' => 'financial.expenses.destroy',
          ),
          1 => 
          array (
            0 => 'expense',
          ),
          2 => 
          array (
            'DELETE' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3246 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'financial.evidence-pack',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3269 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::XVcfwzD0CAiuBUIA',
          ),
          1 => 
          array (
            0 => 'filename',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3315 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'first-three-wishes',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3357 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'password.reset',
          ),
          1 => 
          array (
            0 => 'token',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3394 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'read-status',
          ),
          1 => 
          array (
            0 => 'payment_id',
            1 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3422 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'remove.cart',
          ),
          1 => 
          array (
            0 => 'cart_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3458 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'largest-gifts',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3500 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'rye.success.payment',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3533 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'rye.cancel.payment',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3567 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::HmlL3GJYN51pzjKi',
          ),
          1 => 
          array (
            0 => 'token',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3609 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'webauthn.delete',
            'id' => NULL,
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'DELETE' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3664 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'wish.subscribe.checkout.auth',
            'reccure' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'reccure',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3706 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'update_wish_item',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3729 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'updateVat',
          ),
          1 => 
          array (
            0 => 'percent',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3768 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.goal',
            'username' => NULL,
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3785 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::X8ofJBgRuH9mdiPi',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3811 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.category',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3844 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill.edit',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3868 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill.remove',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3908 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill.checkout',
            'reccure' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'reccure',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3946 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill.handle.auth',
            'status' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      3981 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.edit',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4005 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.delete',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4027 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.like',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4055 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.comment',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4083 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.comment-reply',
          ),
          1 => 
          array (
            0 => 'comment_uid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4108 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.comment-approve',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4132 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.comment-delete',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4169 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.reply-approve',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4193 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'post.reply-delete',
          ),
          1 => 
          array (
            0 => 'uuid',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4221 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'pin-item',
          ),
          1 => 
          array (
            0 => 'wish_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4258 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'edit-category',
          ),
          1 => 
          array (
            0 => 'id',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4301 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'earnings',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4338 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top-wishes',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4376 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top-subscription',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4402 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top-shop',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4439 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top.paid.task',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4472 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top-piggy-bank',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4500 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'top-bill',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4537 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'mandatory.handle',
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4584 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-items',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4609 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-subscriptions',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4636 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-subscription',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4662 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-tips',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4694 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-thanks-message',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4726 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-access-posts',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4758 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-memberships',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4780 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-media',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4806 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-content',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4829 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gifter-bills',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4855 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'gift.items',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4899 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'get_category_data',
          ),
          1 => 
          array (
            0 => 'category',
            1 => 'user_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4935 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'leaderboard',
            'type' => NULL,
          ),
          1 => 
          array (
            0 => 'type',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      4973 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.items',
            'category_id' => NULL,
          ),
          1 => 
          array (
            0 => 'username',
            1 => 'category_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5008 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'wish.show',
          ),
          1 => 
          array (
            0 => 'username',
            1 => 'id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5031 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'user.show',
            'page' => NULL,
          ),
          1 => 
          array (
            0 => 'username',
            1 => 'page',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5081 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'wish.subscribe.checkout',
            'reccure' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'reccure',
          ),
          2 => 
          array (
            'GET' => 0,
            'POST' => 1,
            'HEAD' => 2,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5114 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'wish.subscribe.handle',
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5150 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'thank-you',
          ),
          1 => 
          array (
            0 => 'username',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5195 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'membership.handle',
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5234 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'bill.handle',
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'status',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5255 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'image-dalle',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5306 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'remove-from-cart',
            'device_id' => NULL,
          ),
          1 => 
          array (
            0 => 'uuid',
            1 => 'device_id',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5354 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::uZ5yZVFwvyLC4vYj',
          ),
          1 => 
          array (
            0 => 'accountId',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5387 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::ePQzkMRMCuxCgdZJ',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5404 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'debug.intercom',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5456 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.migrate-account',
            'userId' => NULL,
          ),
          1 => 
          array (
            0 => 'userId',
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5495 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'stripe.check-migration',
            'userId' => NULL,
          ),
          1 => 
          array (
            0 => 'userId',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5544 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::BudWXhAi1dyJB2tS',
          ),
          1 => 
          array (
            0 => 'date',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5560 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::Xfaq2oI2mh5KcUfR',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5582 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::KkPwX6JNWU2qlH78',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5592 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::3We6vLoqnPqYC4ng',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5629 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::k6azhEURUIj552OP',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5651 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::SfMUxhhDmfgGpz2V',
          ),
          1 => 
          array (
            0 => 'userId',
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => true,
          6 => NULL,
        ),
      ),
      5677 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::99IC2r7dNgoY2aVd',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'POST' => 0,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5713 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'generated::9S1HpskHUhzyxhNN',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5731 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'test.intercom',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5768 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'preview.pending-approval',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
      ),
      5795 => 
      array (
        0 => 
        array (
          0 => 
          array (
            '_route' => 'api.user-country',
          ),
          1 => 
          array (
          ),
          2 => 
          array (
            'GET' => 0,
            'HEAD' => 1,
          ),
          3 => NULL,
          4 => false,
          5 => false,
          6 => NULL,
        ),
        1 => 
        array (
          0 => NULL,
          1 => NULL,
          2 => NULL,
          3 => NULL,
          4 => false,
          5 => false,
          6 => 0,
        ),
      ),
    ),
    4 => NULL,
  ),
  'attributes' => 
  array (
    'sanctum.csrf-cookie' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'sanctum/csrf-cookie',
      'action' => 
      array (
        'uses' => 'Laravel\\Sanctum\\Http\\Controllers\\CsrfCookieController@show',
        'controller' => 'Laravel\\Sanctum\\Http\\Controllers\\CsrfCookieController@show',
        'namespace' => NULL,
        'prefix' => 'sanctum',
        'where' => 
        array (
        ),
        'middleware' => 
        array (
          0 => 'web',
        ),
        'as' => 'sanctum.csrf-cookie',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::ER7jwPlT7jiJLq0n' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'vapor/signed-storage-url',
      'action' => 
      array (
        'uses' => 'Laravel\\Vapor\\Contracts\\SignedStorageUrlController@store',
        'controller' => 'Laravel\\Vapor\\Contracts\\SignedStorageUrlController@store',
        'middleware' => 
        array (
          0 => 'web',
        ),
        'as' => 'generated::ER7jwPlT7jiJLq0n',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'manifest.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'manifest.json',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:304:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(\\resource_path("proxy/manifest.json"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "text/json",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008a30000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'manifest.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'laravelpwa.' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'offline',
      'action' => 
      array (
        'middleware' => 'web',
        'uses' => 'LaravelPWA\\Http\\Controllers\\LaravelPWAController@offline',
        'controller' => 'LaravelPWA\\Http\\Controllers\\LaravelPWAController@offline',
        'as' => 'laravelpwa.',
        'namespace' => 'LaravelPWA\\Http\\Controllers',
        'prefix' => '',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'ignition.healthCheck' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => '_ignition/health-check',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'Spatie\\LaravelIgnition\\Http\\Middleware\\RunnableSolutionsEnabled',
        ),
        'uses' => 'Spatie\\LaravelIgnition\\Http\\Controllers\\HealthCheckController@__invoke',
        'controller' => 'Spatie\\LaravelIgnition\\Http\\Controllers\\HealthCheckController',
        'as' => 'ignition.healthCheck',
        'namespace' => NULL,
        'prefix' => '_ignition',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'ignition.executeSolution' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => '_ignition/execute-solution',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'Spatie\\LaravelIgnition\\Http\\Middleware\\RunnableSolutionsEnabled',
        ),
        'uses' => 'Spatie\\LaravelIgnition\\Http\\Controllers\\ExecuteSolutionController@__invoke',
        'controller' => 'Spatie\\LaravelIgnition\\Http\\Controllers\\ExecuteSolutionController',
        'as' => 'ignition.executeSolution',
        'namespace' => NULL,
        'prefix' => '_ignition',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'ignition.updateConfig' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => '_ignition/update-config',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'Spatie\\LaravelIgnition\\Http\\Middleware\\RunnableSolutionsEnabled',
        ),
        'uses' => 'Spatie\\LaravelIgnition\\Http\\Controllers\\UpdateConfigController@__invoke',
        'controller' => 'Spatie\\LaravelIgnition\\Http\\Controllers\\UpdateConfigController',
        'as' => 'ignition.updateConfig',
        'namespace' => NULL,
        'prefix' => '_ignition',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::w56aa3xqsXW3XhYm' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/user',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:77:"function (\\Illuminate\\Http\\Request $request) {
    return $request->user();
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008050000000000000000";}}',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::w56aa3xqsXW3XhYm',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::QQXw1lZTeYlLLGF2' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/products',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\ProductController@index',
        'controller' => 'App\\Http\\Controllers\\Api\\ProductController@index',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::QQXw1lZTeYlLLGF2',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::D08L5Z4U3BbYC66C' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/create-product',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\ProductController@store',
        'controller' => 'App\\Http\\Controllers\\Api\\ProductController@store',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::D08L5Z4U3BbYC66C',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::rQBk0H8Hm3jJrcCQ' => 
    array (
      'methods' => 
      array (
        0 => 'PUT',
      ),
      'uri' => 'api/products/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\ProductController@update',
        'controller' => 'App\\Http\\Controllers\\Api\\ProductController@update',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::rQBk0H8Hm3jJrcCQ',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.remove-from-cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/remove-from-cart/{uuid}/{device_id?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@removeSurpriseFromCart',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@removeSurpriseFromCart',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'api.remove-from-cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::5d3FIbJXg8lcjAIv' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/analytics/web-vitals',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\WebVitalsController@store',
        'controller' => 'App\\Http\\Controllers\\Api\\WebVitalsController@store',
        'namespace' => NULL,
        'prefix' => 'api/analytics',
        'where' => 
        array (
        ),
        'as' => 'generated::5d3FIbJXg8lcjAIv',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::oIbhmyFsdS5QARtu' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/analytics/web-vitals',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\WebVitalsController@index',
        'controller' => 'App\\Http\\Controllers\\Api\\WebVitalsController@index',
        'namespace' => NULL,
        'prefix' => 'api/analytics',
        'where' => 
        array (
        ),
        'as' => 'generated::oIbhmyFsdS5QARtu',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::fYtAVCzjZikzIT1a' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/analytics/web-vitals/trends',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\WebVitalsController@trends',
        'controller' => 'App\\Http\\Controllers\\Api\\WebVitalsController@trends',
        'namespace' => NULL,
        'prefix' => 'api/analytics',
        'where' => 
        array (
        ),
        'as' => 'generated::fYtAVCzjZikzIT1a',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::dSyLBrrwLwY4hxAS' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/alerts/performance',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:354:"function (\\Illuminate\\Http\\Request $request) {
    // This endpoint receives performance alerts from the frontend
    // and can forward them to external monitoring services
    \\Illuminate\\Support\\Facades\\Log::channel(\'performance\')->critical(\'Performance alert received\', $request->all());
    return \\response()->json([\'status\' => \'received\'], 200);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008090000000000000000";}}',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::dSyLBrrwLwY4hxAS',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::BY0beZ7KGUHV7NWg' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/founder/qualify-winners',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@qualifyWinners',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@qualifyWinners',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::BY0beZ7KGUHV7NWg',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.deliverables.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/deliverables',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\DeliverableController@index',
        'controller' => 'App\\Http\\Controllers\\Api\\DeliverableController@index',
        'namespace' => NULL,
        'prefix' => 'api/deliverables',
        'where' => 
        array (
        ),
        'as' => 'api.deliverables.index',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.deliverables.show' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/deliverables/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\DeliverableController@show',
        'controller' => 'App\\Http\\Controllers\\Api\\DeliverableController@show',
        'namespace' => NULL,
        'prefix' => 'api/deliverables',
        'where' => 
        array (
        ),
        'as' => 'api.deliverables.show',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.deliverables.certificate' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/deliverables/{uuid}/certificate/download',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\DeliverableController@downloadCertificate',
        'controller' => 'App\\Http\\Controllers\\Api\\DeliverableController@downloadCertificate',
        'namespace' => NULL,
        'prefix' => 'api/deliverables',
        'where' => 
        array (
        ),
        'as' => 'api.deliverables.certificate',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.profile.posts' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/profile/{user}/posts',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfilePostController@index',
        'controller' => 'App\\Http\\Controllers\\ProfilePostController@index',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'api.profile.posts',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::2mCM4kT8tADEEiuW' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/risk/evaluate',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\RiskController@evaluate',
        'controller' => 'App\\Http\\Controllers\\Api\\RiskController@evaluate',
        'namespace' => NULL,
        'prefix' => 'api/risk',
        'where' => 
        array (
        ),
        'as' => 'generated::2mCM4kT8tADEEiuW',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::MiX9rMuAjK0zZiIV' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/risk/step-up/verify',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\RiskController@verifyStepUp',
        'controller' => 'App\\Http\\Controllers\\Api\\RiskController@verifyStepUp',
        'namespace' => NULL,
        'prefix' => 'api/risk',
        'where' => 
        array (
        ),
        'as' => 'generated::MiX9rMuAjK0zZiIV',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::A6AJ4dUQZNwyGInc' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/risk/step-up/resend',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\RiskController@resendStepUpOtp',
        'controller' => 'App\\Http\\Controllers\\Api\\RiskController@resendStepUpOtp',
        'namespace' => NULL,
        'prefix' => 'api/risk',
        'where' => 
        array (
        ),
        'as' => 'generated::A6AJ4dUQZNwyGInc',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::Kfma8I5e64ZEwHfP' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/risk/step-up/verify-passkey',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\RiskController@verifyStepUpPasskey',
        'controller' => 'App\\Http\\Controllers\\Api\\RiskController@verifyStepUpPasskey',
        'namespace' => NULL,
        'prefix' => 'api/risk',
        'where' => 
        array (
        ),
        'as' => 'generated::Kfma8I5e64ZEwHfP',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::L57828k4lj1QIup5' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/risk/limits',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\RiskController@getEffectiveLimits',
        'controller' => 'App\\Http\\Controllers\\Api\\RiskController@getEffectiveLimits',
        'namespace' => NULL,
        'prefix' => 'api/risk',
        'where' => 
        array (
        ),
        'as' => 'generated::L57828k4lj1QIup5',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::bVp2Yfsrs9wgVSY6' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/payments/create-intent',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\RiskController@createPaymentIntent',
        'controller' => 'App\\Http\\Controllers\\Api\\RiskController@createPaymentIntent',
        'namespace' => NULL,
        'prefix' => 'api/payments',
        'where' => 
        array (
        ),
        'as' => 'generated::bVp2Yfsrs9wgVSY6',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::Egn47z9kN0gwTSom' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/internal/sync-financials',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\InternalSyncController@syncFinancials',
        'controller' => 'App\\Http\\Controllers\\Api\\InternalSyncController@syncFinancials',
        'namespace' => NULL,
        'prefix' => 'api',
        'where' => 
        array (
        ),
        'as' => 'generated::Egn47z9kN0gwTSom',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::S5ZVUasHIt8GLy8Y' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/admin/dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\DashboardController@index',
        'controller' => 'App\\Http\\Controllers\\Admin\\DashboardController@index',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::S5ZVUasHIt8GLy8Y',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::DnWbyRwe9YirjH7X' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/admin/export/audit-pack',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\AuditExportController@export',
        'controller' => 'App\\Http\\Controllers\\Admin\\AuditExportController@export',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::DnWbyRwe9YirjH7X',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::EeUjgLWnuEHpBEpv' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/admin/risk/override',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\RiskController@override',
        'controller' => 'App\\Http\\Controllers\\Admin\\RiskController@override',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::EeUjgLWnuEHpBEpv',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::O55qhoL5FMy15ukW' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/admin/risk/reset',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\RiskController@reset',
        'controller' => 'App\\Http\\Controllers\\Admin\\RiskController@reset',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::O55qhoL5FMy15ukW',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::ru0R3ynnLbNiKkaz' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/admin/risk/creators/{id}/disputes',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\RiskController@disputes',
        'controller' => 'App\\Http\\Controllers\\Admin\\RiskController@disputes',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::ru0R3ynnLbNiKkaz',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::3o4fU9884zUXEZ7m' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/admin/risk/creators/{id}/reserves',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\RiskController@reserves',
        'controller' => 'App\\Http\\Controllers\\Admin\\RiskController@reserves',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::3o4fU9884zUXEZ7m',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::RLfZeedum1M7mJ2t' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/admin/risk/recalculate/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\RiskController@recalculate',
        'controller' => 'App\\Http\\Controllers\\Admin\\RiskController@recalculate',
        'namespace' => NULL,
        'prefix' => 'api/admin',
        'where' => 
        array (
        ),
        'as' => 'generated::RLfZeedum1M7mJ2t',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::6yuReVyFcBDruoav' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/admin/payout/preview',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\PayoutController@preview',
        'controller' => 'App\\Http\\Controllers\\Admin\\PayoutController@preview',
        'namespace' => NULL,
        'prefix' => 'api/admin/payout',
        'where' => 
        array (
        ),
        'as' => 'generated::6yuReVyFcBDruoav',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::pXyVVev851sALODS' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/admin/payout/execute',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'api',
          1 => 'auth:sanctum',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\PayoutController@execute',
        'controller' => 'App\\Http\\Controllers\\Admin\\PayoutController@execute',
        'namespace' => NULL,
        'prefix' => 'api/admin/payout',
        'where' => 
        array (
        ),
        'as' => 'generated::pXyVVev851sALODS',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.emulate.login' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/emulate-login/{user}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\EmulationLoginController@login',
        'controller' => 'App\\Http\\Controllers\\Admin\\EmulationLoginController@login',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'admin.emulate.login',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.emulate.stop' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/emulate-stop',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\EmulationLoginController@stop',
        'controller' => 'App\\Http\\Controllers\\Admin\\EmulationLoginController@stop',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'admin.emulate.stop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::BHSoJ3NgAG698aj0' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug/cache-check',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:523:"function () {
    $key = \'debug_cache_test_\' . \\time();
    $value = \'working\';

    // Put in cache for 1 minute
    \\Illuminate\\Support\\Facades\\Cache::put($key, $value, 60);

    // Retrieve
    $retrieved = \\Illuminate\\Support\\Facades\\Cache::get($key);

    return \\response()->json([
        \'status\' => $retrieved === $value ? \'ok\' : \'failed\',
        \'driver\' => \\config(\'cache.default\'),
        \'timestamp\' => \\now()->toDateTimeString(),
        \'test_key\' => $key,
        \'retrieved_value\' => $retrieved
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008250000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::BHSoJ3NgAG698aj0',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::qB9zQpPaSFrq3200' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'csrf-cookie',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:55:"function () {
    return \\response()->noContent(204);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008290000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::qB9zQpPaSFrq3200',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::qRwkwYcDkSFzinFv' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'PUT',
        3 => 'PATCH',
        4 => 'DELETE',
        5 => 'OPTIONS',
        6 => 'HEAD',
      ),
      'uri' => 'magicbell/{path?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\MagicBellProxyController@__invoke',
        'controller' => 'App\\Http\\Controllers\\MagicBellProxyController',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::qRwkwYcDkSFzinFv',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
        'path' => '.*',
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'activity.logs' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'activity/logs',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorActivityController@logs',
        'controller' => 'App\\Http\\Controllers\\CreatorActivityController@logs',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'activity.logs',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::AESTepjXXdgxfi07' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-subscription/{userId}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1704:"function ($userId) {
        $user = \\App\\Models\\User::find($userId);
        if (!$user) {
            return \\response()->json([\'error\' => \'User not found\']);
        }

        $subscription = $user->creatorMonthlySubscription;

        return \\response()->json([
            \'user_id\' => $user->id,
            \'username\' => $user->username,
            \'role\' => $user->role,
            \'is_subscribed\' => $user->is_subscribed,
            \'created_at\' => $user->created_at,
            \'subscription_status_accessor\' => $user->subscription_status,
            \'has_monthly_charge_record\' => $subscription ? true: false,
            \'monthly_charge_data\' => $subscription ? [
                \'id\' => $subscription->id,
                \'status\' => $subscription->status,
                \'stripe_id\' => $subscription->stripe_id,
                \'current_start_trial_date\' => $subscription->current_start_trial_date,
                \'current_end_trial_date\' => $subscription->current_end_trial_date,
                \'current_start_subscription_date\' => $subscription->current_start_subscription_date,
                \'current_end_subscription_date\' => $subscription->current_end_subscription_date,
                \'created_at\' => $subscription->created_at,
            ] : null,
            \'trial_calculation\' => [
                \'user_created_at\' => $user->created_at,
                \'trial_end_date\' => \\Carbon\\Carbon::parse($user->created_at)->addDays(3),
                \'now\' => \\Carbon\\Carbon::now(),
                \'is_within_trial\' => \\Carbon\\Carbon::now()->lessThan(\\Carbon\\Carbon::parse($user->created_at)->addDays(3)),
            ],
            \'timestamp\' => \\now(),
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000082d0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::AESTepjXXdgxfi07',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'debug.cart.api' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-cart-api',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:729:"function () {
        $controller = \\app(\\App\\Http\\Controllers\\Auth\\WishitemController::class);
        $response = $controller->authenticatedCartItems();

        $authUser = \\Illuminate\\Support\\Facades\\Auth::user();
        return \\response()->json([
            \'timestamp\' => \\now(),
            \'auth_id\' => \\Illuminate\\Support\\Facades\\Auth::id(),
            \'auth_user\' => $authUser instanceof \\App\\Models\\User ? [
                \'id\' => $authUser->id,
                \'name\' => $authUser->name,
                \'email\' => $authUser->email,
            ] : null,
            \'cart_api_response\' => \\json_decode($response->getContent(), true),
            \'db_cart_count\' => \\App\\Models\\UserCart::count()
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000082f0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'debug.cart.api',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::JaaAFanYSRURzd1T' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'send-test-mail',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:312:"function () {
        \\Illuminate\\Support\\Facades\\Mail::raw(\'This is a test email. If you are seeing this, your mail configuration is working!\', function ($message) {
            $message->to(\'prem@futureprofilez.com\')
                ->subject(\'Test Email\');
        });
        return \'Test email sent!\';
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008310000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::JaaAFanYSRURzd1T',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::wVkbqXzdh2u0YIWw' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seed/{seeder}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:180:"function ($seeder) {
        \\Illuminate\\Support\\Facades\\Artisan::call("db:seed --class=$seeder");
        return \\response()->json([
            \'seed completed\'
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008330000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::wVkbqXzdh2u0YIWw',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'home' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => '/',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:2558:"function (\\App\\Services\\DiscoveryService $discoveryService) {
    $period = \\request()->query(\'top_earners_period\', \'\');
    $limit = (int) \\request()->query(\'top_earners_limit\', 9);

    // Use shared cache for both guests and authenticated users for public discovery data
    $trendingCreators = function() use ($discoveryService) {
        return \\Illuminate\\Support\\Facades\\Cache::remember(\'home_trending_creators_v2\', 900, function () use ($discoveryService) {
            return $discoveryService->getTrendingCreators();
        });
    };

    $newVerifiedCreators = function() use ($discoveryService) {
        return \\Illuminate\\Support\\Facades\\Cache::remember(\'home_new_verified_creators_v2\', 900, function () use ($discoveryService) {
            return $discoveryService->getNewVerifiedCreators();
        });
    };

    $topEarnersData = function() use ($discoveryService, $period, $limit) {
        $ttl = match ($period) {
            \'daily\' => 600,
            \'weekly\' => 1200,
            \'monthly\' => 1800,
            default => 1200,
        };
        return \\Illuminate\\Support\\Facades\\Cache::remember(\'home_top_earners_v2_\' . $period . \'_\' . $limit, $ttl, function () use ($discoveryService, $period, $limit) {
            return $discoveryService->getTopEarners($period, $limit);
        });
    };

    return \\Inertia\\Inertia::render(\'Welcome\', [
        \'canLogin\' => \\Illuminate\\Support\\Facades\\Route::has(\'login\'),
        \'canRegister\' => \\Illuminate\\Support\\Facades\\Route::has(\'register\'),
        \'laravelVersion\' => \\Illuminate\\Foundation\\Application::VERSION,
        \'phpVersion\' => PHP_VERSION,
        \'founderBonus\' => [
            \'minMonthlyEarnings\' => \\config(\'founder_bonus.bonus.min_monthly_earnings\'),
            \'bonusPercentage\' => \\config(\'founder_bonus.bonus.bonus_percentage\') * 100, // Convert to percentage
            \'maxBonusPerMonth\' => \\config(\'founder_bonus.bonus.max_bonus_per_month\'),
            \'maxFounderSeats\' => \\config(\'founder_bonus.limits.max_founder_seats\'),
            \'currencySymbol\' => \\config(\'founder_bonus.display.currency_symbol\'),
        ],
        // Use Inertia::lazy to allow the page to load instantly while data fetches in background
        \'trendingCreators\' => \\Inertia\\Inertia::lazy($trendingCreators),
        \'newVerifiedCreators\' => \\Inertia\\Inertia::lazy($newVerifiedCreators),
        \'topEarners\' => \\Inertia\\Inertia::lazy(fn() => $topEarnersData()[\'data\']),
        \'topEarnersLabel\' => \\Inertia\\Inertia::lazy(fn() => $topEarnersData()[\'label\']),
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008350000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'home',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'pride.landing' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'pride',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:67:"function () {
    return \\Inertia\\Inertia::render(\'Pride/Index\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008370000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'pride.landing',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membershipDashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership-dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:87:"function () {
    return \\Inertia\\Inertia::render(\'membership/Membership_dashboard\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008390000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'membershipDashboard',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'get.cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'get-cart',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:63:"function () {
    return \\Inertia\\Inertia::render(\'GetCart\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000083b0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'get.cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'analytics.search-click' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'analytics/search-click',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\AnalyticsController@searchClick',
        'controller' => 'App\\Http\\Controllers\\AnalyticsController@searchClick',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'analytics.search-click',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'feature-suggestion.store' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'feature-suggestion',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'throttle:5,1',
        ),
        'uses' => 'App\\Http\\Controllers\\FeatureSuggestionController@store',
        'controller' => 'App\\Http\\Controllers\\FeatureSuggestionController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'feature-suggestion.store',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.report.store' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/report-content',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'throttle:5,1',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\ReportController@store',
        'controller' => 'App\\Http\\Controllers\\Api\\ReportController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'api.report.store',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'rye.webhook' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'rye-webhook',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@handleWebhook',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@handleWebhook',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'rye.webhook',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.webhook.unified' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webhook/payment',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StripeWebhookController@handle',
        'controller' => 'App\\Http\\Controllers\\StripeWebhookController@handle',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe.webhook.unified',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'deliverable.access' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'deliverable/access/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\DeliveriesController@access',
        'controller' => 'App\\Http\\Controllers\\DeliveriesController@access',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'deliverable.access',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::EenbamHywAZ1YqjT' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'stripe/webhook',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StripeWebhookController@handle',
        'controller' => 'App\\Http\\Controllers\\StripeWebhookController@handle',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::EenbamHywAZ1YqjT',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'giftStore' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'giftstore',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:69:"function () {
    return \\Inertia\\Inertia::render(\'rye/GiftStore\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008440000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'giftStore',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creators' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creators',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:70:"function () {
    return \\Inertia\\Inertia::render(\'creators/Index\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008460000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creators',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creators.stripe-safe' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creators/stripe-safe',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:75:"function () {
    return \\Inertia\\Inertia::render(\'creators/StripeSafe\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008480000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creators.stripe-safe',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creators.keep-100' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creators/keep-100',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:72:"function () {
    return \\Inertia\\Inertia::render(\'creators/Keep100\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000084a0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creators.keep-100',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creators.features' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creators/features',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:73:"function () {
    return \\Inertia\\Inertia::render(\'creators/Features\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000084c0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creators.features',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creators.disputes' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creators/disputes',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:73:"function () {
    return \\Inertia\\Inertia::render(\'creators/Disputes\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000084e0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creators.disputes',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creators.founder-bonus' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creators/founder-bonus',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:77:"function () {
    return \\Inertia\\Inertia::render(\'creators/FounderBonus\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008500000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creators.founder-bonus',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::J6yMcezotjxFkE62' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'create-product-for-creator-and-gifter',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StripeWebhookController@CreateProductForCreatorAndGifter',
        'controller' => 'App\\Http\\Controllers\\StripeWebhookController@CreateProductForCreatorAndGifter',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::J6yMcezotjxFkE62',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'delete.all.products' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'delete-all-products',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@deleteAllProducts',
        'controller' => 'App\\Http\\Controllers\\TestController@deleteAllProducts',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'delete.all.products',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'archived.all.products' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'archived-all-products',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@archiveAllStripeProducts',
        'controller' => 'App\\Http\\Controllers\\TestController@archiveAllStripeProducts',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'archived.all.products',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::IVcwvmvACwCaWHWO' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'send-identity-verification-failed-emails',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@sendFailedVerificationEmails',
        'controller' => 'App\\Http\\Controllers\\TestController@sendFailedVerificationEmails',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::IVcwvmvACwCaWHWO',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'create.product' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'create-product/{price}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@makeProductId',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@makeProductId',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'create.product',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::epggOIFjSGVN96MX' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'migrate-covers',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1449:"function() {
    $users = \\App\\Models\\User::whereNull(\'cover\')
        ->orWhere(\'cover\', \'\')
        ->orWhere(\'cover\', \'like\', \'%wishlistbannerimg%\')
        ->orWhere(\'cover\', \'like\', \'%default%\')
        ->get();
        
    $creatorCovers = [
        \'0139dcd1-f9c5-47ac-b6f9-3baac6f48d06\',
        \'21de57a2-c786-4a5a-b7e4-2edcdb61fc42\',
        \'6aac4e1d-9af8-4ad2-9aee-a0d9d383dac2\',
        \'fcdb1692-d64d-4de8-b7af-5e0556cdf6e8\',
        \'40aaf556-fa59-4f8e-b482-e49726026499\',
        \'a2cad976-2480-4c77-baa3-cb5df3cdc0d6\',
        \'b81b3097-5c4c-4f48-aaf0-3687bc928a18\',
        \'32c130a9-37e6-4934-8d72-a83a5d8bdaa6\',
        \'e71ed424-f17a-47d9-b0e7-3e5eca4e51cb\',
        \'dc1021e2-41a4-4dfa-8379-b27fb7e3834e\',
        \'175e706f-ae6a-4920-a131-bf90502084f8\',
        \'c8011ca9-9b00-4f8f-b919-3cf837e3037c\',
        \'1ebf10dd-1891-4288-b461-5e3fcd3b43d3\',
        \'c3b7ff7a-719a-452a-ba8f-d074d916b395\',
        \'133b057f-f069-4ea4-82e4-ba9184d721cd\'
    ];

    $count = 0;
    foreach ($users as $user) {
        if ($user->role == 1) {
            $user->cover = $creatorCovers[\\array_rand($creatorCovers)];
        } else {
            $user->cover = \'dc1021e2-41a4-4dfa-8379-b27fb7e3834e\';
        }
        $user->cover_approved = 1;
        $user->save();
        $count++;
    }

    return \\response()->json([
        \'message\' => "Successfully updated covers for $count users.",
        \'updated_count\' => $count
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008570000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::epggOIFjSGVN96MX',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'checkCouponCode' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'check-coupon-code/{code}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@checkCouponCode',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@checkCouponCode',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'checkCouponCode',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'check.username' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'username-availablity',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@checkUsername',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@checkUsername',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'check.username',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'register.validate' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'register/validate',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@validateRegistration',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@validateRegistration',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'register.validate',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:171:"function () {
    // return Inertia::render(\'Dashboard\');
    return \\redirect()->route(\'user.show\', [\'username\' => \\Illuminate\\Support\\Facades\\Auth::user()->username]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000085c0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dashboard',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::1f90tRrd11ud6ZI5' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/creator/risk-status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\CreatorRiskController@getRiskStatus',
        'controller' => 'App\\Http\\Controllers\\Api\\CreatorRiskController@getRiskStatus',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::1f90tRrd11ud6ZI5',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'risk.test.panel' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'risk-test-panel',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:77:"function () {
        return \\Inertia\\Inertia::render(\'RiskTestPanel\');
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008610000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'risk.test.panel',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::DS74VGKE2unLnEtU' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/test/risk/on',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\TestRiskController@triggerRisk',
        'controller' => 'App\\Http\\Controllers\\Api\\TestRiskController@triggerRisk',
        'namespace' => NULL,
        'prefix' => '/api/test',
        'where' => 
        array (
        ),
        'as' => 'generated::DS74VGKE2unLnEtU',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::vFWrI2Qpz2VIBZau' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/test/risk/off',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\TestRiskController@clearRisk',
        'controller' => 'App\\Http\\Controllers\\Api\\TestRiskController@clearRisk',
        'namespace' => NULL,
        'prefix' => '/api/test',
        'where' => 
        array (
        ),
        'as' => 'generated::vFWrI2Qpz2VIBZau',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::QFVlh8nZqQIn7eCh' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/test/platform/freeze',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\TestRiskController@triggerFreeze',
        'controller' => 'App\\Http\\Controllers\\Api\\TestRiskController@triggerFreeze',
        'namespace' => NULL,
        'prefix' => '/api/test',
        'where' => 
        array (
        ),
        'as' => 'generated::QFVlh8nZqQIn7eCh',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::sqND4sqQj9OQb9kf' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/test/platform/normal',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\TestRiskController@triggerNormal',
        'controller' => 'App\\Http\\Controllers\\Api\\TestRiskController@triggerNormal',
        'namespace' => NULL,
        'prefix' => '/api/test',
        'where' => 
        array (
        ),
        'as' => 'generated::sqND4sqQj9OQb9kf',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::nGW4oID60Wwhg4ms' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/test/creator/reserve',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\TestRiskController@setReservePercent',
        'controller' => 'App\\Http\\Controllers\\Api\\TestRiskController@setReservePercent',
        'namespace' => NULL,
        'prefix' => '/api/test',
        'where' => 
        array (
        ),
        'as' => 'generated::nGW4oID60Wwhg4ms',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::2RH82abjCT0Botsf' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'api/test/creator/joined-days-ago',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\TestRiskController@setCreatorJoinedDaysAgo',
        'controller' => 'App\\Http\\Controllers\\Api\\TestRiskController@setCreatorJoinedDaysAgo',
        'namespace' => NULL,
        'prefix' => '/api/test',
        'where' => 
        array (
        ),
        'as' => 'generated::2RH82abjCT0Botsf',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'profile.edit' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'profile',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@edit',
        'controller' => 'App\\Http\\Controllers\\ProfileController@edit',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'profile.edit',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'profile.update' => 
    array (
      'methods' => 
      array (
        0 => 'PATCH',
      ),
      'uri' => 'profile',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@update',
        'controller' => 'App\\Http\\Controllers\\ProfileController@update',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'profile.update',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'profile.destroy' => 
    array (
      'methods' => 
      array (
        0 => 'DELETE',
      ),
      'uri' => 'profile',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@destroy',
        'controller' => 'App\\Http\\Controllers\\ProfileController@destroy',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'profile.destroy',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'subscriptions.cancel' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'subscriptions/{id}/cancel',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SubscriptionsController@cancelSubscriptionById',
        'controller' => 'App\\Http\\Controllers\\SubscriptionsController@cancelSubscriptionById',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'subscriptions.cancel',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'subscriptions' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'subscriptions',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@creatorSubscriptions',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@creatorSubscriptions',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'subscriptions',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'subscriptions.show' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'subscriptions/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SubscriptionsController@show',
        'controller' => 'App\\Http\\Controllers\\SubscriptionsController@show',
        'as' => 'subscriptions.show',
        'namespace' => NULL,
        'prefix' => '/subscriptions',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'change.currency' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'currency/{c}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:363:"function (\\Illuminate\\Http\\Request $request, $c) {
    if (\\in_array($c, [\'USD\', \'GBP\', \'EUR\', \'INR\', \'AUD\', \'JPY\', \'HKD\', \'CAD\', \'CHF\', \'SEK\', \'NZD\'])) {
        \\Illuminate\\Support\\Facades\\Cookie::queue(\'currency\', $c, 60 * 24 * 365);
        return \\back()->with(\'success\', "Currency set to $c");
    }
    return \\back()->with(\'error\', \'Invalid Currency!\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000085e0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'change.currency',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.stripe.search' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/stripe/search',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@stripeSearch',
        'controller' => 'App\\Http\\Controllers\\TestController@stripeSearch',
        'as' => 'test.stripe.search',
        'namespace' => NULL,
        'prefix' => 'test/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.stripe.checkout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/stripe/checkout',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\CheckoutController@testCheckout',
        'controller' => 'App\\Http\\Controllers\\Auth\\CheckoutController@testCheckout',
        'as' => 'test.stripe.checkout',
        'namespace' => NULL,
        'prefix' => 'test/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.stripe.callback' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/stripe/checkout-callback/{status?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\CheckoutController@testCallback',
        'controller' => 'App\\Http\\Controllers\\Auth\\CheckoutController@testCallback',
        'as' => 'test.stripe.callback',
        'namespace' => NULL,
        'prefix' => 'test/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.adult-check' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/adult-content-check',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testAdultContent',
        'controller' => 'App\\Http\\Controllers\\TestController@testAdultContent',
        'as' => 'test.adult-check',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/email',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testEmail',
        'controller' => 'App\\Http\\Controllers\\TestController@testEmail',
        'as' => 'test.',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::y09Wh6qe3UdgBuTv' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/founder-email',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testFounderEmail',
        'controller' => 'App\\Http\\Controllers\\TestController@testFounderEmail',
        'as' => 'test.generated::y09Wh6qe3UdgBuTv',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::iMmmRt9iEPC6Cv1i' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/debug-user-status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@debugUserStatus',
        'controller' => 'App\\Http\\Controllers\\TestController@debugUserStatus',
        'as' => 'test.generated::iMmmRt9iEPC6Cv1i',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::MQAebegIy2d3D6FP' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/rates/{c?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@getRates',
        'controller' => 'App\\Http\\Controllers\\TestController@getRates',
        'as' => 'test.generated::MQAebegIy2d3D6FP',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::QEYVbZ2WBVmdDZJE' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/c-data',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testCurrencyData',
        'controller' => 'App\\Http\\Controllers\\TestController@testCurrencyData',
        'as' => 'test.generated::QEYVbZ2WBVmdDZJE',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::o9fPbYGk9Xxd9A1x' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/x-api',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TwitterController@testToken',
        'controller' => 'App\\Http\\Controllers\\Auth\\TwitterController@testToken',
        'as' => 'test.generated::o9fPbYGk9Xxd9A1x',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::JvFmfzjNaKDIpNcM' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/meta',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testMeta',
        'controller' => 'App\\Http\\Controllers\\TestController@testMeta',
        'as' => 'test.generated::JvFmfzjNaKDIpNcM',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::KLl1oY1u8urKfKuE' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/x-1',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testX',
        'controller' => 'App\\Http\\Controllers\\TestController@testX',
        'as' => 'test.generated::KLl1oY1u8urKfKuE',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::FGEh2boK0un8hpB1' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/items/{c?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testItems',
        'controller' => 'App\\Http\\Controllers\\TestController@testItems',
        'as' => 'test.generated::FGEh2boK0un8hpB1',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.generated::YAm9QqgHMxJJ8V2X' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/ip',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@testIp',
        'controller' => 'App\\Http\\Controllers\\TestController@testIp',
        'as' => 'test.generated::YAm9QqgHMxJJ8V2X',
        'namespace' => NULL,
        'prefix' => '/test',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'pwa.test' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'pwa-test',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:63:"function () {
    return \\Inertia\\Inertia::render(\'PwaTest\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000086e0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'pwa.test',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'pwa.debug' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'pwa-debug',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:647:"function () {
    return \\response()->json([
        \'manifest_url\' => \\url(\'/site.webmanifest\'),
        \'service_worker_url\' => \\url(\'/service-worker.js\'),
        \'manifest_exists\' => \\file_exists(\\public_path(\'site.webmanifest\')),
        \'service_worker_exists\' => \\file_exists(\\public_path(\'service-worker.js\')),
        \'is_https\' => \\request()->isSecure(),
        \'host\' => \\request()->getHost(),
        \'user_agent\' => \\request()->userAgent(),
        \'manifest_content\' => \\file_exists(\\public_path(\'site.webmanifest\'))
            ? \\json_decode(\\file_get_contents(\\public_path(\'site.webmanifest\')), true)
            : null
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000086d0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'pwa.debug',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'app.check' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'app/check',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\AppController@appCheck',
        'controller' => 'App\\Http\\Controllers\\AppController@appCheck',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'app.check',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::GMK42I6dYwCh7Vqi' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seed-user-verification-status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TestController@seedUserVerificationStatus',
        'controller' => 'App\\Http\\Controllers\\TestController@seedUserVerificationStatus',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::GMK42I6dYwCh7Vqi',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::O4pBSUnYvp6yKy8U' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'magicbell/user-key',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\NotificationController@getUserKey',
        'controller' => 'App\\Http\\Controllers\\NotificationController@getUserKey',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::O4pBSUnYvp6yKy8U',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::kthD3ueHsFjqhNL2' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'magicbell/send-notification',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\NotificationController@sendNotification',
        'controller' => 'App\\Http\\Controllers\\NotificationController@sendNotification',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::kthD3ueHsFjqhNL2',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::TNHj46jg4MybpHL3' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-push',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\NotificationController@testSendNotification',
        'controller' => 'App\\Http\\Controllers\\NotificationController@testSendNotification',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::TNHj46jg4MybpHL3',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'debug.test-support-image' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug/test-support-image',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Debug\\SupportImageTestController@run',
        'controller' => 'App\\Http\\Controllers\\Debug\\SupportImageTestController@run',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'debug.test-support-image',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.dispute-pack.download' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/dispute-packs/{disputeId}/{fileName}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'signed',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:592:"function (\\Illuminate\\Http\\Request $request, $disputeId, $fileName) {
    if (!$request->hasValidSignature()) {
        \\abort(\\Illuminate\\Http\\Response::HTTP_FORBIDDEN, \'Invalid or expired link.\');
    }
    
    $fileName = \\basename($fileName);
    $adminStoragePath = \\base_path(\'../admin.spennypiggy.co/storage/app/dispute-packs/\');
    $path = $adminStoragePath . $fileName;
    
    if (!\\Illuminate\\Support\\Facades\\File::exists($path)) {
        \\abort(\\Illuminate\\Http\\Response::HTTP_NOT_FOUND, \'Dispute pack not found.\');
    }

    return \\response()->download($path, $fileName);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008870000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creator.dispute-pack.download',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.activity' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/activity',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorActivityController@index',
        'controller' => 'App\\Http\\Controllers\\CreatorActivityController@index',
        'as' => 'creator.activity',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.activity.status' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/activity/status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorActivityController@getActivityStatus',
        'controller' => 'App\\Http\\Controllers\\CreatorActivityController@getActivityStatus',
        'as' => 'creator.activity.status',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.activity.refresh' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator/activity/refresh',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorActivityController@refreshActivity',
        'controller' => 'App\\Http\\Controllers\\CreatorActivityController@refreshActivity',
        'as' => 'creator.activity.refresh',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.activity.suggestions' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/activity/suggestions',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorActivityController@getSuggestions',
        'controller' => 'App\\Http\\Controllers\\CreatorActivityController@getSuggestions',
        'as' => 'creator.activity.suggestions',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.subscription.status' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/subscription/status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorSubscriptionController@getSubscriptionStatus',
        'controller' => 'App\\Http\\Controllers\\CreatorSubscriptionController@getSubscriptionStatus',
        'as' => 'creator.subscription.status',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.subscription.validate-payment' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator/subscription/validate-payment',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorSubscriptionController@validatePaymentSubscription',
        'controller' => 'App\\Http\\Controllers\\CreatorSubscriptionController@validatePaymentSubscription',
        'as' => 'creator.subscription.validate-payment',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.subscription.dashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/subscription/dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorSubscriptionController@getDashboardInfo',
        'controller' => 'App\\Http\\Controllers\\CreatorSubscriptionController@getDashboardInfo',
        'as' => 'creator.subscription.dashboard',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.subscription.warnings' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/subscription/warnings',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorSubscriptionController@getCreatorsNeedingWarnings',
        'controller' => 'App\\Http\\Controllers\\CreatorSubscriptionController@getCreatorsNeedingWarnings',
        'as' => 'creator.subscription.warnings',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.subscription.sync' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator/subscription/sync',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SubscriptionSyncController@syncCurrentUser',
        'controller' => 'App\\Http\\Controllers\\SubscriptionSyncController@syncCurrentUser',
        'as' => 'creator.subscription.sync',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.disputes.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/disputes',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Creator\\DisputeController@index',
        'controller' => 'App\\Http\\Controllers\\Creator\\DisputeController@index',
        'as' => 'creator.disputes.index',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.disputes.show' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/disputes/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Creator\\DisputeController@show',
        'controller' => 'App\\Http\\Controllers\\Creator\\DisputeController@show',
        'as' => 'creator.disputes.show',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.disputes.submit' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator/disputes/{id}/submit',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Creator\\DisputeController@submitEvidence',
        'controller' => 'App\\Http\\Controllers\\Creator\\DisputeController@submitEvidence',
        'as' => 'creator.disputes.submit',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.payouts.reserves' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/payouts/reserves',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Api\\CreatorPayoutController@getReserves',
        'controller' => 'App\\Http\\Controllers\\Api\\CreatorPayoutController@getReserves',
        'as' => 'creator.payouts.reserves',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.finance.review_holds' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/finance/review-holds',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Creator\\ReviewHoldController@index',
        'controller' => 'App\\Http\\Controllers\\Creator\\ReviewHoldController@index',
        'as' => 'creator.finance.review_holds',
        'namespace' => NULL,
        'prefix' => '/creator',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.security.sessions' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/security/sessions',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SecurityController@getSessions',
        'controller' => 'App\\Http\\Controllers\\SecurityController@getSessions',
        'as' => 'creator.security.sessions',
        'namespace' => NULL,
        'prefix' => 'creator/security',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.security.sessions.revoke' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator/security/sessions/revoke',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SecurityController@revokeSession',
        'controller' => 'App\\Http\\Controllers\\SecurityController@revokeSession',
        'as' => 'creator.security.sessions.revoke',
        'namespace' => NULL,
        'prefix' => 'creator/security',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.security.blocked-users' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/security/blocked-users',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SecurityController@getBlockedUsers',
        'controller' => 'App\\Http\\Controllers\\SecurityController@getBlockedUsers',
        'as' => 'creator.security.blocked-users',
        'namespace' => NULL,
        'prefix' => 'creator/security',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.security.block-user' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator/security/block-user',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SecurityController@blockUser',
        'controller' => 'App\\Http\\Controllers\\SecurityController@blockUser',
        'as' => 'creator.security.block-user',
        'namespace' => NULL,
        'prefix' => 'creator/security',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.security.unblock-user' => 
    array (
      'methods' => 
      array (
        0 => 'DELETE',
      ),
      'uri' => 'creator/security/unblock-user/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SecurityController@unblockUser',
        'controller' => 'App\\Http\\Controllers\\SecurityController@unblockUser',
        'as' => 'creator.security.unblock-user',
        'namespace' => NULL,
        'prefix' => 'creator/security',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.security.search-users' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator/security/search-users',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\SecurityController@searchUsers',
        'controller' => 'App\\Http\\Controllers\\SecurityController@searchUsers',
        'as' => 'creator.security.search-users',
        'namespace' => NULL,
        'prefix' => 'creator/security',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'service.worker' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'service-worker.js',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:314:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(\\resource_path("proxy/service-worker.js"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "text/javascript",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008890000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'service.worker',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'new-service-worker' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'new-service-worker.js',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:314:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(\\resource_path("proxy/service-worker.js"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "text/javascript",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008990000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'new-service-worker',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'site.manifest.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'site.webmanifest',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:312:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(\\resource_path("proxy/site.webmanifest.json"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "text/json",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008a10000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'site.manifest.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    '192.image.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'android-chrome-192x192.png',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:327:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(filename: \\resource_path("proxy/android-chrome-192x192.png"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "image/png",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008a50000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => '192.image.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    '512.image.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'android-chrome-512x512.png',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:327:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(filename: \\resource_path("proxy/android-chrome-512x512.png"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "image/png",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008a70000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => '512.image.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    '16.image.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'favicon-16x16.png',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:318:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(filename: \\resource_path("proxy/favicon-16x16.png"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "image/png",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008a90000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => '16.image.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    '32.image.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'favicon-32x32.png',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:318:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(filename: \\resource_path("proxy/favicon-32x32.png"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "image/png",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008ab0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => '32.image.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'splash.image.file' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'splashscreen.png',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:311:"function () {
    $assetRoot = \\rtrim(\\asset("/"), "/");
    $content = \\file_get_contents(filename: \\resource_path("proxy/splash.png"));
    $content = \\Illuminate\\Support\\Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return \\response($content, 200, [
        "Content-Type" => "image/png",
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008ad0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'splash.image.file',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'app.robots' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'app-robots-file',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SeoController@robotsTxt',
        'controller' => 'App\\Http\\Controllers\\SeoController@robotsTxt',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'app.robots',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'app.sitemap.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'app-sitemap-index',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@index',
        'controller' => 'App\\Http\\Controllers\\SitemapController@index',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'app.sitemap.index',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'app.sitemap.static' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'app-sitemap-pages',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@static',
        'controller' => 'App\\Http\\Controllers\\SitemapController@static',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'app.sitemap.static',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'app.sitemap.creators' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'app-sitemap-users',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@creators',
        'controller' => 'App\\Http\\Controllers\\SitemapController@creators',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'app.sitemap.creators',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'app.sitemap.wishlists' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'app-sitemap-items',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@wishlists',
        'controller' => 'App\\Http\\Controllers\\SitemapController@wishlists',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'app.sitemap.wishlists',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dynamic.robots' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'dynamic-robots',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1106:"function () {
        $siteUrl = \\config(\'app.url\');
        $content = "User-agent: *\\n";
        $content .= "Disallow: /admin/\\n";
        $content .= "Disallow: /api/webhooks/\\n";
        $content .= "Disallow: /*.json\\n";
        $content .= "Disallow: /staging/\\n";
        $content .= "Disallow: /test/\\n";
        $content .= "Disallow: /debug*/\\n";
        $content .= "Disallow: /seed*/\\n";
        $content .= "Disallow: /*-test\\n";
        $content .= "Disallow: /pwa-debug\\n";
        $content .= "\\n# Allow main content\\n";
        $content .= "Allow: /\\n";
        $content .= "Allow: /discover\\n";
        $content .= "Allow: /leaderboard\\n";
        $content .= "Allow: /how-it-works\\n";
        $content .= "\\n# Sitemap location\\n";
        $content .= "Sitemap: {$siteUrl}/dynamic-sitemap\\n";

        return \\response($content, 200, [
            \'Content-Type\' => \'text/plain; charset=UTF-8\',
            \'Cache-Control\' => \'no-store, no-cache, must-revalidate, max-age=0\',
            \'Pragma\' => \'no-cache\',
            \'Expires\' => \'Thu, 01 Jan 1970 00:00:00 GMT\',
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008b60000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dynamic.robots',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dynamic.sitemap' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'dynamic-sitemap',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1319:"function () {
        $siteUrl = \\config(\'app.url\');
        $content = \'<?xml version="1.0" encoding="UTF-8"?>\' . "\\n";
        $content .= \'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\' . "\\n";
        $content .= \'  <sitemap>\' . "\\n";
        $content .= \'    <loc>\' . $siteUrl . \'/dynamic-sitemap-pages</loc>\' . "\\n";
        $content .= \'    <lastmod>\' . \\now()->toW3cString() . \'</lastmod>\' . "\\n";
        $content .= \'  </sitemap>\' . "\\n";
        $content .= \'  <sitemap>\' . "\\n";
        $content .= \'    <loc>\' . $siteUrl . \'/dynamic-sitemap-users</loc>\' . "\\n";
        $content .= \'    <lastmod>\' . \\now()->toW3cString() . \'</lastmod>\' . "\\n";
        $content .= \'  </sitemap>\' . "\\n";
        $content .= \'  <sitemap>\' . "\\n";
        $content .= \'    <loc>\' . $siteUrl . \'/dynamic-sitemap-items</loc>\' . "\\n";
        $content .= \'    <lastmod>\' . \\now()->toW3cString() . \'</lastmod>\' . "\\n";
        $content .= \'  </sitemap>\' . "\\n";
        $content .= \'</sitemapindex>\' . "\\n";

        return \\response($content, 200, [
            \'Content-Type\' => \'application/xml; charset=UTF-8\',
            \'Cache-Control\' => \'no-store, no-cache, must-revalidate, max-age=0\',
            \'Pragma\' => \'no-cache\',
            \'Expires\' => \'Thu, 01 Jan 1970 00:00:00 GMT\',
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008b80000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dynamic.sitemap',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dynamic.sitemap.pages' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'dynamic-sitemap-pages',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:2303:"function () {
        $siteUrl = \\config(\'app.url\');
        $staticPages = [
            [\'url\' => \'/\', \'priority\' => \'1.0\', \'changefreq\' => \'daily\'],
            [\'url\' => \'/discover\', \'priority\' => \'0.9\', \'changefreq\' => \'daily\'],
            [\'url\' => \'/leaderboard\', \'priority\' => \'0.8\', \'changefreq\' => \'daily\'],
            [\'url\' => \'/how-it-works\', \'priority\' => \'0.7\', \'changefreq\' => \'weekly\'],
            [\'url\' => \'/terms-and-conditions\', \'priority\' => \'0.5\', \'changefreq\' => \'monthly\'],
            [\'url\' => \'/paid-tasks-terms\', \'priority\' => \'0.5\', \'changefreq\' => \'monthly\'],
            [\'url\' => \'/register\', \'priority\' => \'0.6\', \'changefreq\' => \'weekly\'],
            [\'url\' => \'/login\', \'priority\' => \'0.6\', \'changefreq\' => \'weekly\'],
            [\'url\' => \'/creators\', \'priority\' => \'0.7\', \'changefreq\' => \'weekly\'],
            [\'url\' => \'/creators/stripe-safe\', \'priority\' => \'0.6\', \'changefreq\' => \'monthly\'],
            [\'url\' => \'/creators/keep-100\', \'priority\' => \'0.7\', \'changefreq\' => \'weekly\'],
            [\'url\' => \'/creators/features\', \'priority\' => \'0.7\', \'changefreq\' => \'weekly\'],
            [\'url\' => \'/creators/disputes\', \'priority\' => \'0.6\', \'changefreq\' => \'monthly\'],
            [\'url\' => \'/creators/founder-bonus\', \'priority\' => \'0.7\', \'changefreq\' => \'weekly\'],
        ];

        $content = \'<?xml version="1.0" encoding="UTF-8"?>\' . "\\n";
        $content .= \'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\' . "\\n";

        foreach ($staticPages as $page) {
            $content .= \'  <url>\' . "\\n";
            $content .= \'    <loc>\' . $siteUrl . $page[\'url\'] . \'</loc>\' . "\\n";
            $content .= \'    <lastmod>\' . \\now()->toW3cString() . \'</lastmod>\' . "\\n";
            $content .= \'    <changefreq>\' . $page[\'changefreq\'] . \'</changefreq>\' . "\\n";
            $content .= \'    <priority>\' . $page[\'priority\'] . \'</priority>\' . "\\n";
            $content .= \'  </url>\' . "\\n";
        }

        $content .= \'</urlset>\' . "\\n";

        return \\response($content, 200, [
            \'Content-Type\' => \'application/xml; charset=UTF-8\',
            \'Cache-Control\' => \'no-store, no-cache, must-revalidate, max-age=0\',
            \'Pragma\' => \'no-cache\',
            \'Expires\' => \'Thu, 01 Jan 1970 00:00:00 GMT\',
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008ba0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dynamic.sitemap.pages',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dynamic.sitemap.users' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'dynamic-sitemap-users',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@creators',
        'controller' => 'App\\Http\\Controllers\\SitemapController@creators',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dynamic.sitemap.users',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dynamic.sitemap.items' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'dynamic-sitemap-items',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@wishlists',
        'controller' => 'App\\Http\\Controllers\\SitemapController@wishlists',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dynamic.sitemap.items',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'seo.status' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seo-status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'excluded_middleware' => 
        array (
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1490:"function () {
        $siteUrl = \\config(\'app.url\');
        $html = \'<!DOCTYPE html><html><head><title>SEO Files Status</title></head><body>\';
        $html .= \'<h1>SEO Files - Working URLs</h1>\';
        $html .= \'<p>These URLs bypass all caching and serve dynamic content:</p>\';
        $html .= \'<ul>\';
        $html .= \'<li><strong>Robots.txt:</strong> <a href="\' . $siteUrl . \'/dynamic-robots" target="_blank">\' . $siteUrl . \'/dynamic-robots</a></li>\';
        $html .= \'<li><strong>Sitemap Index:</strong> <a href="\' . $siteUrl . \'/dynamic-sitemap" target="_blank">\' . $siteUrl . \'/dynamic-sitemap</a></li>\';
        $html .= \'<li><strong>Pages Sitemap:</strong> <a href="\' . $siteUrl . \'/dynamic-sitemap-pages" target="_blank">\' . $siteUrl . \'/dynamic-sitemap-pages</a></li>\';
        $html .= \'<li><strong>Users Sitemap:</strong> <a href="\' . $siteUrl . \'/dynamic-sitemap-users" target="_blank">\' . $siteUrl . \'/dynamic-sitemap-users</a></li>\';
        $html .= \'<li><strong>Items Sitemap:</strong> <a href="\' . $siteUrl . \'/dynamic-sitemap-items" target="_blank">\' . $siteUrl . \'/dynamic-sitemap-items</a></li>\';
        $html .= \'</ul>\';
        $html .= \'<h2>Submit to Search Engines:</h2>\';
        $html .= \'<p>Use this URL for search engine submission:</p>\';
        $html .= \'<code>\' . $siteUrl . \'/dynamic-sitemap</code>\';
        $html .= \'</body></html>\';

        return \\response($html, 200, [
            \'Content-Type\' => \'text/html; charset=UTF-8\',
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008be0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'seo.status',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'robots.txt' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'robots.txt',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\SeoController@robots',
        'controller' => 'App\\Http\\Controllers\\SeoController@robots',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'robots.txt',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'sitemap.custom' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'sitemap.xml',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@customSitemap',
        'controller' => 'App\\Http\\Controllers\\SitemapController@customSitemap',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'sitemap.custom',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'sitemap.static.redirect' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seo/sitemap-static.xml',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@static',
        'controller' => 'App\\Http\\Controllers\\SitemapController@static',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'sitemap.static.redirect',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'sitemap.creators.redirect' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seo/sitemap-creators.xml',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@creators',
        'controller' => 'App\\Http\\Controllers\\SitemapController@creators',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'sitemap.creators.redirect',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'sitemap.wishlists.redirect' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seo/sitemap-wishlists.xml',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@wishlists',
        'controller' => 'App\\Http\\Controllers\\SitemapController@wishlists',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'sitemap.wishlists.redirect',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'seo.clear.cache' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'seo/clear-cache',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\SitemapController@clearCache',
        'controller' => 'App\\Http\\Controllers\\SitemapController@clearCache',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'seo.clear.cache',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'error.404' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => '404',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\ErrorController@show404',
        'controller' => 'App\\Http\\Controllers\\ErrorController@show404',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'error.404',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'ping' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'ping',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:88:"function () {
    return \\response(\'pong\', 200)->header(\'Content-Type\', \'text/plain\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008c50000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'ping',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'health.check' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'health',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\HealthController@index',
        'controller' => 'App\\Http\\Controllers\\HealthController@index',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'health.check',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'health.detailed' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'health/detailed',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\HealthController@detailed',
        'controller' => 'App\\Http\\Controllers\\HealthController@detailed',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'health.detailed',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::fGQ6JZJTBk8apbPn' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-wish-creation',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1122:"function () {
        $user = \\Illuminate\\Support\\Facades\\Auth::user();
        
        return \\response()->json([
            \'user_authenticated\' => \\Illuminate\\Support\\Facades\\Auth::check(),
            \'user_id\' => $user->id ?? null,
            \'email_verified\' => $user->email_verified_at !== null,
            \'role\' => $user->role ?? null,
            \'identity_status\' => $user->identity_status ?? null,
            \'profile_status_lock\' => $user->profile_status_lock ?? null,
            \'subscription_status\' => $user->subscription_status ?? null,
            \'account_id\' => $user->account_id ?? null,
            \'charges_enabled\' => $user->charges_enabled ?? null,
            \'middleware_should_pass\' => true,
            \'debug_info\' => [
                \'has_paid_subscription\' => \\in_array($user->subscription_status, [1, 2]),
                \'needs_identity_verification\' => $user->role == 1 
                    && $user->profile_status_lock == 2 
                    && $user->identity_status != 1 
                    && \\in_array($user->subscription_status, [1, 2]),
            ]
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008cb0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::fGQ6JZJTBk8apbPn',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::XQFmPpM1Mp3jP5QY' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'debug-wish-creation-test',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:302:"function (\\Illuminate\\Http\\Request $request) {
        return \\response()->json([
            \'success\' => true,
            \'message\' => \'Request reached controller successfully\',
            \'data\' => $request->all(),
            \'user_id\' => \\Illuminate\\Support\\Facades\\Auth::id(),
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008cd0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::XQFmPpM1Mp3jP5QY',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::zy7cpIqhWbAYsheP' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-wish-no-middleware',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:280:"function () {
    return \\response()->json([
        \'success\' => true,
        \'message\' => \'Route accessible without middleware\',
        \'authenticated\' => \\Illuminate\\Support\\Facades\\Auth::check(),
        \'user_id\' => \\Illuminate\\Support\\Facades\\Auth::id() ?? null,
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008c90000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::zy7cpIqhWbAYsheP',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonuses.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/founder/bonuses',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@index',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@index',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonuses.index',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonuses.data' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/founder/bonuses/data',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@getBonuses',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@getBonuses',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonuses.data',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonuses.reject' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/founder/bonuses/{bonus}/reject',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@rejectPayout',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@rejectPayout',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonuses.reject',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonuses.approve' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/founder/bonuses/{bonus}/approve',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@approvePayout',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@approvePayout',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonuses.approve',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonus-settings.get' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/founder/bonus-settings',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@getSettings',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@getSettings',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonus-settings.get',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonus-settings.update' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/founder/bonus-settings',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@updateSettings',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@updateSettings',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonus-settings.update',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonus-settings.page' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/founder/bonus-settings-page',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:91:"function () {
        return \\Inertia\\Inertia::render(\'Admin/FounderBonus/Settings\');
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008d70000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonus-settings.page',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.founder/bonuses.trigger-qualification' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/founder/bonuses/trigger-qualification-check',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@triggerQualificationCheck',
        'controller' => 'App\\Http\\Controllers\\Admin\\FounderBonusAdminController@triggerQualificationCheck',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.founder/bonuses.trigger-qualification',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.tasks.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/tasks',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\TaskPurchaseController@index',
        'controller' => 'App\\Http\\Controllers\\Admin\\TaskPurchaseController@index',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.tasks.index',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.tasks.resolve' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/tasks/{uuid}/resolve',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\TaskPurchaseController@resolve',
        'controller' => 'App\\Http\\Controllers\\Admin\\TaskPurchaseController@resolve',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.tasks.resolve',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.feature-suggestions.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/feature-suggestions',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:799:"function (\\Illuminate\\Http\\Request $request) {
        $query = \\App\\Models\\FeatureSuggestion::with(\'user\')->latest();

        if ($request->filled(\'status\')) {
            $query->where(\'status\', $request->status);
        }

        if ($request->filled(\'search\')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where(\'suggestion\', \'like\', "%{$term}%")
                    ->orWhere(\'name\', \'like\', "%{$term}%")
                    ->orWhere(\'email\', \'like\', "%{$term}%");
            });
        }

        return \\Inertia\\Inertia::render(\'Admin/FeatureSuggestions\', [
            \'suggestions\' => $query->paginate(20)->appends($request->query()),
            \'filters\' => $request->only([\'status\', \'search\']),
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008dc0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.feature-suggestions.index',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.feature-suggestions.update-status' => 
    array (
      'methods' => 
      array (
        0 => 'PATCH',
      ),
      'uri' => 'admin/feature-suggestions/{suggestion}/status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
          3 => 'admin',
        ),
        'uses' => 'App\\Http\\Controllers\\FeatureSuggestionController@updateStatus',
        'controller' => 'App\\Http\\Controllers\\FeatureSuggestionController@updateStatus',
        'namespace' => NULL,
        'prefix' => '/admin',
        'where' => 
        array (
        ),
        'as' => 'admin.feature-suggestions.update-status',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.system-diagnostics.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'admin/system-diagnostics',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\SystemDiagnosticsController@index',
        'controller' => 'App\\Http\\Controllers\\Admin\\SystemDiagnosticsController@index',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'admin.system-diagnostics.index',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'admin.system-diagnostics.run' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'admin/system-diagnostics/run',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Admin\\SystemDiagnosticsController@run',
        'controller' => 'App\\Http\\Controllers\\Admin\\SystemDiagnosticsController@run',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'admin.system-diagnostics.run',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::XPu94GHKadLHv2Tk' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-sentry',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:341:"function () {
    if (\\app()->bound(\'sentry\')) {
        \\app(\'sentry\')->captureMessage(\'Sentry Test Message from spennypiggy.co Backend\');
        return \\response()->json([\'message\' => \'Sentry test message sent from Backend. Check your dashboard!\']);
    }
    return \\response()->json([\'error\' => \'Sentry not bound in container\'], 500);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008df0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::XPu94GHKadLHv2Tk',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'register' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'register',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@create',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@create',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'register',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::aezy97WviSnuT0BA' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'register',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@store',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::aezy97WviSnuT0BA',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'login' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'login',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@create',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@create',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'login',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'login-user' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'verify/login',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@store',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'login-user',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'verify2FA' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'verify-2fa',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@verify2FA',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@verify2FA',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'verify2FA',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'verifyUser' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'verify-user',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@verifyUser',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@verifyUser',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'verifyUser',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'password.email' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'forgot-password',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@store',
        'controller' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'password.email',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::wWHpU0WCZKrWWXIu' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'forgot-password/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@forgotPasswordPage',
        'controller' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@forgotPasswordPage',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::wWHpU0WCZKrWWXIu',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'changePassword' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'change-password/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@changePassword',
        'controller' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@changePassword',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'changePassword',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'password.reset' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'reset-password/{token}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\NewPasswordController@create',
        'controller' => 'App\\Http\\Controllers\\Auth\\NewPasswordController@create',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'password.reset',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'password.store' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'reset-password',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\NewPasswordController@store',
        'controller' => 'App\\Http\\Controllers\\Auth\\NewPasswordController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'password.store',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::HmlL3GJYN51pzjKi' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'verify-token/{token}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@authRedirects',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@authRedirects',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::HmlL3GJYN51pzjKi',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::GLKqRH0fZvGYWtJ7' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'update-2fa-key',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'guest',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@update2FaKey',
        'controller' => 'App\\Http\\Controllers\\ProfileController@update2FaKey',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::GLKqRH0fZvGYWtJ7',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::tqUI7gaIZVPjBeG4' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug/webauthn-credentials',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:584:"function () {

    return \\App\\Models\\User::with(\'webAuthnCredentials\')->get()
        ->map(function ($user) {

            return [
                \'email\' => $user->email,

                \'credentials\' => $user->webAuthnCredentials->map(function ($cred) {

                    return [
                        \'device\' => $cred->device_name,
                        \'browser\' => $cred->browser,
                        \'platform\' => $cred->platform,
                        \'last_used\' => $cred->last_used_at
                    ];
                })

            ];
        });
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008e10000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::tqUI7gaIZVPjBeG4',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::zVfauzaa2RmIVGDZ' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-webauthn-credential',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:685:"function () {
    if (!\\auth()->check()) {
        return \\response()->json([\'error\' => \'Not authenticated\'], 401);
    }

    $user = \\auth()->user();
    $credential = $user->webAuthnCredentials()->first();

    if (!$credential) {
        return \\response()->json([\'error\' => \'No passkey found for user\'], 404);
    }

    return \\response()->json([
        \'user_id\' => $user->id,
        \'user_email\' => $user->email,
        \'credential_exists\' => true,
        \'credential_id\' => $credential->id,
        \'rp_id\' => $credential->rp_id,
        \'origin\' => $credential->origin,
        \'counter\' => $credential->counter,
        \'last_used\' => $credential->last_used_at
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008f00000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::zVfauzaa2RmIVGDZ',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.check' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webauthn/check',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnCheckController@check',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnCheckController@check',
        'namespace' => NULL,
        'prefix' => '/webauthn',
        'where' => 
        array (
        ),
        'as' => 'webauthn.check',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.login.options' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webauthn/login/options',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'web',
        ),
        'excluded_middleware' => 
        array (
          0 => 'App\\Http\\Middleware\\VerifyCsrfToken',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnLoginController@options',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnLoginController@options',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'webauthn.login.options',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.login.userless.options' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webauthn/login/options-userless',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnLoginController@optionsUserless',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnLoginController@optionsUserless',
        'namespace' => NULL,
        'prefix' => '/webauthn',
        'where' => 
        array (
        ),
        'as' => 'webauthn.login.userless.options',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.login' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webauthn/login',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'web',
        ),
        'excluded_middleware' => 
        array (
          0 => 'App\\Http\\Middleware\\VerifyCsrfToken',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnLoginController@login',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnLoginController@login',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'webauthn.login',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.register.options' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webauthn/register/options',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'web',
        ),
        'excluded_middleware' => 
        array (
          0 => 'App\\Http\\Middleware\\VerifyCsrfToken',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnRegisterController@options',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnRegisterController@options',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'webauthn.register.options',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.register' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'webauthn/register',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'web',
        ),
        'excluded_middleware' => 
        array (
          0 => 'App\\Http\\Middleware\\VerifyCsrfToken',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnRegisterController@register',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnRegisterController@register',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'webauthn.register',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'webauthn.delete' => 
    array (
      'methods' => 
      array (
        0 => 'DELETE',
      ),
      'uri' => 'webauthn/delete/{id?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnCheckController@delete',
        'controller' => 'App\\Http\\Controllers\\WebAuthn\\WebAuthnCheckController@delete',
        'namespace' => NULL,
        'prefix' => '/webauthn',
        'where' => 
        array (
        ),
        'as' => 'webauthn.delete',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::uhZcvqt9RnADT1qU' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'check-referral-code/{code}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\ReferAndEarnController@checkCreatorReferral',
        'controller' => 'App\\Http\\Controllers\\ReferAndEarnController@checkCreatorReferral',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::uhZcvqt9RnADT1qU',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.identity.verify' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'stripe/identity/verify',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@createVerificationSession',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@createVerificationSession',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe.identity.verify',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'discover_wish' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'discover/wishes/{order}/{type}/{price}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@discover_all_wishes',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@discover_all_wishes',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'discover_wish',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'discover_creators' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'discover/creators/{order}/{gender}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@discover_all_creators',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@discover_all_creators',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'discover_creators',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'allcreators_categories' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'discover/creators/categories',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@all_creators_categories',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@all_creators_categories',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'allcreators_categories',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'discover' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'discover/{type?}/{category?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:6083:"function (\\Illuminate\\Http\\Request $request, \\App\\Services\\DiscoveryService $discoveryService, $type = \'trending\', $category = null) {
    $getData = function() use ($request, $discoveryService, $type, $category) {
        $filters = $request->only([\'search\', \'contentType\']);
        // Normalize type and apply shortcut filters
        if ($type) {
            $normalizedType = \\strtolower($type);
            if ($normalizedType === \'trending\') {
                $filters[\'sortBy\'] = \'Trending\';
                $filters[\'type\'] = \'trending\';
            } elseif ($normalizedType === \'new\') {
                $filters[\'sortBy\'] = \'New\';
                $filters[\'type\'] = \'new\';
            } elseif (\\in_array($normalizedType, [\'creators\', \'wishes\', \'bills\', \'memberships\'])) {
                $filters[\'contentType\'] = \\ucfirst($normalizedType);
            }
        } else {
            // If searching by keyword and no explicit content type, search across all
            if (!$request->has(\'contentType\') && $request->has(\'search\')) {
                $filters[\'contentType\'] = \'All\';
            }
        }

        // Determine if we should show search results (Grid) or default sections (Carousels)
        $queryParams = $request->query();
        $hasSearchParam = $request->has(\'search\') && \\strlen((string) $request->input(\'search\')) > 0;
        $hasTypeParamQuery = $request->has(\'type\') && \\in_array(\\strtolower($request->input(\'type\')), [\'new\', \'trending\']);
        $hasTypeParamRoute = $type && \\in_array(\\strtolower($type), [\'new\', \'trending\']);
        $hasTypeParam = $hasTypeParamQuery || $hasTypeParamRoute;

        // Check contentType from filters (which includes route params) or query params
        $activeContentType = $filters[\'contentType\'] ?? ($request->input(\'contentType\') ?? null);
        $hasContentTypeParam = $activeContentType && \\in_array($activeContentType, [\'Creators\', \'Wishes\', \'Bills\', \'Memberships\']);

        // Grid view when searching or selecting a specific content type
        $isSearch = $hasSearchParam || $hasTypeParam || $hasContentTypeParam;
        // Root discover shows sections
        if (!$type && empty($queryParams)) {
            $isSearch = false;
        }

        $searchResults = [];
        $featuredCreators = [];
        $newVerifiedCreators = [];
        $featuredWishes = [];
        $topEarnersData = [];
        $featuredBills = [];
        $featuredMemberships = [];

        if ($isSearch) {
            // Fetch all types unless specific contentType is set
            $ctype = $filters[\'contentType\'] ?? \'All\';

            if ($type && \\in_array(\\strtolower($type), [\'trending\', \'new\']) && !$request->has(\'contentType\')) {
                $ctype = \'All\';
            }

            if ($ctype === \'Creators\' || $ctype === \'All\') {
                $searchResults[\'creators\'] = $discoveryService->getSearchCreators($filters);
            }
            if ($ctype === \'Wishes\' || $ctype === \'All\') {
                $searchResults[\'wishes\'] = $discoveryService->getSearchWishes($filters);
            }
            if ($ctype === \'Bills\' || $ctype === \'All\') {
                $searchResults[\'bills\'] = $discoveryService->getSearchBills($filters);
            }
            if ($ctype === \'Memberships\' || $ctype === \'All\') {
                $searchResults[\'memberships\'] = $discoveryService->getSearchMemberships($filters);
            }
        } else {
            // Section data (top 10) - ONLY fetch when not searching to save resources
            $limit = 10;
            $sortBy = $filters[\'sortBy\'] ?? null;
            
            // Creators
            $featuredCreators = $sortBy === \'New\' ? $discoveryService->getSearchCreators([\'sortBy\' => \'New\'], $limit) : $discoveryService->getTrendingCreators($limit);
            
            $newVerifiedCreators = $discoveryService->getNewVerifiedCreators($limit);
            
            // Wishes
            $featuredWishes = $sortBy ? $discoveryService->getSearchWishes([\'sortBy\' => $sortBy], $limit) : $discoveryService->getFeaturedWishes($limit);
            
            // Top earners this week
            $topEarnersData = $discoveryService->getTopEarners(\'weekly\', $limit)[\'data\'];
            
            // Bills & Memberships
            $featuredBills = $sortBy ? $discoveryService->getSearchBills([\'sortBy\' => $sortBy], $limit) : $discoveryService->getFeaturedBills($limit);
            
            $featuredMemberships = $sortBy ? $discoveryService->getSearchMemberships([\'sortBy\' => $sortBy], $limit) : $discoveryService->getFeaturedMemberships($limit);
        }

        return [
            \'featuredCreators\' => $featuredCreators,
            \'newVerifiedCreators\' => $newVerifiedCreators,
            \'featuredWishes\' => $featuredWishes,
            \'topEarnersData\' => $topEarnersData,
            \'featuredBills\' => $featuredBills,
            \'featuredMemberships\' => $featuredMemberships,
            \'filters\' => $filters,
            \'searchResults\' => $searchResults
        ];
    };

    // Use cache for everyone, but shorter TTL for auth users if needed
    // However, discovery data is mostly global, so we can use a shared cache key
    // that depends on the request parameters.
    $cacheKey = \'discover_v2_\' . ($type ?? \'root\') . \'_\' . ($category ?? \'none\') . \'_\' . \\md5(\\json_encode($request->all()));
    $ttl = \\Illuminate\\Support\\Facades\\Auth::check() ? 300 : 1200; // 5 mins for auth, 20 mins for guests
    
    $data = \\Illuminate\\Support\\Facades\\Cache::remember($cacheKey, $ttl, $getData);

    return \\Inertia\\Inertia::render(\'discover/Discover\', [
        \'featuredCreators\' => $data[\'featuredCreators\'],
        \'newVerifiedCreators\' => $data[\'newVerifiedCreators\'],
        \'featuredWishes\' => $data[\'featuredWishes\'],
        \'topEarners\' => $data[\'topEarnersData\'],
        \'featuredBills\' => $data[\'featuredBills\'],
        \'featuredMemberships\' => $data[\'featuredMemberships\'],
        \'filters\' => $data[\'filters\'],
        \'searchResults\' => $data[\'searchResults\'],
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000008fe0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'discover',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'password.request' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'forgot-password',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@create',
        'controller' => 'App\\Http\\Controllers\\Auth\\PasswordResetLinkController@create',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'password.request',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'logout' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'logout',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@destroy',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@destroy',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'logout',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'verification.notice' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'verification',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\EmailVerificationPromptController@__invoke',
        'controller' => 'App\\Http\\Controllers\\Auth\\EmailVerificationPromptController@__invoke',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'verification.notice',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'verification.email' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'email/send-verification-email',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\EmailVerificationNotificationController@sendVerificationEmail',
        'controller' => 'App\\Http\\Controllers\\Auth\\EmailVerificationNotificationController@sendVerificationEmail',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'verification.email',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'save_wish_item' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'save_wish_item',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@addWishItem',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@addWishItem',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'save_wish_item',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'update_wish_item' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'update_wish_item/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@updateWishItem',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@updateWishItem',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'update_wish_item',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'delete_wish_item' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'delete-wish-item/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@deleteWishItem',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@deleteWishItem',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'delete_wish_item',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill.save' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'bill/save',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\BillsController@billSave',
        'controller' => 'App\\Http\\Controllers\\Auth\\BillsController@billSave',
        'as' => 'bill.save',
        'namespace' => NULL,
        'prefix' => '/bill',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill.edit' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'bill/edit/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\BillsController@billEdit',
        'controller' => 'App\\Http\\Controllers\\Auth\\BillsController@billEdit',
        'as' => 'bill.edit',
        'namespace' => NULL,
        'prefix' => '/bill',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill.remove' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'bill/remove/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\BillsController@removeBill',
        'controller' => 'App\\Http\\Controllers\\Auth\\BillsController@removeBill',
        'as' => 'bill.remove',
        'namespace' => NULL,
        'prefix' => '/bill',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill.checkout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'bill/checkout/{uuid}/{reccure?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'mustCompletedCardVerification',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\BillsController@buyBill',
        'controller' => 'App\\Http\\Controllers\\Auth\\BillsController@buyBill',
        'as' => 'bill.checkout',
        'namespace' => NULL,
        'prefix' => '/bill',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill.handle.auth' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'bill/handle/{uuid}/{status?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\BillsController@handlePayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\BillsController@handlePayment',
        'as' => 'bill.handle.auth',
        'namespace' => NULL,
        'prefix' => '/bill',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.save' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'membership/save',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@membershipLevelSave',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@membershipLevelSave',
        'as' => 'membership.save',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.edit' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'membership/edit/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@updateLevel',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@updateLevel',
        'as' => 'membership.edit',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.remove' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership/remove/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@removeLevel',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@removeLevel',
        'as' => 'membership.remove',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.dashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership/dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@membershipDashboard',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@membershipDashboard',
        'as' => 'membership.dashboard',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.graph' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership/graph',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@membershipGraph',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@membershipGraph',
        'as' => 'membership.graph',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.checkout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'membership/checkout/{uuid}/{reccure?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'mustCompletedCardVerification',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@buyLevel',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@buyLevel',
        'as' => 'membership.checkout',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.handle.auth' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership/handle/{uuid}/{status?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@handlePayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@handlePayment',
        'as' => 'membership.handle.auth',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'add-shop' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'shop/add',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@addShopItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@addShopItems',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'add-shop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'update-shop' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'shop/update/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@updateShopItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@updateShopItems',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'update-shop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.save-category' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'shop/add/save-category',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@saveUserShopCategory',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@saveUserShopCategory',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.save-category',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'delete-shop' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/delete/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@deleteShop',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@deleteShop',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'delete-shop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'deactivate-shop' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/deactivate/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@deactivateShop',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@deactivateShop',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'deactivate-shop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.save' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/save',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@savePost',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@savePost',
        'as' => 'post.save',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.edit' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/edit/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@editPost',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@editPost',
        'as' => 'post.edit',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.delete' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'post/delete/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@deletePost',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@deletePost',
        'as' => 'post.delete',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.like' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'post/like/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@postLike',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@postLike',
        'as' => 'post.like',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.comment' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/comment/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@commentOnPost',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@commentOnPost',
        'as' => 'post.comment',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.comment-reply' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/comment-reply/{comment_uid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@replyOnComment',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@replyOnComment',
        'as' => 'post.comment-reply',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.comment-approve' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/comment-approve/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@approveComment',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@approveComment',
        'as' => 'post.comment-approve',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.reply-approve' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/reply-approve/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@approveReply',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@approveReply',
        'as' => 'post.reply-approve',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.comment-delete' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/comment-delete/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@deleteComment',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@deleteComment',
        'as' => 'post.comment-delete',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'post.reply-delete' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'post/reply-delete/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@deleteReply',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@deleteReply',
        'as' => 'post.reply-delete',
        'namespace' => NULL,
        'prefix' => '/post',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'save-category' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'user/save-category',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@saveUserCategory',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@saveUserCategory',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'save-category',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'edit-category' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'edit-category/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@editWishCategory',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@editWishCategory',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'edit-category',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'delete-category' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'delete-category/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@deleteCategory',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@deleteCategory',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'delete-category',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'save_social_links' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'save_social_links',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\SocialLinksController@saveSocialLinks',
        'controller' => 'App\\Http\\Controllers\\Auth\\SocialLinksController@saveSocialLinks',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'save_social_links',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/authorize',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@index',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@index',
        'as' => 'stripe.index',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.connect' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'stripe/connect-init/{country?}/{currency?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@initConnect',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@initConnect',
        'as' => 'stripe.connect',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.mor-consent.store' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'stripe/mor-consent',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@storeMorConsent',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@storeMorConsent',
        'as' => 'stripe.mor-consent.store',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.return' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/response',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@connectReturn',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@connectReturn',
        'as' => 'stripe.return',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.login' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'stripe/login',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@loginToStripe',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@loginToStripe',
        'as' => 'stripe.login',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.enable.card.payments' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/enable_card_payments',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@enableCardPayments',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@enableCardPayments',
        'as' => 'stripe.enable.card.payments',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.upgrade.account' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/upgrade-express-account',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@upgradeStripeAccount',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@upgradeStripeAccount',
        'as' => 'stripe.upgrade.account',
        'namespace' => NULL,
        'prefix' => '/stripe',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter.card.verification' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-card-verification',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@gifterCardVerification',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@gifterCardVerification',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter.card.verification',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'card.verification.success' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'card-verification-success/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@cardVerificationSuccess',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@cardVerificationSuccess',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'card.verification.success',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'card.verification.failed' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'card-verification-failed/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@cardVerificationFailed',
        'controller' => 'App\\Http\\Controllers\\Auth\\RegisteredUserController@cardVerificationFailed',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'card.verification.failed',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'updateVat' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'update-vat/{percent}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@updateVat',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@updateVat',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'updateVat',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::iOnq1WXuEXVf0sG6' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'confirm-password',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ConfirmablePasswordController@store',
        'controller' => 'App\\Http\\Controllers\\Auth\\ConfirmablePasswordController@store',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::iOnq1WXuEXVf0sG6',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'password.update' => 
    array (
      'methods' => 
      array (
        0 => 'PUT',
      ),
      'uri' => 'password',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PasswordController@update',
        'controller' => 'App\\Http\\Controllers\\Auth\\PasswordController@update',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'password.update',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'edit-profile' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'edit-profile',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@updateProfile',
        'controller' => 'App\\Http\\Controllers\\ProfileController@updateProfile',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'edit-profile',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'notification-switch' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'notification-switch',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@notificationSwitch',
        'controller' => 'App\\Http\\Controllers\\ProfileController@notificationSwitch',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'notification-switch',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'account.2fa' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'setup/multi-step-verification',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:102:"function () {
                return \\Inertia\\Inertia::render(\'account/TwoFactorSetup\');
            }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009280000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'account.2fa',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'account' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'account',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:8412:"function () {
                try {
                    $user = \\Illuminate\\Support\\Facades\\Auth::user();
                    if (!$user) {
                        return \\redirect()->route(\'login\');
                    }

                    // ... existing logic ...
                    // I need to copy the whole closure or just insert before it. 
                    // To avoid copying the massive closure, I will use a different anchor.


                    $auto_tweet = (int)($user->auto_tweet ?? 0) === 1;
                    $pwaNotificationDetails = \\App\\Models\\BulkPwaNotification::where(\'creator_id\', $user->id)->latest()->get();

                    // Find the currently active subscription period
                    $now = \\Carbon\\Carbon::now();
                    $subscription = \\App\\Models\\MonthlyCharge::where(\'user_id\', $user->id)
                        ->where(function ($query) use ($now) {
                            $query->where(function ($q) use ($now) {
                                // Active subscription period
                                $q->whereDate(\'current_start_subscription_date\', \'<=\', $now)
                                    ->whereDate(\'current_end_subscription_date\', \'>=\', $now);
                            })->orWhere(function ($q) use ($now) {
                                // Active trial period
                                $q->whereDate(\'current_start_trial_date\', \'<=\', $now)
                                    ->whereDate(\'current_end_trial_date\', \'>=\', $now);
                            });
                        })
                        // Order by start date DESC to get the newest period first (handles overlapping periods on transition dates)
                        ->latest()
                        ->first();

                    // If no active period found, get the most recent one
                    if (!$subscription) {
                        $subscription = \\App\\Models\\MonthlyCharge::where(\'user_id\', $user->id)
                            ->latest()
                            ->first();
                    }

                    // Get complete subscription history for the user
                    $historyCollection = \\App\\Models\\MonthlyCharge::where(\'user_id\', $user->id)
                        ->latest()
                        ->get();
                    $subscription_history = $historyCollection->map(function ($charge) {
                        $fmt = function ($date) {
                            try {
                                return $date ? \\Carbon\\Carbon::parse($date)->format(\'d F Y\') : null;
                            } catch (\\Throwable $e) {
                                return null;
                            }
                        };
                        return [
                            \'id\' => $charge->id,
                            \'uuid\' => $charge->uuid,
                            \'stripe_id\' => $charge->stripe_id,
                            \'amount\' => (float)($charge->amount ?? 0),
                            \'currency\' => $charge->currency ?? \'GBP\',
                            \'status\' => $charge->status ?? \'pending\',
                            \'current_start_trial_date\' => $fmt($charge->current_start_trial_date),
                            \'current_end_trial_date\' => $fmt($charge->current_end_trial_date),
                            \'current_start_subscription_date\' => $fmt($charge->current_start_subscription_date),
                            \'current_end_subscription_date\' => $fmt($charge->current_end_subscription_date),
                            \'upcoming_payment\' => $fmt($charge->upcoming_payment),
                            \'created_at\' => $fmt($charge->created_at),
                            \'updated_at\' => $fmt($charge->updated_at),
                        ];
                    });

                    $site_subscription = [
                        \'status\' => \'INACTIVE\',
                        \'trial_status\' => null,
                        \'trial_start\' => null,
                        \'trial_end_in\' => null,
                        \'subscription_start\' => null,
                        \'subscription_end\' => null,
                        \'subscription_renew_in\' => null,
                        \'next_payment_date\' => null,
                        \'expired_at\' => null,
                    ];

                    if ($subscription) {
                        $trial_start = $subscription->current_start_trial_date;
                        $trial_end = $subscription->current_end_trial_date;
                        $subscription_start = $subscription->current_start_subscription_date;
                        $subscription_end = $subscription->current_end_subscription_date;

                        $now = \\Carbon\\Carbon::now();
                        $trialStartCarbon = $trial_start ? \\Carbon\\Carbon::parse($trial_start) : null;
                        $trialEndCarbon = $trial_end ? \\Carbon\\Carbon::parse($trial_end) : null;
                        $subStartCarbon = $subscription_start ? \\Carbon\\Carbon::parse($subscription_start) : null;
                        $subEndCarbon = $subscription_end ? \\Carbon\\Carbon::parse($subscription_end) : null;

                        $isTrialOngoing = $trialEndCarbon && $now->lessThan($trialEndCarbon);
                        $isTrialEnded = $trialEndCarbon && $now->greaterThanOrEqualTo($trialEndCarbon);
                        $isSubscriptionActive = \\in_array($subscription->status, [\'paid\', \'active\', \'renew\']) && $subEndCarbon && $now->lessThan($subEndCarbon);
                        $isExpired = $subEndCarbon && $now->greaterThanOrEqualTo($subEndCarbon);

                        // Format output
                        $site_subscription[\'trial_start\'] = $trialStartCarbon ? $trialStartCarbon->format(\'d F Y\') : null;
                        $site_subscription[\'trial_end_in\'] = $trialEndCarbon ? $trialEndCarbon->diffForHumans($now) : null;
                        $site_subscription[\'trial_status\'] = $isTrialOngoing ? \'active\' : \'ended\';

                        $site_subscription[\'subscription_start\'] = $subStartCarbon ? $subStartCarbon->format(\'d F Y\') : null;
                        $site_subscription[\'subscription_end\'] = $subEndCarbon ? $subEndCarbon->format(\'d F Y\') : null;
                        $site_subscription[\'subscription_renew_in\'] = $subEndCarbon ? $subEndCarbon->format(\'d F Y\') : null;
                        $site_subscription[\'expired_at\'] = $isExpired ? $subEndCarbon->diffForHumans($now) : null;

                        $site_subscription[\'next_payment_date\'] = $subEndCarbon ? $subEndCarbon->format(\'d F Y\') : null;
                        $site_subscription[\'subscription_status_code\'] = $user->subscription_status;
                        $site_subscription[\'status\'] = $user->display_subscription_status;
                        $site_subscription[\'is_cancelled\'] = $subscription->status === \'canceled\' || !empty($subscription->cancelled_at);
                    } else {
                        $site_subscription[\'status\'] = \'Not Subscribed\';
                        $site_subscription[\'subscription_status_code\'] = 3;
                    }

                    return \\Inertia\\Inertia::render(\'accountsetting/Accountsetting\', [
                        \'auto_tweet\' => $auto_tweet,
                        \'site_subscription\' => $site_subscription,
                        \'subscription_history\' => $subscription_history,
                        \'pwa_notification_details\' => $pwaNotificationDetails ?? null,
                        \'subscription_status\' => $user->subscription_status, // Add numeric status for debugging
                        \'webAuthnCredentials\' => \\Illuminate\\Support\\Facades\\Auth::user()->webAuthnCredentials()->exists(), // Add WebAuthn credentials existence for debugging
                    ]);
                } catch (\\Throwable $e) {
                    \\Illuminate\\Support\\Facades\\Log::error(\'Account page error\', [\'user_id\' => \\Illuminate\\Support\\Facades\\Auth::id(), \'error\' => $e->getMessage()]);
                    return \\Inertia\\Inertia::render(\'ErrorPage\', [
                        \'status\' => 500,
                        \'message\' => \'Something went wrong\',
                        \'consoleMessage\' => $e->getMessage(),
                    ]);
                }
            }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000093d0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'account',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'refer-and-earn' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'refer-and-earn',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ReferAndEarnController@index',
        'controller' => 'App\\Http\\Controllers\\ReferAndEarnController@index',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'refer-and-earn',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'create-referral-link' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'refer-and-earn/create-link',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ReferAndEarnController@createReferralLink',
        'controller' => 'App\\Http\\Controllers\\ReferAndEarnController@createReferralLink',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'create-referral-link',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'referral.redeem' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'refer-and-earn/redeem',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ReferAndEarnController@requestRedeem',
        'controller' => 'App\\Http\\Controllers\\ReferAndEarnController@requestRedeem',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'referral.redeem',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'check-adult-content' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'scanning/check-adult-content/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@checkAdultContent',
        'controller' => 'App\\Http\\Controllers\\ProfileController@checkAdultContent',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'check-adult-content',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'auto-tweet-setting' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'auto-tweet-setting',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@enableAutoTweet',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@enableAutoTweet',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'auto-tweet-setting',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'unlink-twitter' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'unlink-twitter',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@unlinkTwitter',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@unlinkTwitter',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'unlink-twitter',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user-tips' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'user-tips',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@userTips',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@userTips',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user-tips',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill-tracker' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'bill-tracker',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@billTracker',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@billTracker',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'bill-tracker',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.tracker' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership-tracker',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@membershipTracker',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@membershipTracker',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'membership.tracker',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.tracker' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop-tracker',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@shopTracker',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@shopTracker',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'shop.tracker',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'subscribed' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'subscribed',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@userSubscribed',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@userSubscribed',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'subscribed',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'cancel-subscription' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'cancel-subscription/{subscription_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@cancelSubscription',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@cancelSubscription',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'cancel-subscription',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'read-status' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'read-status/{payment_id}/{type}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@readStatus',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@readStatus',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'read-status',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
          4 => 'auth',
          5 => 'verified',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:1523:"function (\\Illuminate\\Support\\Facades\\Request $request) {
                $auth = \\Illuminate\\Support\\Facades\\Auth::user();
                $bills = \\App\\Models\\Bills::where(\'user_id\', $auth->id)->where(\'approved\', 1)->count();
                $membership = \\App\\Models\\Membership::where(\'user_id\', $auth->id)->where(\'approved\', 1)->count();
                // Check if MoR consent exists in the database
                $morConsentDetails = null;
                $morConsentGiven = \\App\\Models\\MorConsent::userHasGivenConsent($auth->id);
                if ($morConsentGiven) {
                    $latestConsent = \\App\\Models\\MorConsent::getLatestConsent($auth->id);
                    if ($latestConsent) {
                        $morConsentDetails = [
                            \'given_at\' => $latestConsent->consent_given_at->format(\'M d, Y h:i A\'),
                            \'ip_address\' => $latestConsent->ip_address,
                            \'device\' => $latestConsent->device_type,
                            \'location\' => $latestConsent->city ? $latestConsent->city . \', \' . $latestConsent->country : \'Unknown\'
                        ];
                    }
                }
                return \\Inertia\\Inertia::render(\'stripe/Stripe\', [
                    \'bills_count\' => $bills,
                    \'membership_count\' => $membership,
                    \'mor_consent_given\' => $morConsentGiven,
                    \'mor_consent_details\' => $morConsentDetails,
                ]);
            }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000094d0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'pin-item' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'pin-item/{wish_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@pinItem',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@pinItem',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'pin-item',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'x.init' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'twitter/init',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TwitterController@authInit',
        'controller' => 'App\\Http\\Controllers\\Auth\\TwitterController@authInit',
        'as' => 'x.init',
        'namespace' => NULL,
        'prefix' => '/twitter',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'x.handle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'twitter/authorize',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TwitterController@handleAuth',
        'controller' => 'App\\Http\\Controllers\\Auth\\TwitterController@handleAuth',
        'as' => 'x.handle',
        'namespace' => NULL,
        'prefix' => '/twitter',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'x.share' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'twitter/share/{uuid}/{type}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@shareOnTwitter',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@shareOnTwitter',
        'as' => 'x.share',
        'namespace' => NULL,
        'prefix' => '/twitter',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'add-goal' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'add-goal',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@addTipGoal',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@addTipGoal',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'add-goal',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'mark-goal' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'mark-complete-goal/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@markJarComplete',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@markJarComplete',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'mark-goal',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'all-goals' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'all-goals',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@allGoalsCreators',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@allGoalsCreators',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'all-goals',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'save' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'update/intro/video',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@saveIntroVideo',
        'controller' => 'App\\Http\\Controllers\\ProfileController@saveIntroVideo',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'save',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'intro.save' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'intro/save',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@saveIntroVideo',
        'controller' => 'App\\Http\\Controllers\\ProfileController@saveIntroVideo',
        'as' => 'intro.save',
        'namespace' => NULL,
        'prefix' => '/intro',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'intro.list' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'intro/list',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@getIntroVideo',
        'controller' => 'App\\Http\\Controllers\\ProfileController@getIntroVideo',
        'as' => 'intro.list',
        'namespace' => NULL,
        'prefix' => '/intro',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'intro.remove' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'intro/remove',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@removeIntro',
        'controller' => 'App\\Http\\Controllers\\ProfileController@removeIntro',
        'as' => 'intro.remove',
        'namespace' => NULL,
        'prefix' => '/intro',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'deliveries.dashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'deliveries/dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\DeliveriesController@index',
        'controller' => 'App\\Http\\Controllers\\DeliveriesController@index',
        'as' => 'deliveries.dashboard',
        'namespace' => NULL,
        'prefix' => '/deliveries',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'deliveries.stats' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'deliveries/stats',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\DeliveriesController@getDeliveryStats',
        'controller' => 'App\\Http\\Controllers\\DeliveriesController@getDeliveryStats',
        'as' => 'deliveries.stats',
        'namespace' => NULL,
        'prefix' => '/deliveries',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'deleteStripeAccount' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'DELETE',
        2 => 'HEAD',
      ),
      'uri' => 'delete-stripe-account/{accountid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@deleteStripeAccount',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@deleteStripeAccount',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'deleteStripeAccount',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'wish.subscribe.checkout.auth' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'wish-subscribe/checkout/{uuid}/{reccure?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@wishItemSubscribe',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@wishItemSubscribe',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'wish.subscribe.checkout.auth',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'mandatory.checkout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'mandatory-checkout',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@payMonthlyCharge',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@payMonthlyCharge',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'mandatory.checkout',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'mandatory.handle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'handle/{uuid}/{status}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@handleMandatorySubscription',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@handleMandatorySubscription',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'mandatory.handle',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'activate-subscription' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'activate-subscription',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:108:"function () {
                return \\Inertia\\Inertia::render(\'Profile/ActivateSubscription\');
            }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009600000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'activate-subscription',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'dalle.image' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'dalle-image',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@getImageGenerateAI',
        'controller' => 'App\\Http\\Controllers\\ProfileController@getImageGenerateAI',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'dalle.image',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'upload.dalle.image' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'upload-dalle-image',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@uploadDalleImage',
        'controller' => 'App\\Http\\Controllers\\ProfileController@uploadDalleImage',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'upload.dalle.image',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.identity.verification' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/identity-verification',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:617:"function () {
            $appUrl = \\config(\'app.url\'); // e.g. https://dev.spennypiggy.co
            // if (in_array($appUrl, [\'https://dev.spennypiggy.co\', \'http://127.0.0.1:8000\', \'http://localhost:8000\'])) {
            //     $user = Auth::user();
            //     $user->identity_admin_status = 0;
            //     $user->identity_status = 1;
            //     $user->save();
            // }
            return \\Inertia\\Inertia::render(\'Auth/StripeIdentity\', [
                \'status\' => false,
                \'message\' => \'Please complete your Stripe identity verification.\',
            ]);
        }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000092a0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe.identity.verification',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'say-thankyou' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'say-thankyou/{payment_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@sayThanks',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@sayThanks',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'say-thankyou',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'move-wish' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'update/move-wish',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@moveWishes',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@moveWishes',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'move-wish',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'earnings-page' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:89:"function () {
            return \\Inertia\\Inertia::render(\'earnings/Earnings\');
        }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009660000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'earnings-page',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'piggy-bank-setting' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'piggy-bank-setting',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@piggyBankSetting',
        'controller' => 'App\\Http\\Controllers\\ProfileController@piggyBankSetting',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'piggy-bank-setting',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'get-notification' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'get-notification',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@getNotifications',
        'controller' => 'App\\Http\\Controllers\\ProfileController@getNotifications',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'get-notification',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'mark-as-read' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'mark-as-read',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@markRead',
        'controller' => 'App\\Http\\Controllers\\ProfileController@markRead',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'mark-as-read',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'delete-all-notifications' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'delete-all-notifications',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@deleteAllNotifications',
        'controller' => 'App\\Http\\Controllers\\ProfileController@deleteAllNotifications',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'delete-all-notifications',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.dashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/dashboard/{tab?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@index',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@index',
        'as' => 'financial.dashboard',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.refresh' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'financial/refresh',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@refresh',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@refresh',
        'as' => 'financial.refresh',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.history' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/history',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@history',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@history',
        'as' => 'financial.history',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.profile.update' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'financial/profile',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@updateProfile',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@updateProfile',
        'as' => 'financial.profile.update',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.export.csv' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/export/csv',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@exportCsv',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@exportCsv',
        'as' => 'financial.export.csv',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.statement' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/statement',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@generateIncomeStatement',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@generateIncomeStatement',
        'as' => 'financial.statement',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.certificate' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/certificate',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorFinancialController@certificate',
        'controller' => 'App\\Http\\Controllers\\CreatorFinancialController@certificate',
        'as' => 'financial.certificate',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.expenses.index' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/expenses',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorExpenseController@index',
        'controller' => 'App\\Http\\Controllers\\CreatorExpenseController@index',
        'as' => 'financial.expenses.index',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.expenses.store' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'financial/expenses',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorExpenseController@store',
        'controller' => 'App\\Http\\Controllers\\CreatorExpenseController@store',
        'as' => 'financial.expenses.store',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.expenses.update' => 
    array (
      'methods' => 
      array (
        0 => 'PUT',
      ),
      'uri' => 'financial/expenses/{expense}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorExpenseController@update',
        'controller' => 'App\\Http\\Controllers\\CreatorExpenseController@update',
        'as' => 'financial.expenses.update',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.expenses.destroy' => 
    array (
      'methods' => 
      array (
        0 => 'DELETE',
      ),
      'uri' => 'financial/expenses/{expense}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\CreatorExpenseController@destroy',
        'controller' => 'App\\Http\\Controllers\\CreatorExpenseController@destroy',
        'as' => 'financial.expenses.destroy',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'earnings' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/all-data/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@earnings',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@earnings',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'earnings',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'graph-data' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/graph-data',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@graphData',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@graphData',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'graph-data',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top-wishes' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/top-wishes/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topWishes',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topWishes',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'top-wishes',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top-subscription' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/top-subscription/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topSubscription',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topSubscription',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'top-subscription',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top.paid.task' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/top-paid-task/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topPaidTask',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topPaidTask',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'top.paid.task',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top-bill' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/top-bill/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topBill',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topBill',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'top-bill',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top-shop' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/top-shop/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topShop',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topShop',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'top-shop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top-piggy-bank' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'earnings/top-piggy-bank/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topPiggyBank',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topPiggyBank',
        'namespace' => NULL,
        'prefix' => '/earnings',
        'where' => 
        array (
        ),
        'as' => 'top-piggy-bank',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:85:"function () {
            return \\Inertia\\Inertia::render(\'shop/ShopPage\');
        }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000096c0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'shop',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'orders-list' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/orders-list',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@ordersList',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@ordersList',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'orders-list',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::QzoexCC9VVgPU4Uj' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'create-applicant',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TestController@createApplicant',
        'controller' => 'App\\Http\\Controllers\\Auth\\TestController@createApplicant',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::QzoexCC9VVgPU4Uj',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::HROljq29ekrDQ7qf' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'generate-verification-link',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TestController@generateVerificationLink',
        'controller' => 'App\\Http\\Controllers\\Auth\\TestController@generateVerificationLink',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::HROljq29ekrDQ7qf',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::7J9RbeOtJFkd4grs' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'generate-backup-code',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@generateBackupCode',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@generateBackupCode',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::7J9RbeOtJFkd4grs',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::IxEG40wPteXX6epU' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'show-2fa-qr',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@show2faQR',
        'controller' => 'App\\Http\\Controllers\\ProfileController@show2faQR',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::IxEG40wPteXX6epU',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::LXLP3YcvPg96JVhp' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'switch-2fa',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@update2faStatus',
        'controller' => 'App\\Http\\Controllers\\ProfileController@update2faStatus',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::LXLP3YcvPg96JVhp',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::gj3sgwUGWKITOEqB' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'verification-2fa',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@verification2FA',
        'controller' => 'App\\Http\\Controllers\\ProfileController@verification2FA',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::gj3sgwUGWKITOEqB',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'report-content' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'report-content',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@reportContent',
        'controller' => 'App\\Http\\Controllers\\ProfileController@reportContent',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'report-content',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-items' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-wish-items/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterWishitems',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterWishitems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-items',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-subscriptions' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-subs/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterSubs',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterSubs',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-subscriptions',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-tips' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-tips/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterTips',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterTips',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-tips',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-access-posts' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-access-posts/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterAccessPosts',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterAccessPosts',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-access-posts',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-memberships' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-memberships/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterMemberships',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterMemberships',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-memberships',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-media' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-medias/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterMedia',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterMedia',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-media',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-content' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-content/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterContentFiles',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterContentFiles',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-content',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-bills' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-bills/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterBills',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterBills',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-bills',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-thanks-message' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-thanks-message/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterThanksMessages',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterThanksMessages',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-thanks-message',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gifter-subscription' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gifter-subscriptions/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@gifterSubscription',
        'controller' => 'App\\Http\\Controllers\\ProfileController@gifterSubscription',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gifter-subscription',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'support.story.page' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'support/{creator}/{gifter}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'check.block',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:200:"function ($creator, $gifter) {
            return \\Inertia\\Inertia::render(\'gifter/SupportStory\', [
                \'creator\' => $creator,
                \'gifter\' => $gifter
            ]);
        }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009930000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'support.story.page',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'support.story' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'support-story/{creator}/{gifter}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'check.block',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@supportStory',
        'controller' => 'App\\Http\\Controllers\\ProfileController@supportStory',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'support.story',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'support.story.react' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'support-story/{creator}/{gifter}/react',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'check.block',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@supportStoryReact',
        'controller' => 'App\\Http\\Controllers\\ProfileController@supportStoryReact',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'support.story.react',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'support.story.reply' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'support-story/{creator}/{gifter}/reply',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'check.block',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@supportStoryReply',
        'controller' => 'App\\Http\\Controllers\\ProfileController@supportStoryReply',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'support.story.reply',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'support.history.page' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'history',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@supportHistory',
        'controller' => 'App\\Http\\Controllers\\ProfileController@supportHistory',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'support.history.page',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'transactions.feed' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'history-feed',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@transactionsFeed',
        'controller' => 'App\\Http\\Controllers\\ProfileController@transactionsFeed',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'transactions.feed',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'redirecting' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'redirecting',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:83:"function () {
            return \\Inertia\\Inertia::render(\'Redirecting\');
        }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"000000000000099a0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'redirecting',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'cancel-subs' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'cancel-subs/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@cancelSubs',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@cancelSubs',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'cancel-subs',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'financial.evidence-pack' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'financial/evidence-pack/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\EvidencePackController@generate',
        'controller' => 'App\\Http\\Controllers\\EvidencePackController@generate',
        'as' => 'financial.evidence-pack',
        'namespace' => NULL,
        'prefix' => '/financial',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator.store.address' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'creator-store-address',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@creatorStoreAddress',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@creatorStoreAddress',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creator.store.address',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'get.creator.address' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'get-creator-address',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@getCreatorStoreAddress',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@getCreatorStoreAddress',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'get.creator.address',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'create.creator.product' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'create-creator-product',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@createRyeProduct',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@createRyeProduct',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'create.creator.product',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'delete.creator.products' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'delete-creator-products/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@deleteAndRestoredRyeProduct',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@deleteAndRestoredRyeProduct',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'delete.creator.products',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'create.cart' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'create-cart',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@createCart',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@createCart',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'create.cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'check.cart.exist' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'check-cart-exist/{creator_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@checkCartExist',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@checkCartExist',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'check.cart.exist',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'handle.rye.product.payment' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'handle-rye-product-payment',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustCompletedCardVerification',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@handleRyeProductPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@handleRyeProductPayment',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'handle.rye.product.payment',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'remove.cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'remove-cart/{cart_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@removeCart',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@removeCart',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'remove.cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'rye.success.payment' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'rye-success-payment/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@ryeSuccessPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@ryeSuccessPayment',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'rye.success.payment',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'rye.cancel.payment' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'rye-cancel-payment/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@ryeCancelPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@ryeCancelPayment',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'rye.cancel.payment',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'store.product.order.details' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'store-product-order-details',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@storeProductOrderDetails',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@storeProductOrderDetails',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'store.product.order.details',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'get_category_data' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'get_category_data/{category}/{user_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@categoryItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@categoryItems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'get_category_data',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'users' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'users',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MyController@getUsers',
        'controller' => 'App\\Http\\Controllers\\Auth\\MyController@getUsers',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'users',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'send-surprize' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'send-surprize',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@sendSurprise',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@sendSurprise',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'send-surprize',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'update.profile.lock.status' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'update-profile-lock-status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\ProfileController@updateProfileLockStatus',
        'controller' => 'App\\Http\\Controllers\\ProfileController@updateProfileLockStatus',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'update.profile.lock.status',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.follow.unfollow' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'user-follow-unfollow',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PwaNotification@userFollowUnFollow',
        'controller' => 'App\\Http\\Controllers\\Auth\\PwaNotification@userFollowUnFollow',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.follow.unfollow',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'send.pwa.to.follower' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'send-pwa-to-follower',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PwaNotification@sendPwaToFollower',
        'controller' => 'App\\Http\\Controllers\\Auth\\PwaNotification@sendPwaToFollower',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'send.pwa.to.follower',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'send.automatically.follow.request.to.all' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'send-automatically-follow-request-to-all',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PwaNotification@sendAutomaticallyFollowRequestToAll',
        'controller' => 'App\\Http\\Controllers\\Auth\\PwaNotification@sendAutomaticallyFollowRequestToAll',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'send.automatically.follow.request.to.all',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop-list' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/list/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@shopList',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@shopList',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop-list',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'single-shop-list' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/item/{slug}/{uuid}/{session_id?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@singleShopList',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@singleShopList',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'single-shop-list',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'buy-shop-item' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'shop/buy/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@buyShopItem',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@buyShopItem',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'buy-shop-item',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'answerPayment' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'shop/answer-to-payment/{payment_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@answerPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@answerPayment',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'answerPayment',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.success-payment' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/success-payment/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@successPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@successPayment',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.success-payment',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.cancel-payment' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/cancel-payment/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@cancelPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@cancelPayment',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.cancel-payment',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.shipping-price' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/shipping-price/{shop_id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@shippingPrice',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@shippingPrice',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.shipping-price',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.shipping-profiles' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/shipping-profiles',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@getShippingProfiles',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@getShippingProfiles',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.shipping-profiles',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.shipping-profile.save' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'shop/shipping-profile/save',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@saveShippingProfile',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@saveShippingProfile',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.shipping-profile.save',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.shipping-profile.delete' => 
    array (
      'methods' => 
      array (
        0 => 'DELETE',
      ),
      'uri' => 'shop/shipping-profile/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@deleteShippingProfile',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@deleteShippingProfile',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.shipping-profile.delete',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'shop.fulfillment.update' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'shop/fulfillment/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\ShopsController@updateFulfillment',
        'controller' => 'App\\Http\\Controllers\\Auth\\ShopsController@updateFulfillment',
        'namespace' => NULL,
        'prefix' => '/shop',
        'where' => 
        array (
        ),
        'as' => 'shop.fulfillment.update',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'create.checkout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'create-checkout-session/{creator_id}/{user_id_or_device?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'mustCompletedCardVerification',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\CheckoutController@createCheckout',
        'controller' => 'App\\Http\\Controllers\\Auth\\CheckoutController@createCheckout',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'create.checkout',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'checkout.success' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'success-checkout/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\CheckoutController@successCheckout',
        'controller' => 'App\\Http\\Controllers\\Auth\\CheckoutController@successCheckout',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'checkout.success',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'checkout.cancel' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'cancel-checkout/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\CheckoutController@cancelCheckout',
        'controller' => 'App\\Http\\Controllers\\Auth\\CheckoutController@cancelCheckout',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'checkout.cancel',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'get.cart.details' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'get-cart-details',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@getCartDetails',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@getCartDetails',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'get.cart.details',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'add-to-cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'add-to-cart/{uuid}/{device_id}/{sub}/{amount?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@addToCart',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@addToCart',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'add-to-cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'anonymous-cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'anonymous-cart/{deviceId}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@anonymousCartItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@anonymousCartItems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'anonymous-cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'authenticated-cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'authenticated-cart',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@authenticatedCartItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@authenticatedCartItems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'authenticated-cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'clear-cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'clear-cart/{device_id}/{ownerid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@clearCart',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@clearCart',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'clear-cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'cart.updatequantity' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'cart-update-quantity/{uuid}/{quantity}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@updateCartQuantity',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@updateCartQuantity',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'cart.updatequantity',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'cart',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@cartItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@cartItems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'tip-jar.pay' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'tip-jar/pay/{creator_uid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@tipToJar',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@tipToJar',
        'as' => 'tip-jar.pay',
        'namespace' => NULL,
        'prefix' => '/tip-jar',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'tip-jar.handle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'tip-jar/handle/{uuid}/{status?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@handleTipJarPayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@handleTipJarPayment',
        'as' => 'tip-jar.handle',
        'namespace' => NULL,
        'prefix' => '/tip-jar',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.goal' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'user/tip/goal/{username?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@usergoal',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@usergoal',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.goal',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'counter' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'counter/{deviceid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@wish_counter',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@wish_counter',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'counter',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::X8ofJBgRuH9mdiPi' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'user/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\VerifyEmailController@emailVerify',
        'controller' => 'App\\Http\\Controllers\\Auth\\VerifyEmailController@emailVerify',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::X8ofJBgRuH9mdiPi',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'how-it-works' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'how-it-works',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:72:"function () {
    return \\Inertia\\Inertia::render(\'howitworks/Works\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009c60000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'how-it-works',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'terms-and-conditions' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'terms-and-conditions',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@terms',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@terms',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'terms-and-conditions',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator-agreement' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator-agreement',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@creatorAgreement',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@creatorAgreement',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creator-agreement',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'supporter-terms' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'supporter-terms',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@supporterTerms',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@supporterTerms',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'supporter-terms',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'creator-supporter-contract' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'creator-supporter-contract',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@creatorSupporterContract',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@creatorSupporterContract',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'creator-supporter-contract',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'mor-agreement' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'mor-agreement',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@morAgreement',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@morAgreement',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'mor-agreement',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'reserves-and-payments-policy' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'reserves-and-payments-policy',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@paymentsPolicy',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@paymentsPolicy',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'reserves-and-payments-policy',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'paid-tasks-terms' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'paid-tasks-terms',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@paidTasksTerms',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@paidTasksTerms',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'paid-tasks-terms',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'return-policy' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'return-policy',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@returnPolicy',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@returnPolicy',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'return-policy',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'us-addendum' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'us-addendum',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@usAddendum',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@usAddendum',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'us-addendum',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'copyright-policy' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'copyright-policy',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@copyrightPolicy',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@copyrightPolicy',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'copyright-policy',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'accept-terms' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'accept-terms',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'App\\Http\\Controllers\\StaticPageController@acceptTerms',
        'controller' => 'App\\Http\\Controllers\\StaticPageController@acceptTerms',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'accept-terms',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'promotion-terms' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'promotion-terms',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:66:"function () {
    return \\Inertia\\Inertia::render(\'Promotions\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009c80000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'promotion-terms',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::XVcfwzD0CAiuBUIA' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'files/{filename}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:135:"function (string $filename) {
    $fullPath = \\asset($filename);
    return \\Illuminate\\Support\\Facades\\Storage::response($fullPath);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009d50000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::XVcfwzD0CAiuBUIA',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'largest-gifts' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'recent-gifters/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@recentGifters',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@recentGifters',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'largest-gifts',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'leaderboard.stars' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'leaderboard/star/lists',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topGiftersAllTime',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topGiftersAllTime',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'leaderboard.stars',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'largest.gifts.alltime' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'largest/gifts/alltime',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@top10UniqueBiggestGifters',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@top10UniqueBiggestGifters',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'largest.gifts.alltime',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'top-supporters-frequency' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'top-supporters/frequency',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topSupportersByFrequency',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@topSupportersByFrequency',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'top-supporters-frequency',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'leaderboard.platform-analytics' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'leaderboard/platform-analytics',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@platformAnalytics',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@platformAnalytics',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'leaderboard.platform-analytics',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'leaderboard.growth-trends' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'leaderboard/growth-trends',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@growthTrends',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@growthTrends',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'leaderboard.growth-trends',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'leaderboard.category-leaders' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'leaderboard/category-leaders',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@categoryLeaders',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@categoryLeaders',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'leaderboard.category-leaders',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'leaderboard.vip-supporters' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'leaderboard/vip-supporters',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@vipSupporters',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@vipSupporters',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'leaderboard.vip-supporters',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'leaderboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'leaderboard/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@wishtenderWishers',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@wishtenderWishers',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'leaderboard',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'first-three-wishes' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'first-three-leaderboard/{type?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@firstThreeWisher',
        'controller' => 'App\\Http\\Controllers\\Auth\\LeaderBoardController@firstThreeWisher',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'first-three-wishes',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/test',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:68:"function () {
        return \\Inertia\\Inertia::render(\'Test\');
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009e10000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'test',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'intercom.diagnostic' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-intercom-diagnostic',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:50:"function () {
    return \\view(\'intercom-test\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009e30000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'intercom.diagnostic',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'problem-solving' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'problem-solving',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:299:"function () {
    $nums = [3, 4, 2, 5];
    $a = [];
    foreach ($nums as $key => $value) {
        $multiple = 1;
        foreach ($nums as $k => $v) {
            if ($k != $key) {
                $multiple *= $v;
            }
        }
        \\array_push($a, $multiple);
    }
    return $a;
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009e50000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'problem-solving',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::pLOzTn3dAupQq4DQ' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'twitter-token',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TwitterController@twitterAuthUrl',
        'controller' => 'App\\Http\\Controllers\\Auth\\TwitterController@twitterAuthUrl',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::pLOzTn3dAupQq4DQ',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::ZZa938D0KtICofbn' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'twitter/login',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TwitterController@twitterLogin',
        'controller' => 'App\\Http\\Controllers\\Auth\\TwitterController@twitterLogin',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::ZZa938D0KtICofbn',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'username.check' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'check-username/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@checkUserName',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@checkUserName',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'username.check',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.sociallinks' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'sociallinks/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@sociallinks',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@sociallinks',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.sociallinks',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'gift.items' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'gift-items/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@userGiftItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@userGiftItems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'gift.items',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.posts.comments' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'comments/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\PostsController@allComments',
        'controller' => 'App\\Http\\Controllers\\Auth\\PostsController@allComments',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.posts.comments',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'founder.bonus' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'founder/bonus',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@index',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@index',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'founder.bonus',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'founder.data' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'founder/data',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@getData',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@getData',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'founder.data',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'founder.leaderboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'founder/leaderboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@getLeaderboard',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@getLeaderboard',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'founder.leaderboard',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'founder.program' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'founder-program',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@programInfo',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@programInfo',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'founder.program',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'founder.qualify-winners' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'founder/qualify-winners',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@qualifyWinners',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@qualifyWinners',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'founder.qualify-winners',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'founder.settle-payouts' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'founder/settle-payouts',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\FounderBonusController@settlePayouts',
        'controller' => 'App\\Http\\Controllers\\FounderBonusController@settlePayouts',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'founder.settle-payouts',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.dashboard' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/dashboard',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@index',
        'controller' => 'App\\Http\\Controllers\\TaskController@index',
        'as' => 'task.dashboard',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.create' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/create',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@create',
        'controller' => 'App\\Http\\Controllers\\TaskController@create',
        'as' => 'task.create',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.store' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'task',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@store',
        'controller' => 'App\\Http\\Controllers\\TaskController@store',
        'as' => 'task.store',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.purchase' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'task/{uuid}/purchase',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@purchase',
        'controller' => 'App\\Http\\Controllers\\TaskController@purchase',
        'as' => 'task.purchase',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.success' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/{uuid}/success',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@success',
        'controller' => 'App\\Http\\Controllers\\TaskController@success',
        'as' => 'task.success',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.download' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/{uuid}/download',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@download',
        'controller' => 'App\\Http\\Controllers\\TaskController@download',
        'as' => 'task.download',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.order' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/order/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@order',
        'controller' => 'App\\Http\\Controllers\\TaskController@order',
        'as' => 'task.order',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.upload-proof' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'task/purchase/{uuid}/upload',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@uploadProof',
        'controller' => 'App\\Http\\Controllers\\TaskController@uploadProof',
        'as' => 'task.upload-proof',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.review-proof' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'task/purchase/{uuid}/review',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@reviewProof',
        'controller' => 'App\\Http\\Controllers\\TaskController@reviewProof',
        'as' => 'task.review-proof',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.edit' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/{uuid}/edit',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@edit',
        'controller' => 'App\\Http\\Controllers\\TaskController@edit',
        'as' => 'task.edit',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.update' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'task/{uuid}/update',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'verified',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@update',
        'controller' => 'App\\Http\\Controllers\\TaskController@update',
        'as' => 'task.update',
        'namespace' => NULL,
        'prefix' => '/task',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.purchase.redirect' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/{uuid}/purchase',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:71:"function ($uuid) {
    return \\redirect()->route(\'task.show\', $uuid);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000009ee0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'task.purchase.redirect',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'task.show' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'task/{uuid}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\TaskController@show',
        'controller' => 'App\\Http\\Controllers\\TaskController@show',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'task.show',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.items' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'items/{username}/{category_id?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@userItems',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@userItems',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.items',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.category' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'user/category/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@user_category',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@user_category',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.category',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.shop.category' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'shop/user_shop_category/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@user_shop_category',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@user_shop_category',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.shop.category',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'wish.show' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => '{username}/wish/{id}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'check.block',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:269:"function ($username, $id) {
    $wish = \\App\\Models\\WishItem::find($id);
    $uuid = $wish?->uuid ?? $id;
    \\request()->merge([\'item\' => $uuid]);
    return \\app(\\App\\Http\\Controllers\\Auth\\AuthenticatedSessionController::class)->getUserProfile($username, \'wishes\');
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a040000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'wish.show',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'user.show' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => '{username}/{page?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'check.block',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@getUserProfile',
        'controller' => 'App\\Http\\Controllers\\Auth\\AuthenticatedSessionController@getUserProfile',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'user.show',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'wish.subscribe.checkout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'POST',
        2 => 'HEAD',
      ),
      'uri' => 'wish/checkout/{uuid}/{reccure?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'mustCompletedCardVerification',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@wishItemSubscribe',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@wishItemSubscribe',
        'as' => 'wish.subscribe.checkout',
        'namespace' => NULL,
        'prefix' => '/wish',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'wish.subscribe.handle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'wish/handle/{uuid}/{status}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@handleSubscription',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@handleSubscription',
        'as' => 'wish.subscribe.handle',
        'namespace' => NULL,
        'prefix' => '/wish',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'thank-you' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'payment/thankyou/{username}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:866:"function (\\Illuminate\\Http\\Request $request, $username) {
    $owner = \\App\\Models\\User::where(\'username\', $username)->first();
    return \\Inertia\\Inertia::render(\'Profile/Thankyou\', [
        \'owner\' => $owner,
        \'type\' => $request->query(\'type\'),
        \'item_name\' => $request->query(\'item_name\'),
        \'amount\' => $request->query(\'amount\'),
        \'currency\' => $request->query(\'currency\'),
        \'benefits\' => $request->query(\'benefits\'),
        \'item_id\' => $request->query(\'item_id\'),
        \'item_slug\' => $request->query(\'item_slug\'),
        \'is_instant\' => $request->query(\'is_instant\'),
        \'wish_content\' => $request->query(\'wish_content\'),
        \'success_page_type\' => $request->query(\'success_page_type\'),
        \'ask_question\' => $request->query(\'ask_question\'),
        \'payment_id\' => $request->query(\'payment_id\'),
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a070000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'thank-you',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'membership.handle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'membership/handle/{uuid}/{status}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\MembershipController@handlePayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\MembershipController@handlePayment',
        'as' => 'membership.handle',
        'namespace' => NULL,
        'prefix' => '/membership',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'bill.handle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'bill/handle/{uuid}/{status}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\BillsController@handlePayment',
        'controller' => 'App\\Http\\Controllers\\Auth\\BillsController@handlePayment',
        'as' => 'bill.handle',
        'namespace' => NULL,
        'prefix' => '/bill',
        'where' => 
        array (
        ),
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'image-dalle' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'image/dalle',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TestController@testAiImage',
        'controller' => 'App\\Http\\Controllers\\Auth\\TestController@testAiImage',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'image-dalle',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'remove-from-cart' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'remove-from-cart/{uuid}/{device_id?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\WishitemController@removeSurpriseFromCart',
        'controller' => 'App\\Http\\Controllers\\Auth\\WishitemController@removeSurpriseFromCart',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'remove-from-cart',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe-payout' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/manual/payout',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\TestController@manualPayout',
        'controller' => 'App\\Http\\Controllers\\Auth\\TestController@manualPayout',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe-payout',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::uZ5yZVFwvyLC4vYj' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'delete-connected-account/{accountId}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@deleteConnectedAccount',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@deleteConnectedAccount',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::uZ5yZVFwvyLC4vYj',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.migrate-account' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'stripe/migrate-account/{userId?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@migrateAccount',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@migrateAccount',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe.migrate-account',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'stripe.check-migration' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'stripe/check-migration/{userId?}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\Auth\\StripeController@checkMigrationNeeds',
        'controller' => 'App\\Http\\Controllers\\Auth\\StripeController@checkMigrationNeeds',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'stripe.check-migration',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::T9cy89SZLs5rTqfQ' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'force-error/error/file',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:64:"function () {
    throw new \\Exception("Testing Handler.php");
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a130000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::T9cy89SZLs5rTqfQ',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::ePQzkMRMCuxCgdZJ' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-middleware-test',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
          2 => 'mustCompletedStripeIdentity',
          3 => 'mustHaveToVerify',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:455:"function () {
        $user = \\auth()->user();
        return \\response()->json([
            \'success\' => true,
            \'message\' => \'Middleware passed successfully\',
            \'user\' => $user instanceof \\App\\Models\\User ? [
                \'id\' => $user->id,
                \'email\' => $user->email,
                \'role\' => $user->role,
                \'subscription_status\' => $user->subscription_status,
            ] : null,
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a160000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::ePQzkMRMCuxCgdZJ',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::BudWXhAi1dyJB2tS' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-date/subscription/{date}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:2186:"function ($date) {
        $user = \\auth()->user();
        
        // Parse the test date
        $testDate = \\Carbon\\Carbon::parse($date);
        
        // Find active subscription for the test date
        $subscription = \\App\\Models\\MonthlyCharge::where(\'user_id\', $user->id)
            ->where(function($query) use ($testDate) {
                $query->where(function($q) use ($testDate) {
                    $q->whereDate(\'current_start_subscription_date\', \'<=\', $testDate)
                      ->whereDate(\'current_end_subscription_date\', \'>=\', $testDate);
                });
            })
            ->orderByDesc(\'current_start_subscription_date\')
            ->first();
        
        $site_subscription = [
            \'status\' => \'INACTIVE\',
            \'subscription_start\' => null,
            \'subscription_end\' => null,
            \'next_payment_date\' => null,
        ];
        
        if ($subscription) {
            $startDate = \\Carbon\\Carbon::parse($subscription->current_start_subscription_date);
            $endDate = \\Carbon\\Carbon::parse($subscription->current_end_subscription_date);
            
            $isSubscriptionActive = $user->is_subscribed == 1 && $testDate->lessThan($endDate);
            
            $site_subscription = [
                \'status\' => $isSubscriptionActive ? \'ACTIVE\' : \'EXPIRED\',
                \'subscription_start\' => $startDate->format(\'d F Y\'),
                \'subscription_renew_in\' => $endDate->format(\'d F Y\'),
                \'next_payment_date\' => $endDate->format(\'d F Y\'),
                \'subscription_period\' => $startDate->format(\'d M Y\') . \' - \' . $endDate->format(\'d M Y\'),
                \'amount\' => $subscription->currency . $subscription->amount,
                \'days_until_renewal\' => $testDate->diffInDays($endDate, false)
            ];
        }
        
        return \\response()->json([
            \'test_date\' => $testDate->format(\'Y-m-d H:i:s\'),
            \'user_id\' => $user->id,
            \'username\' => $user->username,
            \'subscription_info\' => $site_subscription,
            \'subscription_record_id\' => $subscription ? $subscription->id : null
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a190000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-date',
        'where' => 
        array (
        ),
        'as' => 'generated::BudWXhAi1dyJB2tS',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::Xfaq2oI2mh5KcUfR' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-date/current',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:99:"function () {
        return \\redirect("/test-date/subscription/" . \\now()->format(\'Y-m-d\'));
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a1b0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-date',
        'where' => 
        array (
        ),
        'as' => 'generated::Xfaq2oI2mh5KcUfR',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::KkPwX6JNWU2qlH78' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-date/october-3',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:83:"function () {
        return \\redirect("/test-date/subscription/2025-10-03");
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a1d0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-date',
        'where' => 
        array (
        ),
        'as' => 'generated::KkPwX6JNWU2qlH78',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::3We6vLoqnPqYC4ng' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-date/october-4',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:83:"function () {
        return \\redirect("/test-date/subscription/2025-10-04");
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a1f0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-date',
        'where' => 
        array (
        ),
        'as' => 'generated::3We6vLoqnPqYC4ng',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::k6azhEURUIj552OP' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-subscription/my-status',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:596:"function () {
        $user = \\auth()->user();
        $service = \\app(\\App\\Services\\CreatorSubscriptionService::class);
        
        return \\response()->json([
            \'user_id\' => $user->id,
            \'username\' => $user->username,
            \'role\' => $user->role,
            \'subscription_validation\' => $service->validateCreatorSubscription($user),
            \'subscription_accessor\' => $user->subscription_status,
            \'monthly_subscription\' => $user->creatorMonthlySubscription,
            \'needs_warning\' => $service->needsSubscriptionWarning($user)
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a210000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-subscription',
        'where' => 
        array (
        ),
        'as' => 'generated::k6azhEURUIj552OP',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::SfMUxhhDmfgGpz2V' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-subscription/user/{userId}',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:625:"function ($userId) {
        $user = \\App\\Models\\User::findOrFail($userId);
        $service = \\app(\\App\\Services\\CreatorSubscriptionService::class);
        
        return \\response()->json([
            \'user_id\' => $user->id,
            \'username\' => $user->username,
            \'role\' => $user->role,
            \'subscription_validation\' => $service->validateCreatorSubscription($user),
            \'subscription_accessor\' => $user->subscription_status,
            \'monthly_subscription\' => $user->creatorMonthlySubscription,
            \'needs_warning\' => $service->needsSubscriptionWarning($user)
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a230000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-subscription',
        'where' => 
        array (
        ),
        'as' => 'generated::SfMUxhhDmfgGpz2V',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::99IC2r7dNgoY2aVd' => 
    array (
      'methods' => 
      array (
        0 => 'POST',
      ),
      'uri' => 'test-subscription/validate-payment',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:816:"function () {
        $user = \\auth()->user();
        $service = \\app(\\App\\Services\\CreatorSubscriptionService::class);
        
        $paymentData = [
            \'payer\' => \\auth()->user(),
            \'amount\' => \\request()->input(\'amount\', 100),
            \'currency\' => \\request()->input(\'currency\', \'USD\'),
            \'payment_type\' => \\request()->input(\'payment_type\', \'test\'),
            \'payment_method\' => \'stripe\',
        ];
        
        $validation = $service->validatePaymentSubscription($user, $paymentData);
        
        return \\response()->json([
            \'user_id\' => $user->id,
            \'username\' => $user->username,
            \'payment_data\' => $paymentData,
            \'validation_result\' => $validation,
            \'blocked\' => !$validation[\'eligible\']
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a250000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-subscription',
        'where' => 
        array (
        ),
        'as' => 'generated::99IC2r7dNgoY2aVd',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::9S1HpskHUhzyxhNN' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-subscription/creators-needing-warnings',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'auth',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:742:"function () {
        $service = \\app(\\App\\Services\\CreatorSubscriptionService::class);
        $creators = $service->getCreatorsNeedingSubscriptionWarnings();
        
        return \\response()->json([
            \'count\' => $creators->count(),
            \'creators\' => $creators->map(function ($creator) use ($service) {
                return [
                    \'id\' => $creator->id,
                    \'username\' => $creator->username,
                    \'subscription_status\' => $creator->subscription_status,
                    \'validation\' => $service->validateCreatorSubscription($creator),
                    \'needs_warning\' => $service->needsSubscriptionWarning($creator)
                ];
            })
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a270000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '/test-subscription',
        'where' => 
        array (
        ),
        'as' => 'generated::9S1HpskHUhzyxhNN',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'preview.pending-approval' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => '_preview/pending-approval',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
          1 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:287:"function () {
        if (!\\app()->isLocal()) {
            \\abort(403);
        }

        $items = \\app(\\App\\Services\\PendingApprovalService::class)->collectPendingItems();
        return \\view(\'email.pending_approval_summary\', [
            \'pendingItems\' => $items,
        ]);
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a290000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'preview.pending-approval',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'test.intercom' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test-intercom',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:76:"function () {
        return \\Inertia\\Inertia::render(\'TestIntercom\');
    }";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a150000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'test.intercom',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'debug.intercom' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'debug-intercom',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'App\\Http\\Controllers\\IntercomDebugController@debug',
        'controller' => 'App\\Http\\Controllers\\IntercomDebugController@debug',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'debug.intercom',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'generated::c8aQE3gkCrYFJwEL' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'test/scheduler/is/running',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:696:"function () {
    // Caching disabled for production stability
    $lastRun = null;
    $lastRunDynamo = null;

    // Determine effective last run
    $effectiveLastRun = $lastRun ?: $lastRunDynamo;

    return \\response()->json([
        \'status\' => $effectiveLastRun ? \'active\' : \'inactive\',
        \'last_run\' => $lastRun,
        \'last_run_dynamodb\' => $lastRunDynamo,
        \'server_time\' => \\now()->toDateTimeString(),
        \'diff_seconds\' => $effectiveLastRun ? \\now()->diffInSeconds(\\Carbon\\Carbon::parse($effectiveLastRun)) : null,
        \'cache_driver\' => \\config(\'cache.default\'),
        \'cache_store\' => \\config(\'cache.stores.\' . \\config(\'cache.default\') . \'.driver\'),
    ]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a2c0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'generated::c8aQE3gkCrYFJwEL',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
    'api.user-country' => 
    array (
      'methods' => 
      array (
        0 => 'GET',
        1 => 'HEAD',
      ),
      'uri' => 'api/user-country',
      'action' => 
      array (
        'middleware' => 
        array (
          0 => 'web',
        ),
        'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:384:"function (\\Illuminate\\Http\\Request $request) {
    $country = $request->header(\'CF-IPCountry\')
        ?? $request->header(\'X-Country-Code\')
        ?? \'GB\';
    // CF-IPCountry returns \'XX\' for unknown — fall back to GB
    if ($country === \'XX\' || \\strlen($country) !== 2) {
        $country = \'GB\';
    }
    return \\response()->json([\'country_code\' => \\strtoupper($country)]);
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"0000000000000a2e0000000000000000";}}',
        'namespace' => NULL,
        'prefix' => '',
        'where' => 
        array (
        ),
        'as' => 'api.user-country',
      ),
      'fallback' => false,
      'defaults' => 
      array (
      ),
      'wheres' => 
      array (
      ),
      'bindingFields' => 
      array (
      ),
      'lockSeconds' => NULL,
      'waitSeconds' => NULL,
      'withTrashed' => false,
    ),
  ),
)
);
