<?php

namespace App\Http\Controllers;

use App\Models\Deliverable;
use App\Models\WishItemSubscription;
use App\Models\MembershipPayment;
use App\Models\BillPayment;
use App\Models\TipGoalsPayment;
use App\Models\SubscriptionEvent;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PurchasesController extends Controller
{
    /**
     * Display the user's purchases
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get deliverables for the authenticated user (as gifter)
        $sentDeliverables = Deliverable::where('gifter_id', $user->id)
            ->with(['creator', 'wishItem', 'bill', 'membership'])
            ->select(['id', 'uuid', 'creator_id', 'item_id', 'deliverable_type', 'transaction_amount', 'product_type', 'payment_currency', 'certificate_url', 'deliverable_url', 'status', 'metadata', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Get deliverables received by the user (as creator)
        $receivedDeliverables = Deliverable::where('creator_id', $user->id)
            ->with(['gifter', 'wishItem', 'bill', 'membership'])
            ->select(['id', 'uuid', 'gifter_id', 'item_id', 'deliverable_type', 'transaction_amount', 'product_type', 'payment_currency', 'certificate_url', 'deliverable_url', 'status', 'metadata', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get active subscriptions for the user
        $activeSubscriptions = $this->getActiveSubscriptions($user);
        
        return Inertia::render('Purchases/Index', [
            'sentDeliverables' => $sentDeliverables,
            'receivedDeliverables' => $receivedDeliverables,
            'activeSubscriptions' => $activeSubscriptions,
        ]);
    }
    
    /**
     * Get all active subscriptions for a user
     */
    private function getActiveSubscriptions($user)
    {
        $subscriptions = [];
        
        // 1. Wish Item Subscriptions - Use the new active scope
        $wishSubscriptions = WishItemSubscription::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })
        ->with(['wish_item', 'wish_item.user'])
        ->active() // Use the new active scope
        ->get();
        
        foreach ($wishSubscriptions as $sub) {
            $subscriptions[] = [
                'id' => $sub->id,
                'uuid' => $sub->uuid,
                'type' => 'wish_subscription',
                'stripe_id' => $sub->stripe_id,
                'stripe_status' => $sub->stripe_status ?: ($sub->isActive() ? 'active' : 'inactive'),
                'cancel_at_period_end' => $sub->cancel_at_period_end,
                'is_active' => $sub->isActive(),
                'is_canceling' => $sub->isCanceling(),
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
                'is_canceling' => $sub->isCanceling(),
                'expires_at' => $sub->recurring_for === 'onetime' ? 
                    Carbon::parse($sub->created_at)->addDays(30) : null,
            ];
        }
        
        // 2. Membership Subscriptions
        $membershipSubscriptions = MembershipPayment::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })
        ->with(['membership', 'membership.user'])
        ->where('status', 'paid')
        ->where('upcoming_payment', '>=', Carbon::now())
        ->get();
        
        foreach ($membershipSubscriptions as $sub) {
            $subscriptions[] = [
                'id' => $sub->id,
                'uuid' => $sub->uuid,
                'type' => 'membership',
                'stripe_id' => $sub->stripe_id,
                'item_name' => $sub->membership->level ?? 'Membership',
                'creator' => [
                    'name' => $sub->membership->user->name ?? '',
                    'username' => $sub->membership->user->username ?? '',
                    'avatar_url' => $sub->membership->user->avatar_url ?? null,
                ],
                'amount' => $sub->amount,
                'currency' => $sub->currency,
                'recurring_type' => $sub->recurring_type,
                'recurring_for' => $sub->recurring_for,
                'next_payment' => $sub->upcoming_payment,
                'created_at' => $sub->created_at,
                'can_cancel' => $sub->recurring_for !== 'lifetime' && $sub->status === 'paid',
            ];
        }
        
        // 3. Bill Subscriptions
        $billSubscriptions = BillPayment::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
        })
        ->with(['bill', 'bill.user'])
        ->where('status', 'paid')
        ->where('upcoming_payment', '>=', Carbon::now())
        ->get();
        
        foreach ($billSubscriptions as $sub) {
            $subscriptions[] = [
                'id' => $sub->id,
                'uuid' => $sub->uuid,
                'type' => 'bill',
                'stripe_id' => $sub->stripe_id,
                'item_name' => $sub->bill->name ?? 'Bill Payment',
                'creator' => [
                    'name' => $sub->bill->user->name ?? '',
                    'username' => $sub->bill->user->username ?? '',
                    'avatar_url' => $sub->bill->user->avatar_url ?? null,
                ],
                'amount' => $sub->amount,
                'currency' => $sub->currency,
                'recurring_type' => $sub->recurring_type,
                'recurring_for' => $sub->recurring_for,
                'next_payment' => $sub->upcoming_payment,
                'created_at' => $sub->created_at,
                'can_cancel' => $sub->recurring_for !== 'onetime' && $sub->status === 'paid',
            ];
        }
        
        // Sort by created_at desc
        usort($subscriptions, function ($a, $b) {
            return $b['created_at']->timestamp - $a['created_at']->timestamp;
        });
        
        return $subscriptions;
    }
    
    /**
     * Cancel a subscription
     */
    public function cancelSubscription(Request $request, $type, $uuid)
    {
        $user = $request->user();
        
        try {
            switch ($type) {
                case 'wish_subscription':
                    $subscription = WishItemSubscription::where('uuid', $uuid)
                        ->where(function ($q) use ($user) {
                            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                        })
                        ->where('status', 'paid')
                        ->first();
                    break;
                    
                case 'membership':
                    $subscription = MembershipPayment::where('uuid', $uuid)
                        ->where(function ($q) use ($user) {
                            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                        })
                        ->where('status', 'paid')
                        ->first();
                    break;
                    
                case 'bill':
                    $subscription = BillPayment::where('uuid', $uuid)
                        ->where(function ($q) use ($user) {
                            $q->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                        })
                        ->where('status', 'paid')
                        ->first();
                    break;
                    
                default:
                    return response()->json(['error' => 'Invalid subscription type'], 400);
            }
            
            if (!$subscription) {
                return response()->json(['error' => 'Subscription not found'], 404);
            }
            
            if (!$subscription->stripe_id) {
                return response()->json(['error' => 'No Stripe subscription ID found'], 400);
            }
            
            // Cancel the subscription in Stripe
            StripeControl::cancelSubscription($subscription->stripe_id);
            
            // Update local status
            $subscription->status = 'cancelled';
            $subscription->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Subscription cancelled successfully.'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to cancel subscription', [
                'type' => $type,
                'uuid' => $uuid,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to cancel subscription. Please try again.'
            ], 500);
        }
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
            \Log::error('Failed to cancel subscription by ID', [
                'subscription_id' => $id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
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
            if (!$subscription) {
                if ($request->expectsJson()) {
                    return response()->json(['error' => 'Subscription not found'], 404);
                }
                return back()->with('error', 'Subscription not found.');
            }
        }
        
        if (!$subscription->stripe_id) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'No Stripe subscription ID found'], 400);
            }
            return back()->with('error', 'No Stripe subscription ID found.');
        }
        
        if (!$subscription->canBeCanceled()) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'This subscription cannot be canceled'], 400);
            }
            return back()->with('error', 'This subscription cannot be canceled.');
        }
        
        try {
            // Cancel the subscription in Stripe using cancel_at_period_end
            if (!str_starts_with($subscription->stripe_id, 'sub_test_')) {
                \Stripe\Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
                \Stripe\Subscription::update($subscription->stripe_id, [
                    'cancel_at_period_end' => true
                ]);
            }
            
            // Update local status
            $subscription->update([
                'cancel_at_period_end' => true,
                'canceled_at' => now()
            ]);
            
            // Log the cancellation event
            $subscription->logEvent('canceled', [
                'notes' => 'Subscription canceled by user'
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Subscription will be canceled at the end of the current billing period.'
                ]);
            }
            
            return back()->with('success', 'Subscription will be canceled at the end of the current billing period.');
            
        } catch (\Exception $e) {
            \Log::error('Failed to cancel Stripe subscription', [
                'subscription_id' => $subscription->id,
                'stripe_id' => $subscription->stripe_id,
                'error' => $e->getMessage()
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to cancel subscription. Please try again or contact support.'
                ], 500);
            }
            
            return back()->with('error', 'Failed to cancel subscription. Please try again or contact support.');
        }
    }
    
    private function cancelMembershipSubscription(Request $request, $subscription)
    {
        // Similar logic for membership subscriptions
        if (!$subscription->stripe_id) {
            return back()->with('error', 'No Stripe subscription ID found.');
        }
        
        try {
            StripeControl::cancelSubscription($subscription->stripe_id);
            $subscription->status = 'cancelled';
            $subscription->save();
            
            return back()->with('success', 'Membership subscription cancelled successfully.');
            
        } catch (\Exception $e) {
            \Log::error('Failed to cancel membership subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Failed to cancel subscription. Please try again.');
        }
    }
    
    private function cancelBillSubscription(Request $request, $subscription)
    {
        // Similar logic for bill subscriptions
        if (!$subscription->stripe_id) {
            return back()->with('error', 'No Stripe subscription ID found.');
        }
        
        try {
            StripeControl::cancelSubscription($subscription->stripe_id);
            $subscription->status = 'cancelled';
            $subscription->save();
            
            return back()->with('success', 'Bill subscription cancelled successfully.');
            
        } catch (\Exception $e) {
            \Log::error('Failed to cancel bill subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Failed to cancel subscription. Please try again.');
        }
    }
}
