<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * The £500 spend gate, enforced.
 *
 * 🚨 This used to hard-code `role === 0`, so a CREATOR past the threshold was
 * never stopped by it — and it was attached to five checkout routes out of nine,
 * so Shop, Paid Tasks, Piggy Pot and the Piggy Bank were guarded only by an
 * inline call that answered "did the flag flip on THIS request". It stopped
 * somebody once and then never again.
 *
 * `User::requiresCardVerification()` is the one definition of who is blocked;
 * this only decides how to say so.
 */
class CheckGifterCardVerification
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (! $user instanceof User || ! $user->requiresCardVerification()) {
            return $next($request);
        }

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'status' => false,
                'card_verification_required' => true,
                'message' => 'Please complete your card verification process.',
            ]);
        }

        return Inertia::location(route('gifter.card.verification'));
    }
}
