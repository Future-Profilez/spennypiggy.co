<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CanViewLogs
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // For local development, allow access without authentication
        if (config('app.env') === 'local') {
            return $next($request);
        }
        
        // In production, require LOG_DEBUG_TOKEN
        if (config('app.env') === 'production') {
            $envDebugToken = config('logging.debug_token');
            $requestToken = $request->query('token') ?? $request->header('X-Log-Debug-Token');
            
            // Check if LOG_DEBUG_TOKEN is configured
            if (empty($envDebugToken)) {
                return $this->denyAccess($request, 'Log debug token not configured.');
            }
            
            // Check if token is provided and matches
            if (empty($requestToken) || !hash_equals($envDebugToken, $requestToken)) {
                return $this->denyAccess($request, 'Invalid or missing log debug token.');
            }
            
            return $next($request);
        }
        
        // For staging/development environments, check user authentication and role
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            return $this->denyAccess($request, 'Authentication required.');
        }
        
        // Allow access if user has admin role (role 0)
        if ($user->role === 0) {
            return $next($request);
        }
        
        // Check for debug token as fallback
        $envDebugToken = config('logging.debug_token');
        $requestToken = $request->query('token') ?? $request->header('X-Log-Debug-Token');
        
        if (!empty($envDebugToken) && !empty($requestToken) && hash_equals($envDebugToken, $requestToken)) {
            return $next($request);
        }
        
        // Deny access
        return $this->denyAccess($request, 'Admin access or valid debug token required.');
    }
    
    /**
     * Handle access denial based on request type
     */
    private function denyAccess(Request $request, string $message): Response
    {
        // For API requests, return JSON error
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => $message,
                'status' => 403
            ], 403);
        }
        
        // For web requests, redirect to login or show 403
        if (auth()->guest()) {
            return redirect()->route('login')->with('error', $message);
        }
        
        abort(403, $message);
    }
}