<?php

namespace App\Http\Controllers;

use App\Models\Deliverable;
use Illuminate\Http\Request;
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

        $symbol = $symbols[strtolower($currency)] ?? strtoupper($currency) . ' ';
        
        return $symbol . number_format($amount, 2);
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