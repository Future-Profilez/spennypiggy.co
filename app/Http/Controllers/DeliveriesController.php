<?php

namespace App\Http\Controllers;

use App\Models\Deliverable;
use App\Support\ContentDownloadMonitor;
use App\Support\SecureMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DeliveriesController extends Controller
{
    /**
     * Display the deliveries dashboard
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        // Get deliverables for the authenticated user (as creator or gifter)
        $deliverables = Deliverable::query()->where(function ($query) use ($user) {
            $query->where('creator_id', $user->id)->orWhere('gifter_id', $user->id);
        })->with(['creator', 'gifter', 'task'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Transform the data for the frontend
        $deliverables->getCollection()->transform(function ($deliverable) use ($user) {
            $metadata = $deliverable->metadata ?? [];
            $isCreator = $deliverable->creator_id === $user->id;

            // Determine amount to display
            $amount = $metadata['amount'] ?? 0;
            if ($isCreator && $deliverable->product_type === 'task' && $deliverable->task) {
                // Show task price without fees for creator
                $amount = $deliverable->task->price * 100; // Convert to cents for consistency
            }

            return [
                'id' => $deliverable->id,
                'uuid' => $deliverable->uuid,
                'payment_id' => $deliverable->session_id ?? $deliverable->payment_intent_id,
                'amount' => $amount,
                'currency' => strtoupper($metadata['currency'] ?? 'GBP'),
                'formatted_amount' => $this->formatAmount($amount, $metadata['currency'] ?? 'gbp'),
                'deliverable_type' => $deliverable->deliverable_type_display,
                'status' => ucfirst($deliverable->status),
                'status_class' => $this->getStatusClass($deliverable->status),
                'created_at' => $deliverable->created_at->format('M d, Y H:i'),
                'delivered_at' => $deliverable->delivered_at?->format('M d, Y H:i'),
                'accessed_at' => $deliverable->accessed_at?->format('M d, Y H:i'),
                'access_count' => $deliverable->access_count,
                'deliverable_url' => $deliverable->deliverable_url,
                'certificate_url' => $deliverable->certificate_url, // Added certificate URL
                'is_creator' => $deliverable->creator_id === $user->id,
                'creator_name' => $deliverable->creator?->name,
                'gifter_name' => $deliverable->gifter?->name,
                'customer_email' => $metadata['customer_email'] ?? null,
            ];
        });

        return Inertia::render('Deliveries/Dashboard', [
            'deliverables' => $deliverables,
            'stats' => $this->getDeliveryStats($user),
        ]);
    }

    /**
     * Handle deliverable access tracking and redirection
     */
    public function access(string $uuid)
    {
        $deliverable = Deliverable::where('uuid', $uuid)->firstOrFail();

        // Update tracking metrics
        $deliverable->update([
            'accessed_at' => now(),
            'access_count' => $deliverable->access_count + 1,
            'status' => 'delivered', // Ensure it's marked as delivered if it was pending
        ]);

        Log::info('Deliverable accessed', [
            'uuid' => $uuid,
            'type' => $deliverable->deliverable_type,
            'ip' => request()->ip(),
            'access_count' => $deliverable->access_count,
        ]);

        // Redirect to the actual content URL
        if (empty($deliverable->deliverable_url)) {
            // Fallback if URL is missing
            return redirect()->route('home')->with('error', 'Content URL not found.');
        }

        // 🚨 Security Checklist §3 — "bulk content downloads". This is the
        // generic handover: a shop, wish, pot or bill deliverable leaves the
        // platform through THIS redirect, not through the task-only endpoint
        // the monitor was first wired into. Recorded only once there is
        // actually a file to hand over — a missing URL delivered nothing and
        // must not count towards a download burst.
        //
        // Observation only: nothing here is gated on it, and the row names the
        // deliverable's own uuid, never `deliverable_url` (see
        // ContentDownloadMonitor).
        ContentDownloadMonitor::record(
            Auth::id(),
            $deliverable->product_type ?: 'deliverable',
            $deliverable->uuid,
            'paid deliverable access link'
        );

        // 🚨 THIS is where a paid CDN link should be minted, and it is why the
        // stored `deliverable_url` is deliberately left UNSIGNED in the
        // database: a token written at purchase time expires and then serves a
        // permanently broken link, and a leaked row would carry a live grant.
        // Signed here, per click, the handover lasts one page load — and the
        // receipt e-mails already point at this route rather than at the CDN
        // (`route('deliverable.access', $deliverable->uuid)`), so the whole
        // e-mail path inherits it.
        return redirect(SecureMedia::sign($deliverable->deliverable_url));
    }

    /**
     * Get delivery statistics for the user
     */
    private function getDeliveryStats($user): array
    {
        $baseQuery = Deliverable::where(function ($query) use ($user) {
            $query->where('creator_id', $user->id)
                ->orWhere('gifter_id', $user->id);
        });

        return [
            'total' => $baseQuery->count(),
            'delivered' => $baseQuery->where('status', 'delivered')->count(),
            'pending' => $baseQuery->where('status', 'pending')->count(),
            'failed' => $baseQuery->where('status', 'failed')->count(),
        ];
    }

    /**
     * Format amount for display
     */
    private function formatAmount($amount, $currency): string
    {
        $amount = $amount / 100; // Convert from cents

        $symbols = [
            'gbp' => '£',
            'usd' => '$',
            'eur' => '€',
            'jpy' => '¥',
        ];

        $symbol = $symbols[strtolower($currency)] ?? strtoupper($currency).' ';

        return $symbol.number_format($amount, 2);
    }

    /**
     * Get CSS class for status
     */
    private function getStatusClass($status): string
    {
        return match ($status) {
            'delivered' => 'text-green-600 bg-green-100',
            'pending' => 'text-yellow-600 bg-yellow-100',
            'failed' => 'text-red-600 bg-red-100',
            default => 'text-gray-600 bg-gray-100',
        };
    }
}
