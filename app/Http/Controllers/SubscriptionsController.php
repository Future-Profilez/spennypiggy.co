<?php

namespace App\Http\Controllers;

use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\SubscriptionEvent;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SubscriptionsController extends Controller
{
    /**
     * Display the user's subscription dashboard
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Subscriptions/Index', [
            'mySubscriptions' => $this->getMySubscriptions($user),
            'subscribersToMe' => $this->getSubscribersToMe($user),
            'subscriptionStats' => $this->getSubscriptionStats($user),
        ]);
    }

    /**
     * Get subscriptions the user has purchased
     */
    private function getMySubscriptions($user)
    {
        $subscriptions = [];

        // Wish Item Subscriptions
        $wishSubscriptions = WishItemSubscription::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })
            ->with(['wish_item', 'wish_item.user', 'events'])
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($wishSubscriptions as $sub) {
            $subscriptions[] = [
                'id' => $sub->id,
                'uuid' => $sub->uuid,
                'type' => 'wish_subscription',
                'stripe_id' => $sub->stripe_id,
                'stripe_status' => $sub->stripe_status,
                'status' => $sub->isActive() ? 'active' : ($sub->isCanceling() ? 'canceling' : 'inactive'),
                'cancel_at_period_end' => $sub->cancel_at_period_end,
                'wish_item' => $sub->wish_item ? [
                    'id' => $sub->wish_item->id,
                    'wishname' => $sub->wish_item->wishname,
                    'image_url' => $sub->wish_item->perma_link,
                ] : null,
                'creator' => $sub->wish_item && $sub->wish_item->user ? [
                    'id' => $sub->wish_item->user->id,
                    'name' => $sub->wish_item->user->name,
                    'username' => $sub->wish_item->user->username,
                    'avatar_url' => $sub->wish_item->user->avatar ?? null,
                ] : null,
                'amount' => $sub->amount,
                'currency' => $sub->currency,
                'recurring_type' => $sub->recurring_type,
                'recurring_for' => $sub->recurring_for,
                'current_period_start' => $sub->current_period_start ? $sub->current_period_start->toISOString() : null,
                'current_period_end' => $sub->current_period_end ? $sub->current_period_end->toISOString() : null,
                'next_payment' => $sub->getNextPaymentDate() ? $sub->getNextPaymentDate()->toISOString() : null,
                'created_at' => $sub->created_at,
                'can_cancel' => $sub->canBeCanceled(),
                'is_active' => $sub->isActive(),
                'expires_at' => $sub->recurring_for === 'onetime' ?
                    Carbon::parse($sub->created_at)->addDays(30) : null,
                'recent_events' => $sub->events()->take(5)->get()->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'event_type' => $event->event_type,
                        'event_date' => $event->event_date,
                        'amount' => $event->amount,
                        'currency' => $event->currency,
                        'notes' => $event->notes,
                    ];
                }),
            ];
        }

        return $subscriptions;
    }

    /**
     * Get users who have subscribed to the current user's content
     */
    private function getSubscribersToMe($user)
    {
        $subscribers = [];

        // Get wish subscriptions to my content
        $wishSubscriptions = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
            ->with(['wish_item', 'user', 'events'])
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($wishSubscriptions as $sub) {
            $subscribers[] = [
                'id' => $sub->id,
                'uuid' => $sub->uuid,
                'type' => 'wish_subscription',
                'stripe_status' => $sub->stripe_status,
                'status' => $sub->isActive() ? 'active' : ($sub->isCanceling() ? 'canceling' : 'inactive'),
                'wish_item' => [
                    'id' => $sub->wish_item->id,
                    'wishname' => $sub->wish_item->wishname,
                    'image_url' => $sub->wish_item->perma_link,
                ],
                'subscriber' => [
                    'id' => $sub->user_id,
                    'name' => $sub->user ? $sub->user->name : ($sub->guest_name ?: 'Guest'),
                    'email' => $sub->user ? $sub->user->email : $sub->guest_email,
                    'username' => $sub->user ? $sub->user->username : null,
                    'avatar_url' => $sub->user ? $sub->user->avatar : null,
                ],
                'amount' => $sub->amount,
                'currency' => $sub->currency,
                'recurring_type' => $sub->recurring_type,
                'recurring_for' => $sub->recurring_for,
                'current_period_start' => $sub->current_period_start ? $sub->current_period_start->toISOString() : null,
                'current_period_end' => $sub->current_period_end ? $sub->current_period_end->toISOString() : null,
                'created_at' => $sub->created_at,
                'total_revenue' => $this->calculateSubscriptionRevenue($sub),
                'payments_count' => $sub->events()->byEventType('payment_succeeded')->count(),
            ];
        }

        return $subscribers;
    }

    /**
     * Get subscription statistics for the user
     */
    private function getSubscriptionStats($user)
    {
        $stats = [
            'as_subscriber' => [
                'active_count' => 0,
                'total_spent' => 0,
                'monthly_cost' => 0,
            ],
            'as_creator' => [
                'active_subscribers' => 0,
                'total_revenue' => 0,
                'monthly_revenue' => 0,
            ],
        ];

        // Stats as subscriber
        $myActiveSubscriptions = WishItemSubscription::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })->active()->get();

        $stats['as_subscriber']['active_count'] = $myActiveSubscriptions->count();
        $stats['as_subscriber']['total_spent'] = $myActiveSubscriptions->sum('amount');
        $stats['as_subscriber']['monthly_cost'] = $myActiveSubscriptions
            ->where('recurring_for', 'continue')
            ->sum('amount');

        // Stats as creator
        $subscribersToMe = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->active()->get();

        $stats['as_creator']['active_subscribers'] = $subscribersToMe->count();
        $stats['as_creator']['monthly_revenue'] = $subscribersToMe
            ->where('recurring_for', 'continue')
            ->sum('amount');

        // Calculate total revenue from all subscription events
        $totalRevenue = SubscriptionEvent::whereIn('subscription_id', $subscribersToMe->pluck('id'))
            ->where('subscription_type', 'wish_item')
            ->byEventType('payment_succeeded')
            ->sum('amount');

        $stats['as_creator']['total_revenue'] = $totalRevenue ?: $subscribersToMe->sum('amount');

        return $stats;
    }

    /**
     * Calculate total revenue from a subscription
     */
    private function calculateSubscriptionRevenue($subscription)
    {
        $paymentEvents = $subscription->events()
            ->byEventType('payment_succeeded')
            ->sum('amount');

        return $paymentEvents ?: $subscription->amount;
    }

    /**
     * Get subscription details with full history
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        // First try to find in user's subscriptions
        $subscription = WishItemSubscription::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('guest_email', $user->email)
                  // Or if user is the creator of the subscribed item
                    ->orWhereHas('wish_item', function ($subQ) use ($user) {
                        $subQ->where('user_id', $user->id);
                    });
            })
            ->with(['wish_item', 'wish_item.user', 'user', 'events'])
            ->first();

        if (! $subscription) {
            return response()->json(['error' => 'Subscription not found'], 404);
        }

        return Inertia::render('Subscriptions/Show', [
            'subscription' => [
                'id' => $subscription->id,
                'uuid' => $subscription->uuid,
                'stripe_id' => $subscription->stripe_id,
                'stripe_status' => $subscription->stripe_status,
                'status' => $subscription->isActive() ? 'active' : ($subscription->isCanceling() ? 'canceling' : 'inactive'),
                'cancel_at_period_end' => $subscription->cancel_at_period_end,
                'wish_item' => $subscription->wish_item,
                'creator' => $subscription->wish_item ? $subscription->wish_item->user : null,
                'subscriber' => $subscription->user ?: [
                    'name' => $subscription->guest_name,
                    'email' => $subscription->guest_email,
                ],
                'amount' => $subscription->amount,
                'currency' => $subscription->currency,
                'recurring_type' => $subscription->recurring_type,
                'recurring_for' => $subscription->recurring_for,
                'current_period_start' => $subscription->current_period_start,
                'current_period_end' => $subscription->current_period_end,
                'created_at' => $subscription->created_at,
                'can_cancel' => $subscription->canBeCanceled(),
                'is_active' => $subscription->isActive(),
                'total_revenue' => $this->calculateSubscriptionRevenue($subscription),
            ],
            'events' => $subscription->events()->orderBy('event_date', 'desc')->get(),
            'isOwner' => $subscription->wish_item && $subscription->wish_item->user_id === $user->id,
        ]);
    }

    /**
     * Cancel a subscription by ID (alternative route for frontend compatibility)
     */
    public function cancelSubscriptionById(Request $request, $id)
    {
        $user = $request->user();

        try {
            // Try to find the subscription in wish_item_subscriptions first
            $subscription = WishItemSubscription::where('id', $id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                })
                ->first();

            if ($subscription) {
                return $this->cancelWishItemSubscription($request, $subscription);
            }

            // Try membership subscriptions
            $subscription = MembershipPayment::where('id', $id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                })
                ->first();

            if ($subscription) {
                return $this->cancelMembershipSubscription($request, $subscription);
            }

            // Try bill subscriptions
            $subscription = BillPayment::where('id', $id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                })
                ->first();

            if ($subscription) {
                return $this->cancelBillSubscription($request, $subscription);
            }

            if ($request->expectsJson()) {
                return response()->json(['error' => 'Subscription not found'], 404);
            }

            return back()->with('error', 'Subscription not found.');

        } catch (\Exception $e) {
            Log::error('Failed to cancel subscription by ID', [
                'subscription_id' => $id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            if ($request->expectsJson()) {
                return response()->json(['error' => 'Failed to cancel subscription. Please try again.'], 500);
            }

            return back()->with('error', 'Failed to cancel subscription. Please try again.');
        }
    }

    private function cancelWishItemSubscription(Request $request, $subscription)
    {
        // Handle case where subscription ID is passed instead of object
        if (is_numeric($subscription)) {
            $subscription = WishItemSubscription::find($subscription);
            if (! $subscription) {
                if ($request->expectsJson()) {
                    return response()->json(['error' => 'Subscription not found'], 404);
                }

                return back()->with('error', 'Subscription not found.');
            }
        }

        if (! $subscription->stripe_id) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'No Stripe subscription ID found'], 400);
            }

            return back()->with('error', 'No Stripe subscription ID found.');
        }

        if (! $subscription->canBeCanceled()) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'This subscription cannot be canceled'], 400);
            }

            return back()->with('error', 'This subscription cannot be canceled.');
        }

        try {
            // Cancel the subscription in Stripe using cancel_at_period_end.
            // Wish subscriptions are Direct Charges on the creator's connected account,
            // so the update needs stripe_account or Stripe returns "No such subscription".
            if (! str_starts_with($subscription->stripe_id, 'sub_test_')) {
                $creatorId = optional($subscription->wish_item)->user_id;
                $accountId = $creatorId ? optional(User::find($creatorId))->account_id : null;

                StripeControl::cancelSubscription($subscription->stripe_id, true, $accountId);
            }

            // Update local status
            $subscription->update([
                'cancel_at_period_end' => true,
                'canceled_at' => now(),
            ]);

            // Log the cancellation event
            $subscription->logEvent('canceled', [
                'notes' => 'Subscription canceled by user',
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Subscription will be canceled at the end of the current billing period.',
                ]);
            }

            return back()->with('success', 'Subscription will be canceled at the end of the current billing period.');

        } catch (\Exception $e) {
            Log::error('Failed to cancel Stripe subscription', [
                'subscription_id' => $subscription->id,
                'stripe_id' => $subscription->stripe_id,
                'error' => $e->getMessage(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to cancel subscription. Please try again or contact support.',
                ], 500);
            }

            return back()->with('error', 'Failed to cancel subscription. Please try again or contact support.');
        }
    }

    private function cancelMembershipSubscription(Request $request, $subscription)
    {
        // Similar logic for membership subscriptions
        if (! $subscription->stripe_id) {
            return back()->with('error', 'No Stripe subscription ID found.');
        }

        try {
            // Direct-Charge subscriptions live on the CREATOR's connected account — a
            // cancel without stripe_account throws "No such subscription". Resolve the
            // account via User::find (not the relation, whose scope hides suspended
            // creators). Cancel AT PERIOD END so the supporter keeps the access they
            // already paid for; customer.subscription.deleted flips the local row when
            // the period actually ends.
            $creatorId = optional($subscription->membership)->user_id;
            $accountId = $creatorId ? optional(User::find($creatorId))->account_id : null;

            StripeControl::cancelSubscription($subscription->stripe_id, true, $accountId);
            $subscription->cancel_at_period_end = true;
            $subscription->save();

            return back()->with('success', 'Membership will be cancelled at the end of the current billing period. You keep access until then.');

        } catch (\Exception $e) {
            Log::error('Failed to cancel membership subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to cancel subscription. Please try again.');
        }
    }

    private function cancelBillSubscription(Request $request, $subscription)
    {
        // Similar logic for bill subscriptions
        if (! $subscription->stripe_id) {
            return back()->with('error', 'No Stripe subscription ID found.');
        }

        try {
            // See cancelMembershipSubscription: resolve the creator's connected account
            // and cancel at period end so access is retained until the paid period ends.
            $creatorId = optional($subscription->bill)->user_id;
            $accountId = $creatorId ? optional(User::find($creatorId))->account_id : null;

            StripeControl::cancelSubscription($subscription->stripe_id, true, $accountId);
            $subscription->cancel_at_period_end = true;
            $subscription->save();

            return back()->with('success', 'Bill subscription will be cancelled at the end of the current billing period. You keep access until then.');

        } catch (\Exception $e) {
            Log::error('Failed to cancel bill subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to cancel subscription. Please try again.');
        }
    }
}
