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
        // For local development, allow access without authentication (temporary)
        if (config('app.env') === 'local') {
            return $next($request);
        }
        
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            return redirect()->route('login')->with('error', 'Please login to access logs.');
        }
        
        // Allow access if user has admin role (assuming role 0 is admin based on search results)
        if ($user->role === 0) {
            return $next($request);
        }
        
        // Check for debug token in environment and request
        $envDebugToken = config('app.debug_token');
        $requestToken = $request->query('debug_token') ?? $request->header('X-Debug-Token');
        
        if (!empty($envDebugToken) && !empty($requestToken) && hash_equals($envDebugToken, $requestToken)) {
            return $next($request);
        }
        
        // For production debugging, allow any authenticated user if APP_ENV is not production
        if (config('app.env') !== 'production') {
            return $next($request);
        }
        
        // Deny access
        abort(403, 'Unauthorized to view logs. Admin access or valid debug token required.');
    }
}