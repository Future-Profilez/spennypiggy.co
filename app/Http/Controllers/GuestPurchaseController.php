<?php

namespace App\Http\Controllers;

use App\Mail\GuestPurchaseLink;
use App\Services\GuestPurchaseLookup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

/**
 * "Where did my purchase go?" for a supporter with no account.
 *
 * Guest checkout is allowed on Piggy Pot, Wishes and the Piggy Bank, so a real supporter
 * can pay and hold nothing but a receipt email. Lose it and there was no route back to
 * the content at all — they cannot sign in, because there is nothing to sign in to.
 */
class GuestPurchaseController extends Controller
{
    /**
     * How long the emailed link lives.
     *
     * Shorter than the 30 days the checkout-reminder opt-out uses, because this link
     * grants access to PAID CONTENT rather than flipping a preference — and long enough
     * that a supporter who reads their mail at the weekend still finds it working.
     */
    public const LINK_DAYS = 7;

    /** The form. Public — the people who need it have no account by definition. */
    public function form()
    {
        return Inertia::render('gifter/FindPurchase');
    }

    /**
     * Send the link.
     *
     * 🚨 THE ANSWER IS ALWAYS THE SAME, whether or not that address bought anything.
     * Telling a stranger "no purchases found for this email" turns this form into a way
     * to ask *"is this person on Spenny Piggy?"* of any address they like — about a
     * platform where that answer is nobody's business. The response says only that a
     * link has been sent IF there is anything to send.
     */
    public function send(Request $request, GuestPurchaseLookup $lookup)
    {
        // Same guest-facing write protection as the waitlist join and the anonymous
        // checkouts: without it this is an unauthenticated endpoint that sends mail.
        $this->ensureTurnstileVerified($request);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        try {
            if ($lookup->hasPurchases($email)) {
                Mail::to($email)->queue(new GuestPurchaseLink(
                    URL::temporarySignedRoute(
                        'guest-purchases.show',
                        now()->addDays(self::LINK_DAYS),
                        ['email' => $email]
                    ),
                    self::LINK_DAYS
                ));
            }
        } catch (\Throwable $e) {
            // A mail failure must not become a different answer — that difference is
            // exactly the signal the identical response exists to remove.
            Log::error('Guest purchase link failed to send', ['error' => $e->getMessage()]);
        }

        return back()->with('success', 'If that email has purchases, we have sent a link to it. Check your inbox, and your spam folder.');
    }

    /**
     * The results, behind the signed link.
     *
     * ⚠️ The address travels IN THE URL, which the POST endpoint would never accept —
     * that is correct here only because the URL is signed: the signature proves the
     * platform minted this link and sent it to that address. It is also why the page is
     * `noindex` and sends no referrer: the URL itself is the credential.
     */
    public function show(Request $request, GuestPurchaseLookup $lookup)
    {
        if (! $request->hasValidSignature()) {
            return redirect()->route('guest-purchases.form')
                ->with('error', 'That link has expired. Enter your email again and we will send a new one.');
        }

        $email = strtolower(trim((string) $request->query('email')));

        return Inertia::render('gifter/PurchaseResults', [
            'email' => $email,
            'purchases' => $lookup->for($email),
        ])->toResponse($request)->withHeaders([
            'X-Robots-Tag' => 'noindex, nofollow, noarchive',
            'Referrer-Policy' => 'no-referrer',
        ]);
    }
}
