<?php

namespace App\Http\Controllers;

use App\Models\SignupLead;
use App\Services\SignupLeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "Tell me when sign-ups reopen."
 *
 * The only public way onto `signup_leads`. It exists because the registration
 * form's own refusal cannot carry an email field for someone whose POST was
 * rejected before validation ran.
 */
class SignupWaitlistController extends Controller
{
    public function __construct(protected SignupLeadService $leads) {}

    public function join(Request $request): JsonResponse
    {
        // Self-gating: a no-op when no secret is configured or on localhost, so
        // this cannot hard-block on an environment without Cloudflare keys.
        $this->ensureTurnstileVerified($request);

        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:190'],
            'role' => ['nullable', 'in:0,1'],
        ]);

        $this->leads->capture(
            $request,
            $data['email'],
            (int) ($data['role'] ?? 1),
            SignupLead::REASON_PLATFORM_FREEZE,
        );

        // 🚨 ONE RESPONSE, ALWAYS. `capture()` returns null for an address that
        // already has an account, so branching on it would turn this endpoint
        // into "does this person have a Spenny Piggy account?" for any address a
        // stranger cares to type — the same rule the guest purchase lookup
        // follows. What differs is what we STORE, never what we SAY.
        return response()->json([
            'ok' => true,
            'message' => "You're on the list — we'll email you the moment sign-ups reopen.",
        ]);
    }
}
