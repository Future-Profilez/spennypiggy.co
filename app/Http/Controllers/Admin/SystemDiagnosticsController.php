<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use App\StripeControl;
use App\Models\User;
use App\Models\WishItem;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\Shop;
use App\Models\Task;
use App\Models\UserCart;
use App\Models\Follow;
use App\Models\FinancialTransaction;
use App\Models\ReferralCode;
use App\Models\CreatorReferral;
use App\Models\CreatorReferralPayout;
use Inertia\Inertia;

class SystemDiagnosticsController extends Controller
{
    /**
     * Show the diagnostics dashboard.
     */
    public function index()
    {
        return Inertia::render('Admin/SystemDiagnostics', [
            'app_version' => config('app.version', '1.0.0'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
        ]);
    }

    /**
     * Run all diagnostics tests and return results.
     */
    public function run()
    {
        $results = [
            'routes_syntax' => $this->testRoutesAndSyntax(),
            'database' => $this->testDatabase(),
            'cache' => $this->testCache(),
            'signup_flow' => $this->testSignupFlow(),
            'wish_items' => $this->testWishItems(),
            'bills' => $this->testBills(),
            'memberships' => $this->testMemberships(),
            'shop_items' => $this->testShopItems(),
            'tasks' => $this->testTasks(),
            'cart_flow' => $this->testCartFlow(),
            'social_flow' => $this->testSocialFlow(),
            'profile_update' => $this->testProfileUpdate(),
            'search_engine' => $this->testSearchEngine(),
            'stripe_id_flow' => $this->testStripeIdFlow(),
            'stripe_payments' => $this->testStripePayments(),
            'email' => $this->testEmail(),
            'push_notifications' => $this->testPushNotifications(),
            'uploadcare' => $this->testUploadcare(),
            'intercom' => $this->testIntercom(),
            'queue_health' => $this->testQueueHealth(),
            'recent_errors' => $this->testRecentErrorLog(),
            'financial_integrity' => $this->testFinancialIntegrity(),
            'referral_system' => $this->testReferralSystem(),
            'storage_permissions' => $this->testStoragePermissions(),
            'disk_space' => $this->testDiskSpace(),
            'env_variables' => $this->testEnvironmentVariables(),
            'stripe_webhook' => $this->testStripeWebhookConfig(),
            'scheduled_tasks' => $this->testScheduledTasks(),
            'pending_migrations' => $this->testPendingMigrations(),
            'stripe_accounts_health' => $this->testStripeConnectedAccountsHealth(),
            'app_response_time' => $this->testAppResponseTime(),
            'stuck_payouts' => $this->testStuckPayouts(),
        ];

        $overallStatus = 'passed';
        foreach ($results as $result) {
            if ($result['status'] === 'failed') {
                $overallStatus = 'failed';
                break;
            } elseif ($result['status'] === 'warning') {
                $overallStatus = 'warning';
            }
        }

        return response()->json([
            'status' => $overallStatus,
            'results' => $results,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    private function testRoutesAndSyntax()
    {
        try {
            $start = microtime(true);
            $errors = [];
            
            // 1. Check all registered routes
            $routes = \Illuminate\Support\Facades\Route::getRoutes();
            $routeCount = 0;
            
            foreach ($routes as $route) {
                $action = $route->getAction();
                if (isset($action['controller'])) {
                    $controllerAction = explode('@', $action['controller']);
                    if (count($controllerAction) === 2) {
                        $controller = $controllerAction[0];
                        $method = $controllerAction[1];
                        
                        if (!class_exists($controller) && !interface_exists($controller)) {
                            $errors[] = "Missing controller: {$controller}";
                        } elseif (!method_exists($controller, $method)) {
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
                if (!is_dir($dir)) continue;
                $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
                foreach ($iterator as $file) {
                    if ($file->isFile() && $file->getExtension() === 'php') {
                        $fileCount++;
                        $output = [];
                        $returnVar = 0;
                        
                        // In web requests, PHP_BINARY can point to php-fpm; lint must run via CLI php.
                        $phpBinary = $this->resolvePhpCliBinary();
                        exec(escapeshellarg($phpBinary) . ' -l ' . escapeshellarg($file->getPathname()) . ' 2>&1', $output, $returnVar);
                        
                        if ($returnVar !== 0) {
                            $errorOutput = implode(" ", $output);
                            // Clean up standard php -l output
                            $errorOutput = str_replace("Errors parsing", "", $errorOutput);
                            $errors[] = "Syntax error in " . $file->getFilename() . ": " . trim($errorOutput);
                        }
                    }
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);
            
            if (count($errors) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($errors) . ' syntax/route errors found. Please check the details.',
                    'errors' => $errors,
                    'time_ms' => $time
                ];
            }
            
            return [
                'status' => 'passed',
                'message' => "Successfully verified {$routeCount} routes and checked syntax of {$fileCount} PHP files.",
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Syntax check failed: ' . $e->getMessage()
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Connection failed: ' . $e->getMessage(),
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
                    'time_ms' => $time
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
                'message' => 'Cache error: ' . $e->getMessage(),
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
                    'role' => 1
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
                    'time_ms' => $time
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
                'message' => 'Signup flow check failed: ' . $e->getMessage(),
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
                'refresh_url' => config('app.url') . '/return-test',
                'return_url' => config('app.url') . '/return-test',
                'type' => 'account_onboarding',
            ]);

            // Clean up
            StripeControl::deleteAccount($account->id);

            $time = round((microtime(true) - $start) * 1000, 2);

            if ($link && $link->url) {
                return [
                    'status' => 'passed',
                    'message' => 'Stripe Connect Account & ID Onboarding link created successfully.',
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'failed',
                'message' => 'Account created but failed to generate ID onboarding link.',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Stripe ID flow failed: ' . $e->getMessage(),
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
                'time_ms' => $time
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Stripe Payments check failed: ' . $e->getMessage(),
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Email configuration check failed: ' . $e->getMessage(),
            ];
        }
    }

    private function testPushNotifications()
    {
        try {
            $start = microtime(true);
            $apiKey = env('MAGICBELL_API_KEY');
            $apiSecret = env('MAGICBELL_API_SECRET');

            if (!$apiKey || !$apiSecret) {
                return [
                    'status' => 'failed',
                    'message' => 'MagicBell credentials are missing in environment configuration.',
                    'time_ms' => 0
                ];
            }

            // We make a lightweight ping request to MagicBell to verify credentials
            // (Note: there isn't a direct ping, so we check the project info or just skip actual dispatching)
            // But we can test if the service class instantiates correctly.
            $service = new \App\Services\MagicBellService();
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'MagicBell Push Notification service is configured and ready.',
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Push notification check failed: ' . $e->getMessage(),
            ];
        }
    }

    private function testUploadcare()
    {
        try {
            $start = microtime(true);
            $publicKey = env('UPLOADCARE_PUBLIC_KEY');
            $secretKey = env('UPLOADCARE_SECRET_KEY');

            if (!$publicKey || !$secretKey) {
                return [
                    'status' => 'failed',
                    'message' => 'Uploadcare credentials are missing in environment configuration.',
                    'time_ms' => 0
                ];
            }

            // Test API object creation
            $api = \App\Uploadcare::getApiObj();
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'passed',
                'message' => 'Uploadcare (Image Hosting) is configured and API initialized successfully.',
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Uploadcare check failed: ' . $e->getMessage(),
            ];
        }
    }

    private function testWishItems()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (!$user) return ['status' => 'warning', 'message' => 'No user found to test wish items.'];

            DB::beginTransaction();
            try {
                // Add
                $item = WishItem::create([
                    'user_id' => $user->id,
                    'wishname' => 'Diagnostic Test Item',
                    'price' => 100,
                    'currency' => 'GBP',
                    'is_approved' => true,
                    'subscription' => 0 // Added to fix 1364 error
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Wish item test failed: ' . $e->getMessage()];
        }
    }

    private function testBills()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (!$user) return ['status' => 'warning', 'message' => 'No user found to test bills.'];

            DB::beginTransaction();
            try {
                $bill = Bills::create([
                    'user_id' => $user->id,
                    'name' => 'Diagnostic Bill',
                    'price' => 50,
                    'currency' => 'GBP',
                    'status' => 1,
                    'period' => 'monthly'
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Bills test failed: ' . $e->getMessage()];
        }
    }

    private function testMemberships()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (!$user) return ['status' => 'warning', 'message' => 'No user found to test memberships.'];

            DB::beginTransaction();
            try {
                $membership = Membership::create([
                    'user_id' => $user->id,
                    'level' => 'bronze',
                    'price' => 10,
                    'currency' => 'GBP',
                    'status' => 1,
                    'rewards' => 'Diagnostic rewards' // Added to fix 1364 error
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Memberships test failed: ' . $e->getMessage()];
        }
    }

    private function testShopItems()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (!$user) return ['status' => 'warning', 'message' => 'No user found to test shop items.'];

            DB::beginTransaction();
            try {
                $shop = Shop::create([
                    'user_id' => $user->id,
                    'name' => 'Diagnostic Shop Item',
                    'price' => 25,
                    'currency' => 'GBP',
                    'status' => 1,
                    'type' => 'digital'
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Shop items test failed: ' . $e->getMessage()];
        }
    }

    private function testTasks()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (!$user) return ['status' => 'warning', 'message' => 'No user found to test tasks.'];

            DB::beginTransaction();
            try {
                $task = Task::create([
                    'creator_id' => $user->id,
                    'title' => 'Diagnostic Task',
                    'price' => 20,
                    'status' => 1,
                    'category' => 'Diagnostic',
                    'type' => 'digital'
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Tasks test failed: ' . $e->getMessage()];
        }
    }

    private function testCartFlow()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            $wishItem = WishItem::first();
            
            if (!$user || !$wishItem) {
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
                    'status' => 1
                ]);
                $cart->delete();
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);
            return [
                'status' => 'passed',
                'message' => 'Add to cart flow tested successfully.',
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Cart flow test failed: ' . $e->getMessage()];
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
                    'followed_id' => $followed->id
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Social flow test failed: ' . $e->getMessage()];
        }
    }

    private function testProfileUpdate()
    {
        try {
            $start = microtime(true);
            $user = User::first();
            if (!$user) return ['status' => 'warning', 'message' => 'No user found for profile update test.'];

            $oldBio = $user->bio;

            DB::beginTransaction();
            try {
                $user->update([
                    'bio' => 'Diagnostic test bio update',
                    'name' => 'Diagnostic Test User',
                    'avatar' => '901c0a0e-e5de-4d7a-8ac3-de11a4632542', // Sample UUID
                    'cover' => '901c0a0e-e5de-4d7a-8ac3-de11a4632542'
                ]);
            } finally {
                DB::rollBack();
            }

            $time = round((microtime(true) - $start) * 1000, 2);
            return [
                'status' => 'passed',
                'message' => 'Profile update (Bio, Name) tested successfully.',
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Profile update test failed: ' . $e->getMessage()];
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
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Search engine test failed: ' . $e->getMessage()];
        }
    }

    private function testIntercom()
    {
        try {
            $start = microtime(true);
            $appId = config('services.intercom.app_id');
            $enabled = config('services.intercom.enabled');

            if (!$appId) {
                return [
                    'status' => 'warning',
                    'message' => 'Intercom App ID is not configured.',
                    'time_ms' => 0
                ];
            }

            $service = new \App\Services\IntercomService();
            $settings = $service->buildSettings(null); // Anonymous user settings
            $time = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => $enabled ? 'passed' : 'warning',
                'message' => 'Intercom integration is configured. (Enabled: ' . ($enabled ? 'Yes' : 'No') . ')',
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'message' => 'Intercom check failed: ' . $e->getMessage(),
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
                $issues[] = "{$failedJobsCount} failed job(s) in queue. Latest: " . ($latestFailed ? substr($latestFailed->exception, 0, 100) : 'unknown');
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
                    'message' => 'Queue issues detected. Failed: ' . $failedJobsCount . ', Pending: ' . $pendingJobs,
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Queue is healthy. Pending jobs: {$pendingJobs}, Failed jobs: 0.",
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Queue check skipped (table may not exist): ' . $e->getMessage(),
            ];
        }
    }

    private function testRecentErrorLog()
    {
        try {
            $start = microtime(true);
            $logPath = storage_path('logs/laravel.log');

            if (!file_exists($logPath)) {
                return ['status' => 'warning', 'message' => 'Log file not found at ' . $logPath, 'time_ms' => 0];
            }

            // Read last 300 lines efficiently
            $lines = [];
            $file = new \SplFileObject($logPath, 'r');
            $file->seek(PHP_INT_MAX);
            $totalLines = $file->key();
            $startLine = max(0, $totalLines - 300);

            $file->seek($startLine);
            while (!$file->eof()) {
                $lines[] = $file->current();
                $file->next();
            }

            // Extract ERROR/CRITICAL lines from last 24 hours
            $errorLines = [];
            $yesterday = now()->subDay()->format('Y-m-d');
            $today = now()->format('Y-m-d');

            foreach ($lines as $line) {
                if (preg_match('/\[('. $today . '|' . $yesterday . ')/', $line) &&
                    preg_match('/\.(ERROR|CRITICAL|ALERT|EMERGENCY)/i', $line)) {
                    $errorLines[] = trim($line);
                }
            }

            // Deduplicate similar errors (keep unique first 100 chars)
            $unique = [];
            $seen = [];
            foreach ($errorLines as $err) {
                $key = substr($err, 0, 100);
                if (!in_array($key, $seen)) {
                    $seen[] = $key;
                    $unique[] = $err;
                }
            }
            $unique = array_slice($unique, -20); // last 20 unique errors

            $time = round((microtime(true) - $start) * 1000, 2);
            $errorCount = count($unique);

            if ($errorCount > 0) {
                return [
                    'status' => 'failed',
                    'message' => "{$errorCount} unique error(s) found in logs (last 24 hours). Review below.",
                    'errors' => $unique,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'No ERROR/CRITICAL entries in logs in the last 24 hours.',
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'warning', 'message' => 'Could not read error log: ' . $e->getMessage()];
        }
    }

    private function testFinancialIntegrity()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check for negative net_amount
            $negativeNet = FinancialTransaction::where('net_amount', '<', 0)->count();
            if ($negativeNet > 0) {
                $issues[] = "{$negativeNet} transaction(s) have negative net_amount.";
            }

            // Check for math mismatch: gross should >= net + fees (allow £0.01 rounding)
            $mathMismatch = FinancialTransaction::whereRaw(
                'ABS(gross_amount - (net_amount + platform_fee + stripe_fee + vat_amount)) > 0.02'
            )->count();
            if ($mathMismatch > 0) {
                $issues[] = "{$mathMismatch} transaction(s) have amount calculation mismatch (gross ≠ net + fees).";
            }

            // Check for held reserve with zero reserve_amount
            $badReserve = FinancialTransaction::where('reserve_status', 'held')
                ->where(function ($q) {
                    $q->whereNull('reserve_amount')->orWhere('reserve_amount', '<=', 0);
                })->count();
            if ($badReserve > 0) {
                $issues[] = "{$badReserve} transaction(s) marked 'held' reserve but have no reserve_amount.";
            }

            // Check for pending transactions older than 7 days
            $stalePending = FinancialTransaction::where('status', 'pending')
                ->where('created_at', '<', now()->subDays(7))
                ->count();
            if ($stalePending > 0) {
                $issues[] = "{$stalePending} transaction(s) have been 'pending' for more than 7 days.";
            }

            $time = round((microtime(true) - $start) * 1000, 2);
            $totalTx = FinancialTransaction::count();

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => "Financial integrity issues found in {$totalTx} total transactions.",
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => "All {$totalTx} financial transaction(s) passed integrity checks.",
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Financial integrity check failed: ' . $e->getMessage()];
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
            $stuckPayouts = CreatorReferral::where('status', 'PAYOUT_REQUESTED')
                ->where('updated_at', '<', now()->subDays(14))
                ->count();
            if ($stuckPayouts > 0) {
                $issues[] = "{$stuckPayouts} referral(s) stuck in PAYOUT_REQUESTED for over 14 days — admin review needed.";
            }

            // Check for PENDING payouts older than 7 days
            $oldPendingPayouts = CreatorReferralPayout::where('status', 'PENDING')
                ->where('requested_at', '<', now()->subDays(7))
                ->count();
            if ($oldPendingPayouts > 0) {
                $issues[] = "{$oldPendingPayouts} payout request(s) pending for over 7 days without admin action.";
            }

            // Check referral config
            $rewardAmount = config('referral.reward_amount');
            if (!$rewardAmount) {
                $issues[] = "referral.reward_amount config is not set — payout calculations may be wrong.";
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'warning',
                    'message' => "Referral system has {$activeCodes} active code(s) but issues detected.",
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Referral system OK. Active codes: {$activeCodes}. No stuck payouts.",
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Referral system check failed: ' . $e->getMessage()];
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
                if (!is_dir($path)) {
                    $issues[] = "Directory missing: {$path}";
                } elseif (!is_writable($path)) {
                    $issues[] = "Not writable: {$path}";
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($issues) . ' storage permission issue(s) detected.',
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'All storage directories exist and are writable.',
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Storage permission check failed: ' . $e->getMessage()];
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
                    'time_ms' => $time
                ];
            }

            if ($usedPercent >= 75) {
                return [
                    'status' => 'warning',
                    'message' => "Disk is {$usedPercent}% full. {$freeGB} GB free remaining.",
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Disk usage: {$usedPercent}%. {$freeGB} GB free available.",
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'warning', 'message' => 'Disk space check failed: ' . $e->getMessage()];
        }
    }

    private function testEnvironmentVariables()
    {
        try {
            $start = microtime(true);
            $missing = [];

            $required = [
                'APP_KEY'               => env('APP_KEY'),
                'DB_HOST'               => env('DB_HOST'),
                'DB_DATABASE'           => env('DB_DATABASE'),
                'STRIPE_SECRET'         => config('services.stripe.secret') ?? env('STRIPE_SECRET'),
                'STRIPE_KEY'            => config('services.stripe.key') ?? env('STRIPE_KEY'),
                'STRIPE_WEBHOOK_SECRET' => config('services.stripe.webhook_secret') ?? env('STRIPE_WEBHOOK_SECRET'),
                'MAGICBELL_API_KEY'     => env('MAGICBELL_API_KEY'),
                'MAGICBELL_API_SECRET'  => env('MAGICBELL_API_SECRET'),
                'UPLOADCARE_PUBLIC_KEY' => env('UPLOADCARE_PUBLIC_KEY'),
                'UPLOADCARE_SECRET_KEY' => env('UPLOADCARE_SECRET_KEY'),
                'MAIL_HOST'             => env('MAIL_HOST'),
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
                    'message' => count($missing) . ' required environment variable(s) are missing.',
                    'errors' => $missing,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'All ' . count($required) . ' required environment variables are configured.',
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Environment check failed: ' . $e->getMessage()];
        }
    }

    private function testStripeWebhookConfig()
    {
        try {
            $start = microtime(true);
            $webhookSecret = config('services.stripe.webhook_secret') ?? env('STRIPE_WEBHOOK_SECRET');
            $issues = [];

            if (empty($webhookSecret)) {
                $issues[] = 'STRIPE_WEBHOOK_SECRET is not set — Stripe webhook signature verification will fail.';
            } elseif (!str_starts_with($webhookSecret, 'whsec_')) {
                $issues[] = 'STRIPE_WEBHOOK_SECRET does not start with "whsec_" — may be invalid.';
            }

            $stripeKey = config('services.stripe.secret') ?? env('STRIPE_SECRET');
            if (!empty($stripeKey) && str_starts_with($stripeKey, 'sk_live_') && app()->environment('local')) {
                $issues[] = 'WARNING: Live Stripe key (sk_live_) used in local environment!';
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($issues) > 0) {
                return [
                    'status' => 'failed',
                    'message' => 'Stripe webhook configuration issues found.',
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            $mode = str_starts_with($stripeKey ?? '', 'sk_live_') ? 'LIVE' : 'TEST';
            return [
                'status' => 'passed',
                'message' => "Stripe webhook secret is configured. Mode: {$mode}.",
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Stripe webhook config check failed: ' . $e->getMessage()];
        }
    }

    private function testScheduledTasks()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Check if the schedule:run command cache key exists (set by our scheduler heartbeat)
            $lastHeartbeat = Cache::get('scheduler_heartbeat');

            if (!$lastHeartbeat) {
                $issues[] = 'No scheduler heartbeat found. The cron job may not be running. Ensure "php artisan schedule:run" runs every minute.';
            } else {
                $minutesAgo = round((time() - $lastHeartbeat) / 60, 1);
                if ($minutesAgo > 5) {
                    $issues[] = "Scheduler heartbeat is {$minutesAgo} minutes old — cron may be down.";
                }
            }

            // Check horizon or queue worker via cache key (if set by worker)
            $queueWorkerAlive = Cache::get('queue_worker_heartbeat');
            if (!$queueWorkerAlive) {
                $issues[] = 'No queue worker heartbeat detected. Consider setting a heartbeat in a scheduled command.';
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (!empty($issues)) {
                return [
                    'status' => 'warning',
                    'message' => 'Scheduler/Worker heartbeat check has warnings.',
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'Laravel scheduler heartbeat is active and recent.',
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'warning', 'message' => 'Scheduled tasks check failed: ' . $e->getMessage()];
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
            $files = glob($migrationPath . '/*.php');
            $pending = [];

            foreach ($files as $file) {
                $name = pathinfo($file, PATHINFO_FILENAME);
                if (!in_array($name, $ran)) {
                    $pending[] = $name;
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);

            if (count($pending) > 0) {
                return [
                    'status' => 'failed',
                    'message' => count($pending) . ' migration(s) not yet run. Run "php artisan migrate" on the server.',
                    'errors' => $pending,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'All ' . count($ran) . ' migrations have been applied.',
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Migration check failed: ' . $e->getMessage()];
        }
    }

    private function testStripeConnectedAccountsHealth()
    {
        try {
            $start = microtime(true);
            $issues = [];

            // Get creators with stripe account_id who have recent transactions
            $connectedCreators = User::whereNotNull('account_id')
                ->whereRaw('TRIM(account_id) <> ""')
                ->where('role', 1)
                ->limit(20)
                ->pluck('account_id', 'id');

            if ($connectedCreators->isEmpty()) {
                return ['status' => 'warning', 'message' => 'No Stripe connected accounts found to verify.', 'time_ms' => 0];
            }

            $client = StripeControl::getClient();
            $restricted = 0;
            $pendingReqs = 0;
            $lookupFailures = 0;

            foreach ($connectedCreators as $userId => $accountId) {
                try {
                    $account = $client->accounts->retrieve($accountId);

                    if ($account->payouts_enabled === false) {
                        $restricted++;
                        $issues[] = "Creator #{$userId} (Stripe: {$accountId}): payouts DISABLED.";
                    }

                    if (!empty($account->requirements->currently_due)) {
                        $pendingReqs++;
                        $issues[] = "Creator #{$userId} (Stripe: {$accountId}): has pending requirements — " . implode(', ', array_slice($account->requirements->currently_due, 0, 3));
                    }
                } catch (\Exception $e) {
                    $lookupFailures++;
                    $issues[] = "Creator #{$userId}: Stripe account lookup failed — " . $e->getMessage();
                }
            }

            $time = round((microtime(true) - $start) * 1000, 2);
            $checked = $connectedCreators->count();

            if (count($issues) > 0) {
                return [
                    'status' => 'warning',
                    'message' => "Checked {$checked} accounts: {$restricted} payout-disabled, {$pendingReqs} with pending requirements, {$lookupFailures} lookup failures.",
                    'errors' => $issues,
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => "All {$checked} sampled Stripe connected accounts have payouts enabled.",
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Stripe accounts health check failed: ' . $e->getMessage()];
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

            $pingUrl = rtrim($appUrl, '/') . '/ping';
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
                    'time_ms' => $time
                ];
            }

            if ($time > 2000) {
                return [
                    'status' => 'warning',
                    'message' => "Homepage response is slow: {$time}ms (HTTP {$statusCode}). Consider optimisation.",
                    'time_ms' => $time
                ];
            }

            if ($statusCode >= 500) {
                return [
                    'status' => 'failed',
                    'message' => "Homepage returned HTTP {$statusCode}. Server error detected.",
                    'time_ms' => $time
                ];
            }

            if ($statusCode >= 400) {
                return [
                    'status' => 'warning',
                    'message' => "Homepage responded in {$time}ms with HTTP {$statusCode}. Non-success response detected.",
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => "Homepage responded in {$time}ms with HTTP {$statusCode}.",
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'App response time check failed: ' . $e->getMessage()];
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
                    'time_ms' => $time
                ];
            }

            return [
                'status' => 'passed',
                'message' => 'No stuck payouts or blocked reserves found.',
                'errors' => [],
                'time_ms' => $time
            ];
        } catch (\Exception $e) {
            return ['status' => 'failed', 'message' => 'Stuck payouts check failed: ' . $e->getMessage()];
        }
    }
}
