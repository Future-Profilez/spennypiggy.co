<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deliverable;
use App\Support\ContentDownloadMonitor;
use App\Support\SecureMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DeliverableController extends Controller
{
    /**
     * Get user's deliverables including certificates
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required',
                ], 401);
            }

            // ⚠️ Deliberately NOT wired to ContentDownloadMonitor (Security
            // Checklist §3). This is the buyer's own library listing: one call
            // returns every purchase at once, so recording a download per row
            // would push anyone with 20 purchases over the burst threshold for
            // opening their own page — and none of those files was fetched.
            // `show()` below is the per-item read, and that is where it counts.
            $deliverables = Deliverable::where('gifter_id', $user->id)
                ->where('status', 'delivered')
                ->with(['creator', 'wishItem'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($deliverable) {
                    $metadata = $deliverable->metadata ?? [];

                    return [
                        'id' => $deliverable->id,
                        'uuid' => $deliverable->uuid,
                        'type' => $deliverable->deliverable_type,
                        'product_type' => $deliverable->product_type,
                        'status' => $deliverable->status,
                        'delivered_at' => $deliverable->delivered_at,
                        // Signed at read time, never at write time — see
                        // DeliveriesController for why the stored column stays bare.
                        'content_url' => SecureMedia::sign($deliverable->deliverable_url),
                        'certificate_url' => $deliverable->certificate_url,
                        'has_certificate' => ! empty($deliverable->certificate_url),
                        'transaction_amount' => $deliverable->transaction_amount,
                        'payment_currency' => $deliverable->payment_currency,
                        'anonymous' => $deliverable->anonymous ?? false,
                        'creator' => [
                            'id' => $deliverable->creator->id ?? null,
                            'name' => $deliverable->creator->name ?? 'Creator',
                            'username' => $deliverable->creator->username ?? null,
                        ],
                        'wish_item' => $deliverable->wishItem ? [
                            'id' => $deliverable->wishItem->id,
                            'name' => $deliverable->wishItem->wishname,
                            'price' => $deliverable->wishItem->price,
                            'currency' => $deliverable->wishItem->currency,
                        ] : null,
                        'metadata' => [
                            'wish_name' => $metadata['wish_name'] ?? null,
                            'content_type' => $metadata['content_file_type'] ?? $metadata['media_type'] ?? null,
                            'certificate_generated' => $metadata['certificate_generated'] ?? false,
                        ],
                    ];
                });

            return response()->json([
                'status' => true,
                'data' => [
                    'deliverables' => $deliverables,
                    'total_count' => $deliverables->count(),
                    'certificates_count' => $deliverables->where('has_certificate', true)->count(),
                    'content_count' => $deliverables->whereNotNull('content_url')->count(),
                ],
                'message' => 'Deliverables retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch deliverables', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch deliverables',
            ], 500);
        }
    }

    /**
     * Get specific deliverable details including certificate
     */
    public function show(Request $request, $uuid)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required',
                ], 401);
            }

            $deliverable = Deliverable::where('uuid', $uuid)
                ->where('gifter_id', $user->id)
                ->with(['creator', 'wishItem'])
                ->first();

            if (! $deliverable) {
                return response()->json([
                    'status' => false,
                    'message' => 'Deliverable not found',
                ], 404);
            }

            $metadata = $deliverable->metadata ?? [];

            // 🚨 Security Checklist §3 — "bulk content downloads". This
            // endpoint hands the buyer `content_url`, the paid file itself, one
            // deliverable per call — so a script walking uuids through it is
            // exactly the shape the monitor exists to see, and it left no trace
            // before this line. Recorded only when there IS content: a
            // certificate-only row delivered nothing to download.
            //
            // Observation only — nothing below changes, and the row carries the
            // deliverable uuid, never the URL.
            if (! empty($deliverable->deliverable_url)) {
                ContentDownloadMonitor::record(
                    $user->id,
                    $deliverable->product_type ?: 'deliverable',
                    $deliverable->uuid,
                    'paid deliverable content url'
                );
            }

            return response()->json([
                'status' => true,
                'data' => [
                    'id' => $deliverable->id,
                    'uuid' => $deliverable->uuid,
                    'type' => $deliverable->deliverable_type,
                    'product_type' => $deliverable->product_type,
                    'status' => $deliverable->status,
                    'delivered_at' => $deliverable->delivered_at,
                    // Signed at read time, never at write time — see
                    // DeliveriesController for why the stored column stays bare.
                    'content_url' => SecureMedia::sign($deliverable->deliverable_url),
                    'certificate_url' => $deliverable->certificate_url,
                    'has_certificate' => ! empty($deliverable->certificate_url),
                    'has_content' => ! empty($deliverable->deliverable_url),
                    'transaction_amount' => $deliverable->transaction_amount,
                    'payment_currency' => $deliverable->payment_currency,
                    'anonymous' => $deliverable->anonymous ?? false,
                    'message' => $deliverable->message,
                    'creator' => [
                        'id' => $deliverable->creator->id ?? null,
                        'name' => $deliverable->creator->name ?? 'Creator',
                        'username' => $deliverable->creator->username ?? null,
                        'avatar_url' => isset($deliverable->creator->avatar) ?
                            'https://ucarecdn.com/'.$deliverable->creator->avatar.'/' : null,
                    ],
                    'wish_item' => $deliverable->wishItem ? [
                        'id' => $deliverable->wishItem->id,
                        'name' => $deliverable->wishItem->wishname,
                        'description' => $deliverable->wishItem->description,
                        'price' => $deliverable->wishItem->price,
                        'currency' => $deliverable->wishItem->currency,
                        'image_url' => $deliverable->wishItem->image_url,
                    ] : null,
                    'certificate_info' => ! empty($deliverable->certificate_url) ? [
                        'url' => $deliverable->certificate_url,
                        'generated_at' => $deliverable->delivered_at,
                        'certificate_id' => $deliverable->uuid,
                        'is_downloadable' => true,
                    ] : null,
                    'metadata' => $metadata,
                ],
                'message' => 'Deliverable details retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch deliverable details', [
                'uuid' => $uuid,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch deliverable details',
            ], 500);
        }
    }

    /**
     * Download certificate (redirect to Uploadcare URL)
     */
    public function downloadCertificate(Request $request, $uuid)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required',
                ], 401);
            }

            $deliverable = Deliverable::where('uuid', $uuid)
                ->where('gifter_id', $user->id)
                ->first();

            if (! $deliverable) {
                return response()->json([
                    'status' => false,
                    'message' => 'Deliverable not found',
                ], 404);
            }

            if (empty($deliverable->certificate_url)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Certificate not available for this deliverable',
                ], 404);
            }

            // Log certificate download
            Log::info('Certificate downloaded', [
                'user_id' => $user->id,
                'deliverable_uuid' => $uuid,
                'certificate_url' => $deliverable->certificate_url,
            ]);

            // Redirect to certificate URL for download
            return redirect($deliverable->certificate_url);

        } catch (\Exception $e) {
            Log::error('Failed to download certificate', [
                'uuid' => $uuid,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to access certificate',
            ], 500);
        }
    }
}
