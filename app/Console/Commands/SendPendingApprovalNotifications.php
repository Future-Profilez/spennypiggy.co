<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Models\Admin;
use App\Notifications\PendingApprovalNotification;
use App\Notifications\PendingApprovalSummaryNotification;
use Exception;
use Illuminate\Http\Request;

class SendPendingApprovalNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:notifications-pending-approval';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send summary notification for unapproved pending items every 30 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $pendingSummary = [];
            $models = [
                [
                    'model' => \App\Models\WishItem::class,
                    'relation' => 'user',
                    'conditions' => ['is_approved' => 0],
                    'label' => 'Wish Items',
                    'exclude_edit' => function ($query) {
                        // Exclude items with pending edit requests (edited_status = 0)
                        $query->where(function ($q) {
                            $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
                        });
                    },
                ],
                [
                    'model' => \App\Models\Membership::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Memberships',
                    // TODO: Add 'exclude_edit' callback if this model has edit status columns
                ],
                [
                    'model' => \App\Models\Bills::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Bills',
                    // TODO: Add 'exclude_edit' callback if this model has edit status columns
                ],
                [
                    'model' => \App\Models\Shop::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Shops',
                    // TODO: Add 'exclude_edit' callback if this model has edit status columns
                ],
                [
                    'model' => \App\Models\UserIntro::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'User Intros',
                    // TODO: Add 'exclude_edit' callback if this model has edit status columns
                ],
                [
                    'model' => \App\Models\User::class,
                    'relation' => null,
                    'conditions' => [
                        ['avatar', '!=', null],
                        ['avatar_approved', '=', 0],
                    ],
                    'label' => 'User Avatars',
                    'exclude_edit' => function ($query) {
                        // Exclude users with bio edit requests
                        $query->whereNull('edit_bio_reason');
                    },
                ],
                [
                    'model' => \App\Models\UserVerificationStatus::class,
                    'relation' => 'user',
                    'conditions_callback' => function ($query) {
                        $query->where(function ($q) {
                            // Creator condition: role = 1
                            $q->whereHas('user', function ($userQuery) {
                                $userQuery->where('role', 1)
                                    ->whereNotNull('avatar')
                                    ->whereNotNull('bio')
                                    ->where('profile_status_lock', 1)
                                    ->where('is_subscribed', 1)
                                    ->whereNull('edit_bio_reason'); // Exclude users with bio edit requests
                            });
                        })->orWhere(function ($q) {
                            // Gifter condition: role = 0
                            $q->whereHas('user', function ($userQuery) {
                                $userQuery->where('role', 0)
                                    ->where('is_500_limit_exceeded', 1)
                                    ->where('is_subscribed', 1)
                                    ->where('profile_status_lock', 1)
                                    ->whereNull('edit_bio_reason'); // Exclude users with bio edit requests
                            });
                        });
                    },
                    'label' => 'User Profiles',
                ],
                [
                    'model' => \App\Models\Post::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Posts',
                    // TODO: Add 'exclude_edit' callback if this model has edit status columns
                ],
            ];

            foreach ($models as $config) {
                $model = $config['model'];
                $query = $model::query();

                if (isset($config['relation'])) {
                    $query->whereHas($config['relation'])->with($config['relation']);
                }

                if (isset($config['conditions'])) {
                    $query->where($config['conditions']);
                }

                if (isset($config['conditions_callback'])) {
                    $query->where(function ($q) use ($config) {
                        $config['conditions_callback']($q);
                    });
                }

                // Apply exclude_edit callback if provided
                if (isset($config['exclude_edit']) && is_callable($config['exclude_edit'])) {
                    $config['exclude_edit']($query);
                }

                // Apply soft deletes check using class_uses_recursive to catch all inheritance
                if (in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($model))) {
                    $query->whereNull('deleted_at');
                }

                $items = $query->get();

                if ($items->isNotEmpty()) {
                    $pendingSummary[] = [
                        'label' => $config['label'],
                        'count' => $items->count(),
                        'items' => $items,
                        'icon' => config('pending-approval.icons.' . $config['label'], '🔔'), // Default to bell if icon not found
                    ];
                }
            }

            if (!empty($pendingSummary)) {
                // Get application URL and find matching email recipients from config
                $appUrl = env('APP_URL'); // e.g. https://dev.spennypiggy.co
                $allConfigs = collect(config('pending-approval'));
                $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains'])); 
                $emails = $environmentConfig['emails'] ?? [];

                if (!empty($emails)) {
                    // Send notification to all configured recipients
                    Notification::route('mail', $emails)
                        ->notify(new PendingApprovalNotification($pendingSummary));
                    
                    $this->info('Summary email for pending approvals sent to: ' . implode(', ', $emails));
                } else {
                    Log::info('No email recipients configured for URL: ' . $appUrl);
                }
            } else {
                Log::info('No pending items found.');
            }
        } catch (Exception $e) {
            $this->error("Failed to send notification: " . $e->getMessage());
        }
    }
}
