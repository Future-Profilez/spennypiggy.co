<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureLeaderboardAccess
{
    /**
     * Handle an incoming request.
     *
     * This middleware controls access to leaderboard endpoints:
     * - Allows public access to general leaderboard endpoints for all users
     * - Requires authentication (and optionally role=admin/creator) for sensitive endpoints with financial data
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $accessType = 'public'): Response
    {
        // Define sensitive endpoints that contain financial data
        $sensitiveEndpoints = [
            'earnings*',
            'earnings/*',
            'top-wishes*',
            'top-subscription*',
            'top-bill*',
            'top-shop*',
            'top-piggy-bank*',
            'graph-data*',
        ];

        // Check if the current route is a sensitive endpoint
        $currentRoute = $request->route()->getName() ?? '';
        $currentPath = $request->path();
        
        $isSensitiveEndpoint = false;
        foreach ($sensitiveEndpoints as $pattern) {
            if (str_contains($currentRoute, str_replace('*', '', $pattern)) || 
                str_contains($currentPath, str_replace('*', '', $pattern))) {
                $isSensitiveEndpoint = true;
                break;
            }
        }

        // Handle different access types
        switch ($accessType) {
            case 'public':
                // Allow public access to general leaderboard endpoints
                if (!$isSensitiveEndpoint) {
                    return $next($request);
                }
                
                // For sensitive endpoints, require authentication
                if (!Auth::check()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Authentication required to access financial data.'
                    ], 401);
                }
                break;

            case 'auth':
                // Require authentication for all endpoints
                if (!Auth::check()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Authentication required.'
                    ], 401);
                }
                break;

            case 'admin':
                // Require authentication and admin role
                if (!Auth::check()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Authentication required.'
                    ], 401);
                }

                $user = Auth::user();
                if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Admin access required.'
                    ], 403);
                }
                break;

            case 'creator':
                // Require authentication and creator/admin role
                if (!Auth::check()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Authentication required.'
                    ], 401);
                }

                $user = Auth::user();
                if (!$user || !in_array($user->role, ['creator', 'admin', 'super_admin'])) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Creator or admin access required.'
                    ], 403);
                }
                break;

            case 'owner':
                // Require authentication and check if user owns the data
                if (!Auth::check()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Authentication required.'
                    ], 401);
                }

                // For earnings endpoints, ensure user can only access their own data
                if ($isSensitiveEndpoint && str_contains($currentPath, 'earnings')) {
                    // This will be enforced at the controller level
                    // The middleware just ensures they're authenticated
                }
                break;

            default:
                // Default to public access
                break;
        }

        return $next($request);
    }
}
