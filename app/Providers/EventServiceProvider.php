<?php

namespace App\Providers;

use App\Listeners\AlertOnLockout;
use App\Listeners\RecordFailedLogin;
use App\Listeners\RecordUserLogin;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\TipGoal;
use App\Models\User;
use App\Models\WishItem;
use App\Observers\ActivityObserver;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        // Records user sign-ins into the shared login_logs table. Until this
        // existed the table held admin logins only, and the admin panel's
        // "inactive N months" segments read it as "nobody has ever signed in".
        Login::class => [
            RecordUserLogin::class,
        ],
        // 🚨 Security Checklist §3. `LoginRequest` has always fired Lockout, and
        // until now NOTHING listened for it — the framework was announcing a
        // brute-force into an empty room. Failed does the same job one step
        // earlier: without it the website recorded no login failures at all, so
        // a per-IP threshold had no data to be computed from.
        Failed::class => [
            RecordFailedLogin::class,
        ],
        Lockout::class => [
            AlertOnLockout::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot()
    {
        // Register observers only for specific models
        $modelsToObserve = [
            WishItem::class,
            Membership::class,
            Post::class,
            Task::class,
            Shop::class,
            Bills::class,
            PiggyPot::class,
            TipGoal::class,
            User::class,
        ];

        foreach ($modelsToObserve as $model) {
            $model::observe(ActivityObserver::class);
        }
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
