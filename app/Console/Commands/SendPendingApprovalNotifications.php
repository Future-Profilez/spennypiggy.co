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

            // List of model config
            $models = [
                [
                    'model' => \App\Models\WishItem::class,
                    'relation' => 'user',
                    'conditions' => ['is_approved' => 0],
                    'label' => 'Wish Items',
                ],
                [
                    'model' => \App\Models\Membership::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Memberships',
                ],
                [
                    'model' => \App\Models\Bills::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Bills',
                ],
                [
                    'model' => \App\Models\Shop::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'Shops',
                ],
                [
                    'model' => \App\Models\UserIntro::class,
                    'relation' => 'user',
                    'conditions' => ['approved' => 0],
                    'label' => 'User Intros',
                ],
                [
                    'model' => \App\Models\User::class,
                    'relation' => null,
                    'conditions' => [
                        ['avatar', '!=', null],
                        ['avatar_approved', '=', 0],
                    ],
                    'label' => 'User Avatars',
                ],
                [
                    'model' => \App\Models\UserVerificationStatus::class,
                    'relation' => 'user',
                    'conditions_callback' => function ($query) {
                        $query->where(function ($q) {
                            // Creator condition: role = 1
                            $q->whereHas('user', function ($userQuery) {
                                $userQuery->where('role', 1)
                                    ->whereNotNull('avatar')->where('avatar_approved', 0)
                                    ->whereNotNull('bio')->where('bio_approved', 0)
                                    ->where('profile_status_lock', 1)
                                    ->where('is_subscribed', 1);
                            });
                        })->orWhere(function ($q) {
                            // Gifter condition: role = 0
                            $q->whereHas('user', function ($userQuery) {
                                $userQuery->where('role', 0)
                                    ->where('is_500_limit_exceeded', 1)
                                    ->where('is_subscribed', 1)
                                    ->where('profile_status_lock', 1);
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

                // Apply soft deletes check
                if (in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses($model))) {
                    $query->whereNull('deleted_at');
                }

                $items = $query->get();

                if ($items->isNotEmpty()) {
                    $pendingSummary[] = [
                        'label' => $config['label'],
                        'count' => $items->count(),
                        'items' => $items,
                    ];
                }
            }

            if (!empty($pendingSummary)) {
                $appUrl = env('APP_URL'); // e.g. https://dev.spennypiggy.co

                $toEmail = null;
                if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
                    $toEmail = 'prem@futureprofilez.com';
                } elseif ($appUrl == 'https://spennypiggy.co') {
                    $toEmail = 'jack@socialvortex.io';
                }

                if ($toEmail != null) {
                    Notification::route('mail', $toEmail)
                        ->notify(new PendingApprovalNotification($pendingSummary));
                }
            } else {
                Log::info('No pending items found.');
            }

            $this->info('Summary email for pending approvals sent successfully.');
        } catch (Exception $e) {
            $this->error("Failed to sync: " . $e->getMessage());
        }
    }
}
