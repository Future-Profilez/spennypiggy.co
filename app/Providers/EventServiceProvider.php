<?php

namespace App\Providers;

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
