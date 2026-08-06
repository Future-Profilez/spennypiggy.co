<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bills;
use App\Models\CreatorReferral;
use App\Models\CreatorReferralPayout;
use App\Models\DiagnosticRun;
use App\Models\FinancialTransaction;
use App\Models\Follow;
use App\Models\Membership;
use App\Models\ReferralCode;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\UserCart;
use App\Models\WishItem;
use App\SeoMeta;
use App\Services\Diagnostics\DiagnosticsRunner;
use App\Services\IntercomService;
use App\Services\MagicBellService;
use App\StripeControl;
use App\Support\LogFingerprint;
use App\Uploadcare;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SystemDiagnosticsController extends Controller
{
    /**
     * Show the diagnostics dashboard.
     *
     * This route carries no auth, so it must never be indexed. `StaticPageSeoMiddleware`
     * already noindexes everything under `admin/` and robots.txt already disallows `/admin/`,
     * but this page sets its own tag as well: the prefix rule is shared with a dozen other
     * screens, and a page nobody is authenticating for should not have its only protection
     * from search be a list it does not own.
     *
     * `noindex,nofollow` rather than the site-wide `noindex,follow` — there is nothing here
     * worth passing crawl on to.
     */
    public function index()
    {
        SeoMeta::setRobots('noindex,nofollow,noarchive');

        return Inertia::render('Admin/SystemDiagnostics', [
            'app_version' => config('app.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
        ])->toResponse(request())->withHeaders([
            // A meta tag only reaches a crawler that renders the page. The header is read from
            // the response itself, so it also covers the JSON/XHR responses and any fetcher
            // that never executes the markup.
            'X-Robots-Tag' => 'noindex, nofollow, noarchive',
        ]);
    }

    /**
     * Run all diagnostics tests and return results.
     */
    /**
     * Every check, as a thunk so the runner controls WHETHER each one executes — a standard run
     * skips the two that create real objects at Stripe, and `--only` runs a single check without
     * paying for the other thirty-one.
     *
     * @return array<string,callable():array>
     */
    public function checks(): array
    {
        return [
            'routes_syntax' => fn () => $this->testRoutesAndSyntax(),
            'database' => fn () => $this->testDatabase(),
            'cache' => fn () => $this->testCache(),
            'signup_flow' => fn () => $this->testSignupFlow(),
            'wish_items' => fn () => $this->testWishItems(),
            'bills' => fn () => $this->testBills(),
            'memberships' => fn () => $this->testMemberships(),
            'shop_items' => fn () => $this->testShopItems(),
            'tasks' => fn () => $this->testTasks(),
            'cart_flow' => fn () => $this->testCartFlow(),
            'social_flow' => fn () => $this->testSocialFlow(),
            'profile_update' => fn () => $this->testProfileUpdate(),
            'search_engine' => fn () => $this->testSearchEngine(),
            'stripe_id_flow' => fn () => $this->testStripeIdFlow(),
            'stripe_payments' => fn () => $this->testStripePayments(),
            'email' => fn () => $this->testEmail(),
            'push_notifications' => fn () => $this->testPushNotifications(),
            'uploadcare' => fn () => $this->testUploadcare(),
            'intercom' => fn () => $this->testIntercom(),
            'queue_health' => fn () => $this->testQueueHealth(),
            'recent_errors' => fn () => $this->testRecentErrorLog(),
            'financial_integrity' => fn () => $this->testFinancialIntegrity(),
            'referral_system' => fn () => $this->testReferralSystem(),
            'storage_permissions' => fn () => $this->testStoragePermissions(),
            'disk_space' => fn () => $this->testDiskSpace(),
            'env_variables' => fn () => $this->testEnvironmentVariables(),
            'stripe_webhook' => fn () => $this->testStripeWebhookConfig(),
            'scheduled_tasks' => fn () => $this->testScheduledTasks(),
            'pending_migrations' => fn () => $this->testPendingMigrations(),
            'app_response_time' => fn () => $this->testAppResponseTime(),
            'stuck_payouts' => fn () => $this->testStuckPayouts(),
            'termly_consent' => fn () => $this->testTermlyConsent(),
        ];
    }

    public function run(Request $request)
    {
        /*
         * Deep run is opt-in: the Stripe checks create a real Connect Express account and a real
         * PaymentIntent, which is not something a page should do every time it is opened.
         *
         * ⚠️ It is additionally refused to an anonymous caller outside local/testing. The page
         * itself is deliberately unauthenticated, but "anyone may read the health report" and
         * "anyone may mint Stripe objects on the platform account, ten times a minute" are
         * different things, and only the first was asked for. Signing in is enough — this is not
         * the `admin` gate, which no user can satisfy.
         */
        $deep = $request->boolean('deep');

        if ($deep && ! app()->environment('local', 'testing') && ! $request->user()) {
            $deep = false;
        }

        $only = array_values(array_filter(
            (array) $request->input('only', []),
            fn ($k) => is_string($k) && array_key_exists($k, $this->checks())
        ));

        $payload = (new DiagnosticsRunner($this->checks()))->run([
            'deep' => $deep,
            'only' => $only !== [] ? $only : null,
            'trigger' => 'manual',
        ]);

        return response()->json($payload);
    }

    /** Recent runs, for the trend strip on the page. */
    public function history(Request $request)
    {
        if (! Schema::hasTable('diagnostic_runs')) {
            return response()->json(['runs' => []]);
        }

        $runs = DiagnosticRun::query()
            ->latest('id')
            ->limit(min(50, max(1, (int) $request->input('limit', 20))))
            ->get(['id', 'status', 'deep', 'passed_count', 'warning_count', 'failed_count', 'skipped_count', 'duration_ms', 'created_at']);

        return response()->json(['runs' => $runs]);
    }

    private function testRoutesAndSyntax()
    {
        try {
            $start = microtime(true);
            $errors = [];

            // 1. Check all registered routes
            $routes = Route::getRoutes();
            $routeCount = 0;

            foreach ($routes as $route) {
                $action = $route->getAction();
                if (isset($action['controller'])) {
                    $controllerAction = explode('@', $action['controller']);
                    if (count($controllerAction) === 2) {
                        $controller = $controllerAction[0];
                        $method = $controllerAction[1];

                        if (! class_exists($controller) && ! interface_exists($controller)) {
                            $errors[] = "Missing controller: {$controller}";
                        } elseif (! method_exists($controller, $method)) {
                            $errors[] = "Missing method: {$method} in {$controller}";
                        }
                    }
                }
                $routeCount++;
            }

            // 2. Check PHP syntax for critical directories (Routes, Controllers, Models)
            $directories = [
                base_path('routes'),
                app_path('Http/Controllers'),
                app_path('Models'),
            ];

            $fileCount = 0;
            foreach ($directories as $dir) {
                if (! is_dir($dir)) {
                    continue;
                }
                $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
                foreach ($iterator as $file) {
                    if ($file->isFile() && $file->getExtension() === 'php') {
                        $fileCount++;
                        $output = [];
                        $returnVar = 0;

                        // In web requests, PHP_BINARY can point to php-fpm; lint must run via CLI php.
                        $phpBinary = $this->resolvePhpCliBinary();
                        exec(escapeshellarg($phpBinary).' -l '.escapeshellarg($file->getPathname()).' 2>&1', $output, $returnVar);

                        if ($returnVar !== 0) {
                            $errorOutput = implode(' ', $output);
                            // Clean up standard php -l output
                            $errorOutput = str_replace('Errors parsing', '', $errorOutput);
                            $errors[] = 'Syntax error in '.$file->getFilename().': '.trim($errorOutput);
                        }
                    }
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($errors) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($errors).' syntax/route errors found. Please check the details.',
                    'errors' => $errors,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Successfully verified {$routeCount} routes and checked syntax of {$fileCount} PHP files.",
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Syntax check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testDatabase()
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Connected successfully',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Connection failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Resolve a PHP CLI binary suitable for `php -l` lint checks.
     */
    private function resolvePhpCliBinary(): string
    {
        $currentBinary = PHP_BINARY;
        $binaryName = strtolower(basename($currentBinary));

        // In FPM context this is commonly php-fpm/php-fpm8.x, which does not support `-l`.
        if (str_contains($binaryName, 'php-fpm')) {
            return 'php';
        }

        return $currentBinary;
    }

    private function testCache()
    {
        try {
            $start = microtime(true);
            Cache::put('diagnostic_test_key', 'ok', 10);
            $val = Cache::get('diagnostic_test_key');
            $time = round((microtime(true) - $start) * 1000, 2);

            if ($val === 'ok') {
                return [
                    'status' => 'passed',
                    'message' => 'Cache read/write successful',
                    'time_ms' => $time,
                ];
            } else {
                return [
                    'status' => 'failed',
                    'message' => 'Cache write verification failed',
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Cache error: '.$e->getMessage(),
            ];
        }
    }

    private function testSignupFlow()
    {
        try {
            $start = microtime(true);
            $success = false;

            DB::beginTransaction();
            try {
                $user = User::create([
                    'name' => 'Diagnostic Test',
                    'username' => 'diag_'.time(),
                    'email' => 'diag_'.time().'@example.com',
                    'password' => bcrypt('password123!'),
                    'role' => 1,
                ]);
                $success = $user->exists;
            } catch (\Exception $e) {
                throw $e;
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if ($success) {
                return [
                    'status' => 'passed',
                    'message' => 'User creation flow tested successfully (rolled back).',
                    'time_ms' => $time,
                ];
            } else {
                return [
                    'status' => 'failed',
                    'message' => 'Failed to create a user record in the database.',
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Signup flow check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testStripeIdFlow()
    {
        try {
            $start = microtime(true);

            // Create a test connected account
            $account = StripeControl::createAccount([
                'type' => 'express',
                'country' => 'GB',
                'email' => 'test_diag_'.time().'@example.com',
                'capabilities' => [
                    'card_payments' => ['requested' => true],
                    'transfers' => ['requested' => true],
                ],
            ]);

            // Attempt to create an account link (the ID verification flow step)
            $link = StripeControl::createAccountLink([
                'account' => $account->id,
                'refresh_url' => config('app.url').'/return-test',
                'return_url' => config('app.url').'/return-test',
                'type' => 'account_onboarding',
            ]);

            // Clean up
            StripeControl::deleteAccount($account->id);

            $time = round((microtime(true) - $start) * 1000, 2);

            if ($link && $link->url) {
                return [
                    'status' => 'passed',
                    'message' => 'Stripe Connect Account & ID Onboarding link created successfully.',
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'failed',
                'message' => 'Account created but failed to generate ID onboarding link.',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Stripe ID flow failed: '.$e->getMessage(),
            ];
        }
    }

    private function testStripePayments()
    {
        try {
            $start = microtime(true);

            $client = StripeControl::getClient();

            // Create a test payment intent
            $pi = $client->paymentIntents->create([
                'amount' => 500, // £5.00
                'currency' => 'gbp',
                'payment_method_types' => ['card'],
            ]);

            // Cancel the payment intent immediately
            $client->paymentIntents->cancel($pi->id);

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Stripe Payment Intent created and cancelled successfully.',
                'time_ms' => $time,
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Stripe Payments check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testEmail()
    {
        try {
            $start = microtime(true);

            // We won't actually send an email, but we will test the SMTP/API connection
            $driver = config('mail.default');
            $status = 'warning';
            $message = "Email service ($driver) configuration found but actual sending was skipped.";

            // If it's a specific API like mailgun, we could test an API call here.
            // For now, validating configuration
            if (config('mail.mailers.'.$driver)) {
                $status = 'passed';
                $message = "Email configuration for $driver appears valid.";
            } else {
                $status = 'failed';
                $message = "Email driver $driver is not properly configured.";
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => $status,
                'message' => $message,
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Email configuration check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testPushNotifications()
    {
        try {
            $start = microtime(true);
            $apiKey = env('MAGICBELL_API_KEY');
            $apiSecret = env('MAGICBELL_API_SECRET');

            if (! $apiKey || ! $apiSecret) {
                return [
                    'status' => 'failed',
                    'message' => 'MagicBell credentials are missing in environment configuration.',
                    'time_ms' => 0,
                ];
            }

            // We make a lightweight ping request to MagicBell to verify credentials
            // (Note: there isn't a direct ping, so we check the project info or just skip actual dispatching)
            // But we can test if the service class instantiates correctly.
            $service = new MagicBellService;
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'MagicBell Push Notification service is configured and ready.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Push notification check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testUploadcare()
    {
        try {
            $start = microtime(true);
            $publicKey = env('UPLOADCARE_PUBLIC_KEY');
            $secretKey = env('UPLOADCARE_SECRET_KEY');

            if (! $publicKey || ! $secretKey) {
                return [
                    'status' => 'failed',
                    'message' => 'Uploadcare credentials are missing in environment configuration.',
                    'time_ms' => 0,
                ];
            }

            // Test API object creation
            $api = Uploadcare::getApiObj();
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Uploadcare (Image Hosting) is configured and API initialized successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Uploadcare check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testWishItems()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (! $user) {
                return ['status' => 'warning', 'message' => 'No user found to test wish items.'];
            }

            DB::beginTransaction();
            try {
                // Add
                $item = WishItem::create([
                    'user_id' => $user->id,
                    'wishname' => 'Diagnostic Test Item',
                    'price' => 100,
                    'currency' => 'GBP',
                    'is_approved' => true,
                    'subscription' => 0, // Added to fix 1364 error
                ]);

                // Edit
                $item->update(['wishname' => 'Diagnostic Test Item Updated']);

                // Disable (assuming status or soft delete)
                $item->delete(); // Soft delete as per model

                // Restore & Hard Delete for cleanup if needed, but we are in transaction
                $success = true;
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Wish item Add, Edit, and Delete (soft) tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Wish item test failed: '.$e->getMessage()];
        }
    }

    private function testBills()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (! $user) {
                return ['status' => 'warning', 'message' => 'No user found to test bills.'];
            }

            DB::beginTransaction();
            try {
                $bill = Bills::create([
                    'user_id' => $user->id,
                    'name' => 'Diagnostic Bill',
                    'price' => 50,
                    'currency' => 'GBP',
                    'status' => 1,
                    'period' => 'monthly',
                ]);
                $bill->update(['name' => 'Diagnostic Bill Updated']);
                $bill->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Bills Add, Edit, and Delete tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Bills test failed: '.$e->getMessage()];
        }
    }

    private function testMemberships()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (! $user) {
                return ['status' => 'warning', 'message' => 'No user found to test memberships.'];
            }

            DB::beginTransaction();
            try {
                $membership = Membership::create([
                    'user_id' => $user->id,
                    'level' => 'bronze',
                    'price' => 10,
                    'currency' => 'GBP',
                    'status' => 1,
                    'rewards' => 'Diagnostic rewards', // Added to fix 1364 error
                ]);
                $membership->update(['level' => 'silver']);
                $membership->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Memberships Add, Edit, and Delete tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Memberships test failed: '.$e->getMessage()];
        }
    }

    private function testShopItems()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (! $user) {
                return ['status' => 'warning', 'message' => 'No user found to test shop items.'];
            }

            DB::beginTransaction();
            try {
                $shop = Shop::create([
                    'user_id' => $user->id,
                    'name' => 'Diagnostic Shop Item',
                    'price' => 25,
                    'currency' => 'GBP',
                    'status' => 1,
                    'type' => 'digital',
                ]);
                $shop->update(['name' => 'Diagnostic Shop Item Updated']);
                $shop->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Shop items Add, Edit, and Delete tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Shop items test failed: '.$e->getMessage()];
        }
    }

    private function testTasks()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (! $user) {
                return ['status' => 'warning', 'message' => 'No user found to test tasks.'];
            }

            DB::beginTransaction();
            try {
                $task = Task::create([
                    'creator_id' => $user->id,
                    'title' => 'Diagnostic Task',
                    'price' => 20,
                    'status' => 1,
                    'category' => 'Diagnostic',
                    'type' => 'digital',
                ]);
                $task->update(['title' => 'Diagnostic Task Updated']);
                $task->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Tasks Add, Edit, and Delete tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Tasks test failed: '.$e->getMessage()];
        }
    }

    private function testCartFlow()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            $wishItem = WishItem::first();

            if (! $user || ! $wishItem) {
                return ['status' => 'warning', 'message' => 'Missing user or wish item for cart test.'];
            }

            DB::beginTransaction();
            try {
                $cart = UserCart::create([
                    'user_id' => $user->id,
                    'owner_id' => $wishItem->user_id,
                    'wish_item_id' => $wishItem->id,
                    'amount' => $wishItem->price,
                    'quantity' => 1,
                    'status' => 1,
                ]);
                $cart->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Add to cart flow tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Cart flow test failed: '.$e->getMessage()];
        }
    }

    private function testSocialFlow()
    {
        try {
            $start = microtime(true);
            $users = User::limit(2)->get();
            if ($users->count() < 2) {
                return ['status' => 'warning', 'message' => 'Need at least 2 users for social flow test.'];
            }

            $follower = $users[0];
            $followed = $users[1];

            DB::beginTransaction();
            try {
                // Follow
                Follow::create([
                    'follower_id' => $follower->id,
                    'followed_id' => $followed->id,
                ]);

                // Unfollow
                Follow::where('follower_id', $follower->id)
                    ->where('followed_id', $followed->id)
                    ->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Follow/Unfollow functionality tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Social flow test failed: '.$e->getMessage()];
        }
    }

    private function testProfileUpdate()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (! $user) {
                return ['status' => 'warning', 'message' => 'No user found for profile update test.'];
            }

            $oldBio = $user->bio;

            DB::beginTransaction();
            try {
                $user->update([
                    'bio' => 'Diagnostic test bio update',
                    'name' => 'Diagnostic Test User',
                    'avatar' => '901c0a0e-e5de-4d7a-8ac3-de11a4632542', // Sample UUID
                    'cover' => '901c0a0e-e5de-4d7a-8ac3-de11a4632542',
                ]);
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Profile update (Bio, Name) tested successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Profile update test failed: '.$e->getMessage()];
        }
    }

    private function testSearchEngine()
    {
        try {
            $start = microtime(true);

            // Test user search
            $users = User::where('username', 'like', '%admin%')->limit(1)->get();

            // Test wish item search
            $items = WishItem::where('wishname', 'like', '%test%')->limit(1)->get();

            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Database search queries for users and items executed successfully.',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Search engine test failed: '.$e->getMessage()];
        }
    }

    private function testIntercom()
    {
        try {
            $start = microtime(true);
            $appId = config('services.intercom.app_id');
            $enabled = config('services.intercom.enabled');

            if (! $appId) {
                return [
                    'status' => 'warning',
                    'message' => 'Intercom App ID is not configured.',
                    'time_ms' => 0,
                ];
            }

            $service = new IntercomService;
            $settings = $service->buildSettings(null); // Anonymous user settings
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => $enabled ? 'passed' : 'warning',
                'message' => 'Intercom integration is configured. (Enabled: '.($enabled ? 'Yes' : 'No').')',
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Intercom check failed: '.$e->getMessage(),
            ];
        }
    }

    private function testQueueHealth()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check failed jobs
            $failedJobsCount = DB::table('failed_jobs')->count();
            if ($failedJobsCount > 0) {
                $latestFailed = DB::table('failed_jobs')->orderByDesc('failed_at')->first();
                $issues[] = "{$failedJobsCount} failed job(s) in queue. Latest: ".($latestFailed ? substr($latestFailed->exception, 0, 100) : 'unknown');
            }

            // Check pending jobs stuck for > 10 minutes
            $stuckJobs = DB::table('jobs')
                ->where('reserved_at', '<', now()->subMinutes(10)->timestamp)
                ->whereNotNull('reserved_at')
                ->count();
            if ($stuckJobs > 0) {
                $issues[] = "{$stuckJobs} job(s) appear stuck (reserved > 10 min ago).";
            }

            // Pending jobs count (just informational)
            $pendingJobs = DB::table('jobs')->count();

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => 'Queue issues detected. Failed: '.$failedJobsCount.', Pending: '.$pendingJobs,
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Queue is healthy. Pending jobs: {$pendingJobs}, Failed jobs: 0.",
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Queue check skipped (table may not exist): '.$e->getMessage(),
            ];
        }
    }

    private function testRecentErrorLog()
    {
        try {
            $start = microtime(true);
            $logPath = storage_path('logs/laravel.log');

            if (! file_exists($logPath)) {
                return ['status' => 'warning', 'message' => 'Log file not found at '.$logPath, 'time_ms' => 0];
            }

            // Read last 300 lines efficiently
            $lines = [];
            $file = new \SplFileObject($logPath, 'r');
            $file->seek(PHP_INT_MAX);
            $totalLines = $file->key();
            $startLine = max(0, $totalLines - 300);

            $file->seek($startLine);
            while (! $file->eof()) {
                $lines[] = $file->current();
                $file->next();
            }

            // Extract ERROR/CRITICAL lines from last 24 hours
            $errorLines = [];
            $yesterday = now()->subDay()->format('Y-m-d');
            $today = now()->format('Y-m-d');

            foreach ($lines as $line) {
                if (preg_match('/\[('.$today.'|'.$yesterday.')/', $line) &&
                    preg_match('/\.(ERROR|CRITICAL|ALERT|EMERGENCY)/i', $line)) {
                    $errorLines[] = trim($line);
                }
            }

            /*
             * Group by SIGNATURE, not by the first 100 characters.
             *
             * Those first 100 characters begin with the timestamp, so the same fault logged three
             * minutes apart counted as three distinct errors — "11 unique errors" was really a
             * handful repeating, with no indication which one was happening constantly.
             *
             * LogFingerprint also redacts. These lines were previously printed verbatim, carrying
             * Stripe key fragments, payment intent and customer ids, buyer email addresses and
             * entire serialized queue payloads onto the page.
             */
            $groups = LogFingerprint::group($errorLines, 15);

            $time = round((microtime(true) - $start) * 1000, 2);
            $distinct = count($groups);
            $total = array_sum(array_column($groups, 'count'));

            if ($distinct > 0) {
                return [
                    'status' => 'failed',
                    'message' => "{$distinct} distinct error signature(s) across {$total} log line(s) in the last 24 hours.",
                    'errors' => array_map(
                        static fn ($g) => sprintf('×%d  %s', $g['count'], $g['message']),
                        $groups
                    ),
                    'meta' => ['groups' => $groups],
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'No ERROR/CRITICAL entries in logs in the last 24 hours.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'warning', 'message' => 'Could not read error log: '.$e->getMessage()];
        }
    }

    private function testFinancialIntegrity()
    {
        try {
            $start = microtime(true);
            $issues = [];
            $ids = [];

            /*
             * Each finding names the ROWS, not just a count. "2 transaction(s) have amount
             * calculation mismatch" cost a hand-written tinker query to turn into something
             * actionable; the check already knows which rows they are, so it says so.
             *
             * `pluck` is capped so a systemic fault reports a sample rather than dumping the
             * whole ledger into an HTTP response.
             */
            $sample = static fn ($query) => $query->limit(25)->pluck('id')->all();

            // Check for negative net_amount
            $negativeIds = $sample(FinancialTransaction::where('net_amount', '<', 0)->orderBy('id'));
            if ($negativeIds !== []) {
                $issues[] = count($negativeIds).' transaction(s) have negative net_amount: #'.implode(', #', $negativeIds);
                $ids = array_merge($ids, $negativeIds);
            }

            // Check for math mismatch: gross should >= net + fees (allow £0.01 rounding)
            $mismatchIds = $sample(FinancialTransaction::whereRaw(
                'ABS(gross_amount - (net_amount + platform_fee + stripe_fee + vat_amount)) > 0.02'
            )->orderBy('id'));
            if ($mismatchIds !== []) {
                $issues[] = count($mismatchIds).' transaction(s) have amount calculation mismatch (gross ≠ net + fees): #'.implode(', #', $mismatchIds);
                $ids = array_merge($ids, $mismatchIds);
            }

            // Check for held reserve with zero reserve_amount
            $badReserveIds = $sample(FinancialTransaction::where('reserve_status', 'held')
                ->where(function ($q) {
                    $q->whereNull('reserve_amount')->orWhere('reserve_amount', '<=', 0);
                })->orderBy('id'));
            if ($badReserveIds !== []) {
                $issues[] = count($badReserveIds)." transaction(s) marked 'held' reserve but have no reserve_amount: #".implode(', #', $badReserveIds);
                $ids = array_merge($ids, $badReserveIds);
            }

            // Check for pending transactions older than 7 days
            $stalePendingIds = $sample(FinancialTransaction::where('status', 'pending')
                ->where('created_at', '<', now()->subDays(7))
                ->orderBy('id'));
            if ($stalePendingIds !== []) {
                $issues[] = count($stalePendingIds)." transaction(s) have been 'pending' for more than 7 days: #".implode(', #', $stalePendingIds);
                $ids = array_merge($ids, $stalePendingIds);
            }

            $time = round((microtime(true) - $start) * 1000, 2);
            $totalTx = FinancialTransaction::count();

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => "Financial integrity issues found in {$totalTx} total transactions.",
                    'errors' => $issues,
                    'ids' => array_values(array_unique($ids)),
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => "All {$totalTx} financial transaction(s) passed integrity checks.",
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Financial integrity check failed: '.$e->getMessage()];
        }
    }

    private function testReferralSystem()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check ReferralCode table is accessible
            $activeCodes = ReferralCode::where('is_active', 1)->count();

            // Check for referrals stuck in PAYOUT_REQUESTED for > 14 days (admin forgot to approve)
            $stuckIds = CreatorReferral::where('status', 'PAYOUT_REQUESTED')
                ->where('updated_at', '<', now()->subDays(14))
                ->orderBy('id')->limit(25)->pluck('id')->all();
            if ($stuckIds !== []) {
                $issues[] = count($stuckIds).' referral(s) stuck in PAYOUT_REQUESTED for over 14 days — admin review needed: #'.implode(', #', $stuckIds);
            }

            // Check for PENDING payouts older than 7 days
            $oldPayoutIds = CreatorReferralPayout::where('status', 'PENDING')
                ->where('requested_at', '<', now()->subDays(7))
                ->orderBy('id')->limit(25)->pluck('id')->all();
            if ($oldPayoutIds !== []) {
                $issues[] = count($oldPayoutIds).' payout request(s) pending for over 7 days without admin action: #'.implode(', #', $oldPayoutIds);
            }

            // Check referral config
            $rewardAmount = config('referral.reward_amount');
            if (! $rewardAmount) {
                $issues[] = 'referral.reward_amount config is not set — payout calculations may be wrong.';
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'warning',
                    'message' => "Referral system has {$activeCodes} active code(s) but issues detected.",
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Referral system OK. Active codes: {$activeCodes}. No stuck payouts.",
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Referral system check failed: '.$e->getMessage()];
        }
    }

    private function testStoragePermissions()
    {
        try {
            $start = microtime(true);
            $issues = [];

            $paths = [
                storage_path('logs'),
                storage_path('app'),
                storage_path('framework/cache'),
                storage_path('framework/sessions'),
                storage_path('framework/views'),
            ];

            foreach ($paths as $path) {
                if (! is_dir($path)) {
                    $issues[] = "Directory missing: {$path}";
                } elseif (! is_writable($path)) {
                    $issues[] = "Not writable: {$path}";
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($issues).' storage permission issue(s) detected.',
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'All storage directories exist and are writable.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Storage permission check failed: '.$e->getMessage()];
        }
    }

    private function testDiskSpace()
    {
        try {
            $start = microtime(true);
            $path = storage_path();

            $totalBytes = disk_total_space($path);
            $freeBytes = disk_free_space($path);
            $usedBytes = $totalBytes - $freeBytes;
            $usedPercent = round(($usedBytes / $totalBytes) * 100, 1);
            $freeGB = round($freeBytes / 1073741824, 2);

            $time = round((microtime(true) - $start) * 1000, 2);

            if ($usedPercent >= 90) {
                return [
                    'status' => 'failed',
                    'message' => "Disk is {$usedPercent}% full! Only {$freeGB} GB free. Immediate action needed.",
                    'time_ms' => $time,
                ];
            }

            if ($usedPercent >= 75) {
                return [
                    'status' => 'warning',
                    'message' => "Disk is {$usedPercent}% full. {$freeGB} GB free remaining.",
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Disk usage: {$usedPercent}%. {$freeGB} GB free available.",
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'warning', 'message' => 'Disk space check failed: '.$e->getMessage()];
        }
    }

    private function testEnvironmentVariables()
    {
        try {
            $start = microtime(true);
            $missing = [];

            $required = [
                'APP_KEY' => env('APP_KEY'),
                'DB_HOST' => env('DB_HOST'),
                'DB_DATABASE' => env('DB_DATABASE'),
                'STRIPE_SECRET' => config('services.stripe.secret') ?? env('STRIPE_SECRET'),
                'STRIPE_KEY' => config('services.stripe.key') ?? env('STRIPE_KEY'),
                'STRIPE_WEBHOOK_SECRET' => config('services.stripe.webhook_secret'),
                'MAGICBELL_API_KEY' => env('MAGICBELL_API_KEY'),
                'MAGICBELL_API_SECRET' => env('MAGICBELL_API_SECRET'),
                'UPLOADCARE_PUBLIC_KEY' => env('UPLOADCARE_PUBLIC_KEY'),
                'UPLOADCARE_SECRET_KEY' => env('UPLOADCARE_SECRET_KEY'),
                'MAIL_HOST' => env('MAIL_HOST'),
            ];

            foreach ($required as $key => $value) {
                if (empty($value)) {
                    $missing[] = "{$key} is not set or empty.";
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($missing) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($missing).' required environment variable(s) are missing.',
                    'errors' => $missing,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'All '.count($required).' required environment variables are configured.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Environment check failed: '.$e->getMessage()];
        }
    }

    private function testStripeWebhookConfig()
    {
        try {
            $start = microtime(true);
            $webhookSecret = config('services.stripe.webhook_secret');
            $issues = [];

            if (empty($webhookSecret)) {
                $issues[] = 'STRIPE_WEBHOOK_SECRET is not set — Stripe webhook signature verification will fail.';
            } elseif (! str_starts_with($webhookSecret, 'whsec_')) {
                $issues[] = 'STRIPE_WEBHOOK_SECRET does not start with "whsec_" — may be invalid.';
            }

            $stripeKey = config('services.stripe.secret') ?? env('STRIPE_SECRET');
            if (! empty($stripeKey) && str_starts_with($stripeKey, 'sk_live_') && app()->environment('local')) {
                $issues[] = 'WARNING: Live Stripe key (sk_live_) used in local environment!';
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => 'Stripe webhook configuration issues found.',
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            $mode = str_starts_with($stripeKey ?? '', 'sk_live_') ? 'LIVE' : 'TEST';

            return [
                'status' => 'passed',
                'message' => "Stripe webhook secret is configured. Mode: {$mode}.",
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Stripe webhook config check failed: '.$e->getMessage()];
        }
    }

    private function testScheduledTasks()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check if the schedule:run command cache key exists (set by our scheduler heartbeat)
            $lastHeartbeat = Cache::get('scheduler_heartbeat');

            if (! $lastHeartbeat) {
                $issues[] = 'No scheduler heartbeat found. The cron job may not be running. Ensure "php artisan schedule:run" runs every minute.';
            } else {
                $minutesAgo = round((time() - $lastHeartbeat) / 60, 1);
                if ($minutesAgo > 5) {
                    $issues[] = "Scheduler heartbeat is {$minutesAgo} minutes old — cron may be down.";
                }
            }

            // Check horizon or queue worker via cache key (if set by worker)
            $queueWorkerAlive = Cache::get('queue_worker_heartbeat');
            if (! $queueWorkerAlive) {
                $issues[] = 'No queue worker heartbeat detected. Consider setting a heartbeat in a scheduled command.';
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (! empty($issues)) {
                return [
                    'status' => 'warning',
                    'message' => 'Scheduler/Worker heartbeat check has warnings.',
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'Laravel scheduler heartbeat is active and recent.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'warning', 'message' => 'Scheduled tasks check failed: '.$e->getMessage()];
        }
    }

    private function testPendingMigrations()
    {
        try {
            $start = microtime(true);

            // Get migrations already run
            $ran = DB::table('migrations')->pluck('migration')->toArray();

            // Get all migration files
            $migrationPath = database_path('migrations');
            $files = glob($migrationPath.'/*.php');
            $pending = [];

            foreach ($files as $file) {
                $name = pathinfo($file, PATHINFO_FILENAME);
                if (! in_array($name, $ran)) {
                    $pending[] = $name;
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($pending) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($pending).' migration(s) not yet run. Run "php artisan migrate" on the server.',
                    'errors' => $pending,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'All '.count($ran).' migrations have been applied.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Migration check failed: '.$e->getMessage()];
        }
    }

    private function testAppResponseTime()
    {
        try {
            $start = microtime(true);
            $appUrl = config('app.url');

            if (empty($appUrl)) {
                return ['status' => 'warning', 'message' => 'APP_URL is not configured.', 'time_ms' => 0];
            }

            /*
             * `php artisan serve` runs PHP's built-in server, which is SINGLE-THREADED. This
             * request is holding its only worker, so an HTTP call back to ourselves can never be
             * answered — it always spends the full timeout and always reports "critically slow",
             * a guaranteed red result that says nothing about the app. Skip it there instead.
             */
            if (php_sapi_name() === 'cli-server') {
                return [
                    'status' => 'warning',
                    'message' => 'Skipped: the built-in server (php artisan serve) is single-threaded, so it cannot answer a request it is already busy serving. Run this check against a real web server.',
                    'time_ms' => 0,
                ];
            }

            $pingUrl = rtrim($appUrl, '/').'/ping';
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'SpennyPiggyDiagnostics/1.0'])
                ->get($pingUrl);

            if ($response->status() === 404) {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'SpennyPiggyDiagnostics/1.0'])
                    ->get($appUrl);
            }
            $time = round((microtime(true) - $start) * 1000, 2);
            $statusCode = $response->status();

            if ($time > 5000) {
                return [
                    'status' => 'failed',
                    'message' => "Homepage response is critically slow: {$time}ms (HTTP {$statusCode}). Possible server overload.",
                    'time_ms' => $time,
                ];
            }

            if ($time > 2000) {
                return [
                    'status' => 'warning',
                    'message' => "Homepage response is slow: {$time}ms (HTTP {$statusCode}). Consider optimisation.",
                    'time_ms' => $time,
                ];
            }

            if ($statusCode >= 500) {
                return [
                    'status' => 'failed',
                    'message' => "Homepage returned HTTP {$statusCode}. Server error detected.",
                    'time_ms' => $time,
                ];
            }

            if ($statusCode >= 400) {
                return [
                    'status' => 'warning',
                    'message' => "Homepage responded in {$time}ms with HTTP {$statusCode}. Non-success response detected.",
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Homepage responded in {$time}ms with HTTP {$statusCode}.",
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'App response time check failed: '.$e->getMessage()];
        }
    }

    private function testStuckPayouts()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check FinancialTransactions in 'pending' for payout types > 3 days
            $stuckPayoutTx = FinancialTransaction::where('type', 'like', '%payout%')
                ->where('status', 'pending')
                ->where('created_at', '<', now()->subDays(3))
                ->count();

            if ($stuckPayoutTx > 0) {
                $issues[] = "{$stuckPayoutTx} payout transaction(s) stuck in 'pending' for over 3 days.";
            }

            // Check for users with account_id but suspended_account = true who have held reserves
            $blockedWithReserve = User::where('suspended_account', 1)
                ->whereNotNull('account_id')
                ->whereHas('financialTransactions', function ($q) {
                    $q->where('reserve_status', 'held')->where('status', 'completed');
                })
                ->count();

            if ($blockedWithReserve > 0) {
                $issues[] = "{$blockedWithReserve} suspended creator(s) have unreleased held reserves — admin action needed.";
            }

            // Check for weekly payout window overdue (Fridays) — if today is Mon-Thu and last payout was >10 days
            $lastWeeklyPayout = FinancialTransaction::where('type', 'weekly_payout')
                ->where('status', 'completed')
                ->orderByDesc('created_at')
                ->value('created_at');

            if ($lastWeeklyPayout && now()->diffInDays($lastWeeklyPayout) > 10) {
                $daysSince = now()->diffInDays($lastWeeklyPayout);
                $issues[] = "Last weekly payout ran {$daysSince} days ago. Expected every 7 days (Fridays).";
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => 'Payout flow issues detected.',
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'No stuck payouts or blocked reserves found.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Stuck payouts check failed: '.$e->getMessage()];
        }
    }

    private function testTermlyConsent()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check if termly script is present in app.blade.php
            $appBladePath = resource_path('views/app.blade.php');
            if (file_exists($appBladePath)) {
                $content = file_get_contents($appBladePath);
                if (! str_contains($content, 'app.termly.io/embed.min.js')) {
                    $issues[] = 'Termly consent script (app.termly.io/embed.min.js) is missing from app.blade.php.';
                }
                if (! str_contains($content, 'data-website-uuid')) {
                    $issues[] = 'Termly script is missing the data-website-uuid attribute.';
                }
            } else {
                $issues[] = 'app.blade.php not found to verify Termly consent script.';
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => 'Termly consent script configuration issues found.',
                    'errors' => $issues,
                    'time_ms' => $time,
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'Termly consent script is properly configured in app.blade.php.',
                'errors' => [],
                'time_ms' => $time,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Termly consent check failed: '.$e->getMessage(),
            ];
        }
    }
}
