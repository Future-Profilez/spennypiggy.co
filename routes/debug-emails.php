<?php

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

// ─── Only available in local / dev — never in production ───────────────────
// Guard against re-declaration: this file declares a class + helper functions at
// include time, and the test suite boots the app multiple times in one PHP process.
// Without this guard the second include fatals with "Cannot declare class FakeModel".
if (! app()->isProduction() && ! defined('SPENNY_DEBUG_EMAILS_LOADED')) {
    define('SPENNY_DEBUG_EMAILS_LOADED', true);

    // ── Magic fake model — handles any property/method/foreach on any template ──
    class FakeModel implements \IteratorAggregate, \Countable
    {
        private static array $stringHints = [
            'name' => 'Demo User',
            'email' => 'demo@spennypiggy.co',
            'title' => 'Demo Title',
            'currency' => 'GBP',
            'ISO' => 'GBP',
            'symbol' => '£',
            'slug' => 'demo-creator',
            'username' => 'democreator',
            'status' => 'active',
            'type' => 'creator',
            'message' => 'This is a demo message for preview purposes.',
            'reason' => 'Demo rejection reason.',
            'description' => 'Demo description.',
            'url' => '#',
        ];

        private static array $numberHints = [
            'amount' => 1000,
            'net_amount' => 850,
            'gross_amount' => 1000,
            'fee' => 150,
            'id' => 1,
            'user_id' => 1,
            'role' => 1,
            'anonymous' => 0,
            'count' => 3,
        ];

        // No recursion — foreach yields two simple child instances
        public function getIterator(): \Traversable
        {
            return new \ArrayIterator([new self(), new self()]);
        }

        public function count(): int { return 2; }

        public function __get(string $name): mixed
        {
            if (isset(self::$stringHints[$name])) {
                return self::$stringHints[$name];
            }
            if (isset(self::$numberHints[$name])) {
                return self::$numberHints[$name];
            }
            return new self();
        }

        public function __set(string $name, mixed $value): void {}

        public function __call(string $name, array $args): mixed
        {
            return match ($name) {
                'format'         => date($args[0] ?? 'F Y'),
                'count'          => 2,
                'sum', 'total'   => '£10.00',
                'getFormattedBonusAmount', 'getFormattedAmount' => '500.00',
                'toArray'        => [],
                'first'          => new self(),
                'last'           => new self(),
                'toDateTimeString', 'toDateString' => now()->toDateTimeString(),
                default          => new self(),
            };
        }

        public function __toString(): string
        {
            return 'Demo';
        }
    }

    // ── Shared fake data bag covering all common template variables ───────────
    function emailFakeData(): array
    {
        $fake = new FakeModel();
        return [
            // User / people
            'user'                  => $fake,
            'creator'               => $fake,
            'supporter'             => $fake,
            'admin'                 => $fake,
            'fan'                   => $fake,

            // Payments / amounts
            'payment'               => $fake,
            'purchase'              => $fake,
            'bill_pay'              => $fake,
            'subscription'          => $fake,
            'membership'            => $fake,
            'contribution'          => $fake,
            'piggyPot'              => $fake,
            'shopPayment'           => $fake,
            'tipGoalPayment'        => $fake,
            'amount'                => '£10.00',
            'amountWithVat'         => '£12.00',
            'currencySymbol'        => '£',
            'netAmount'             => '£8.50',
            'platformFee'           => '£1.50',

            // Tasks / deliverables
            'task'                  => $fake,
            'taskPurchase'          => $fake,
            'contentDeliverables'   => [$fake, $fake],
            'certificateDeliverables' => [$fake, $fake],
            'deliverables'          => [$fake, $fake],

            // Founder / bonus
            'founderBonus'          => $fake,
            'fastStartBonus'        => $fake,
            'bonusAmount'           => '£500.00',
            'bonusMonth'            => 'June 2025',
            'bonusPeriod'           => 'June 2025',

            // Shop / product
            'shop'                  => $fake,
            'order'                 => $fake,
            'product'               => $fake,
            'item'                  => $fake,

            // Support / tickets
            'ticket'                => $fake,
            'supportTicket'         => $fake,
            'dispute'               => $fake,

            // Misc flags / strings
            'status'                => 'approved',
            'message'               => 'This is a demo preview message.',
            'reason'                => 'Demo reason for this action.',
            'reasons'               => ['Reason one', 'Reason two', 'Reason three'],
            'metrics'               => ['Engagement' => '92%', 'Revenue' => '£500', 'Fans' => '120'],
            'results'               => [
                ['label' => 'Demo Result', 'value' => 'Pass', 'errors' => ['Error one', 'Error two']],
            ],
            'note'                  => 'Demo note.',
            'subject'               => 'Demo Email Subject',
            'actionUrl'             => '#',
            'profileUrl'            => '#',
            'unsubscribeUrl'        => '#',
            'loginUrl'              => '#',

            // Error templates
            'th'                    => 'DemoException: Something went wrong (fake data for preview)',
            'errorMessage'          => 'Demo error message',
            'errorFile'             => '/var/www/app/Http/Controllers/DemoController.php',
            'errorLine'             => 42,
            'errorTrace'            => "#0 /var/www/app/Http/Controllers/DemoController.php(42)\n#1 vendor/laravel/framework/src/...",

            // Identity / verification
            'verificationResult'    => $fake,
            'identityStatus'        => 'verified',

            // Feature suggestions
            'suggestion'            => $fake,
            'featureSuggestion'     => $fake,
            'suggestionStatus'      => 'approved',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function emailTemplateList(string $viewPath, string $viewPrefix): array
    {
        $skip = ['default', 'default-2', 'digital-content-notice'];
        $templates = [];

        // Root-level files
        $files = glob(resource_path("views/{$viewPath}/*.blade.php")) ?: [];
        foreach ($files as $file) {
            $base = basename($file, '.blade.php');
            if (in_array($base, $skip, true)) {
                continue;
            }
            $view = "{$viewPrefix}.{$base}";
            $templates[] = [
                'name' => $base,
                'view' => $view,
                'slug' => rtrim(strtr(base64_encode($view), '+/', '-_'), '='),
            ];
        }

        // One level of subdirectories (e.g. email/risk/)
        foreach (glob(resource_path("views/{$viewPath}/*/"), GLOB_ONLYDIR) as $dir) {
            $subDir   = basename($dir);
            $subFiles = glob("{$dir}*.blade.php") ?: [];
            foreach ($subFiles as $file) {
                $base = basename($file, '.blade.php');
                $view = "{$viewPrefix}.{$subDir}.{$base}";
                $templates[] = [
                    'name' => "{$subDir}/{$base}",
                    'view' => $view,
                    'slug' => rtrim(strtr(base64_encode($view), '+/', '-_'), '='),
                ];
            }
        }

        usort($templates, fn ($a, $b) => strcmp($a['name'], $b['name']));
        return $templates;
    }

    // ── Routes ───────────────────────────────────────────────────────────────

    Route::prefix('debug/emails')->group(function () {

        // ── List page ──
        Route::get('/', function () {
            $main  = emailTemplateList('email', 'email');
            $html  = debugEmailListHtml($main, 'SpennPiggy.co', 'main');
            return response($html);
        })->name('debug.emails.list');

        // ── Preview in browser ──
        Route::get('/preview/{slug}', function (string $slug) {
            [$viewPrefix, $view] = resolveEmailView($slug);
            try {
                $html = view($view, emailFakeData())->render();
                return response($html);
            } catch (\Throwable $e) {
                return response("<pre style='color:red;padding:20px;font-family:monospace'><b>Preview failed:</b>\n" . e($e->getMessage()) . "\n\n" . e($e->getTraceAsString()) . "</pre>");
            }
        })->name('debug.emails.preview');

        // ── Send to test address ──
        Route::get('/send/{slug}', function (string $slug) {
            [$viewPrefix, $view] = resolveEmailView($slug);
            $to   = 'naveen@internetbusinesssolutionsindia.com';
            $data = emailFakeData();
            try {
                Mail::send($view, $data, function ($m) use ($to, $slug) {
                    $m->to($to)
                      ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'SpennPiggy'))
                      ->subject('[PREVIEW] ' . str_replace('_', ' ', $slug));
                });
                return response("<div style='font-family:sans-serif;padding:24px;color:#1a1a1a'>
                    <h2 style='color:#22c55e'>✅ Sent!</h2>
                    <p>Template: <code>{$view}</code></p>
                    <p>To: <code>{$to}</code></p>
                    <p><a href='" . route('debug.emails.list') . "'>← Back to list</a></p>
                </div>");
            } catch (\Throwable $e) {
                return response("<div style='font-family:sans-serif;padding:24px;color:#1a1a1a'>
                    <h2 style='color:#ef4444'>❌ Send failed</h2>
                    <p>Template: <code>{$view}</code></p>
                    <pre style='background:#f5f5f5;padding:14px;border-radius:6px;font-size:12px;overflow:auto'>" . e($e->getMessage()) . "</pre>
                    <p><a href='" . route('debug.emails.list') . "'>← Back to list</a></p>
                </div>");
            }
        })->name('debug.emails.send');

    });

    // ── Internal helpers ─────────────────────────────────────────────────────

    function resolveEmailView(string $slug): array
    {
        // slug is base64url-encoded view name
        $view = base64_decode(strtr($slug, '-_', '+/'));
        if (! $view || ! str_starts_with($view, 'email.')) {
            abort(404);
        }
        return ['email', $view];
    }

    function debugEmailListHtml(array $templates, string $appName, string $app): string
    {
        $rows = '';
        foreach ($templates as $t) {
            $slug    = $t['slug'];
            $name    = $t['name'];
            $preview = route('debug.emails.preview', ['slug' => $slug]);
            $send    = route('debug.emails.send',    ['slug' => $slug]);
            $rows   .= "
            <tr>
                <td style='padding:10px 16px;font-family:monospace;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6'>{$name}</td>
                <td style='padding:10px 16px;border-bottom:1px solid #f3f4f6;white-space:nowrap'>
                    <a href='{$preview}' target='_blank' style='display:inline-block;background:#6366f1;color:#fff;text-decoration:none;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;margin-right:6px;font-family:sans-serif'>
                        👁 Preview
                    </a>
                    <a href='{$send}' style='display:inline-block;background:#FF007F;color:#fff;text-decoration:none;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;font-family:sans-serif'
                       onclick=\"return confirm('Send [{$name}] to naveen@internetbusinesssolutionsindia.com?')\">
                        ✉ Send
                    </a>
                </td>
            </tr>";
        }

        $count = count($templates);
        return "<!DOCTYPE html>
<html>
<head>
<meta charset='UTF-8'>
<title>Email Templates — {$appName}</title>
<style>
  body{margin:0;padding:0;background:#f9fafb;font-family:sans-serif;}
  .header{background:linear-gradient(135deg,#FF007F,#C4006A,#8C52FF);padding:24px 32px;color:#fff;}
  .header h1{margin:0;font-size:22px;font-weight:800;}
  .header p{margin:6px 0 0;opacity:.8;font-size:14px;}
  .container{max-width:800px;margin:32px auto;padding:0 16px;}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);}
  th{background:#f3f4f6;padding:10px 16px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;}
  tr:hover td{background:#fef9ff;}
  .badge{display:inline-block;background:#FEF2F8;color:#CC88BB;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px;}
</style>
</head>
<body>
<div class='header'>
  <h1>📧 {$appName} — Email Templates</h1>
  <p>{$count} templates &nbsp;·&nbsp; Click <strong>Send</strong> to fire to naveen@internetbusinesssolutionsindia.com &nbsp;·&nbsp; Click <strong>Preview</strong> to render in browser</p>
</div>
<div class='container'>
  <table>
    <thead><tr><th>Template</th><th>Actions</th></tr></thead>
    <tbody>{$rows}</tbody>
  </table>
  <p style='color:#9ca3af;font-size:12px;margin-top:16px;text-align:center'>⚠ Only visible in non-production environments</p>
</div>
</body>
</html>";
    }

} // end !isProduction
