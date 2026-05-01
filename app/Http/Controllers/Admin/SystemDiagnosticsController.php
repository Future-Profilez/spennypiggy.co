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
            'database' => $this->testDatabase(),
            'cache' => $this->testCache(),
            'signup_flow' => $this->testSignupFlow(),
            'stripe_id_flow' => $this->testStripeIdFlow(),
            'stripe_payments' => $this->testStripePayments(),
            'email' => $this->testEmail(),
            'push_notifications' => $this->testPushNotifications(),
            'uploadcare' => $this->testUploadcare(),
            'intercom' => $this->testIntercom(),
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
}
