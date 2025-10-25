<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\MembershipAccessService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RequireActiveMembership
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  int  $creatorId  The creator whose content requires membership
     * @param  string|null  $membershipLevel  Optional specific membership level required
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, $creatorId, $membershipLevel = null)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            Log::info('RequireActiveMembership: User not authenticated', [
                'url' => $request->url(),
                'creator_id' => $creatorId
            ]);

            return response()->json([
                'error' => 'Authentication required',
                'message' => 'You must be logged in to access this content.',
                'requires_membership' => true
            ], 401);
        }

        $user = Auth::user();
        $membershipService = app(MembershipAccessService::class);

        // Check if user has active membership access
        $accessCheck = $membershipService->hasActiveMembership(
            $user->id, 
            $creatorId, 
            $membershipLevel
        );

        if (!$accessCheck['has_access']) {
            Log::info('RequireActiveMembership: Access denied', [
                'user_id' => $user->id,
                'creator_id' => $creatorId,
                'membership_level' => $membershipLevel,
                'reason' => $accessCheck['reason']
            ]);

            // For API routes, return JSON response
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Membership required',
                    'message' => 'This content requires an active membership.',
                    'reason' => $accessCheck['reason'],
                    'requires_membership' => true,
                    'creator_id' => $creatorId,
                    'required_level' => $membershipLevel
                ], 403);
            }

            // For web routes, redirect to membership page or show error
            return redirect()
                ->route('membership.show', ['creatorId' => $creatorId])
                ->with('error', 'You need an active membership to access this content.');
        }

        Log::info('RequireActiveMembership: Access granted', [
            'user_id' => $user->id,
            'creator_id' => $creatorId,
            'membership_level' => $accessCheck['membership_level'] ?? 'unknown',
            'access_method' => $accessCheck['access_method'] ?? 'unknown'
        ]);

        // Add membership info to request for use in controllers
        $request->merge([
            'membership_access' => $accessCheck,
            'active_membership' => $accessCheck['membership'] ?? null
        ]);

        return $next($request);
    }
}