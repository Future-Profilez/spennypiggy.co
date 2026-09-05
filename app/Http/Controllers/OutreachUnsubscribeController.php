<?php

namespace App\Http\Controllers;

use App\Models\CrmCreator;
use App\Support\MarketingConsent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * One-click unsubscribe for a COLD-OUTREACH lead (a `crm_creators` row, not a
 * user). Minted by the admin app (`WebsiteSignedUrl::outreachUnsubscribe`) with
 * the shared APP_KEY; validated here with `hasValidSignature()`.
 *
 * GET  — the footer link. Unsubscribes immediately and shows a confirmation.
 *        A link scanner following it produces a false unsubscribe, which is the
 *        safe direction to be wrong in for unsolicited mail.
 * POST — RFC 8058 one-click (`List-Unsubscribe-Post`), sent by the mail client
 *        with no session and no CSRF token; answers 200 with no page.
 *
 * Writes BOTH gates: the lead's own do-not-contact, and the email-keyed
 * `marketing_suppressions` row — so if this person later signs up with the
 * same inbox, the platform still does not market to them.
 */
class OutreachUnsubscribeController extends Controller
{
    public function show(Request $request, int $lead)
    {
        if (! $request->hasValidSignature()) {
            Log::warning('Outreach unsubscribe: invalid or expired signature', ['lead' => $lead]);

            return response()
                ->view('outreach.unsubscribed', ['state' => 'invalid'], 410)
                ->header('X-Robots-Tag', 'noindex, nofollow');
        }

        $state = $this->apply($lead, 'outreach_link') ? 'done' : 'missing';

        return response()
            ->view('outreach.unsubscribed', ['state' => $state])
            ->header('X-Robots-Tag', 'noindex, nofollow');
    }

    public function oneClick(Request $request, int $lead)
    {
        if (! $request->hasValidSignature()) {
            return response()->json(['ok' => false], 410);
        }

        $this->apply($lead, 'outreach_one_click');

        return response()->json(['ok' => true]);
    }

    private function apply(int $leadId, string $source): bool
    {
        $lead = CrmCreator::withTrashed()->find($leadId);

        if (! $lead) {
            return false;
        }

        try {
            // forceFill on purpose: these columns are not $fillable on this app's
            // mirror model — the admin app owns them, this is the one write here.
            $lead->forceFill([
                'do_not_contact_at' => $lead->do_not_contact_at ?? now(),
                'outreach_blocked_reason' => 'unsubscribed',
            ])->save();
        } catch (\Throwable $e) {
            Log::error('Outreach unsubscribe: lead row could not be updated', ['lead' => $leadId, 'error' => $e->getMessage()]);
        }

        // Never throws (see MarketingConsent) — the opt-out must not fail on bookkeeping.
        MarketingConsent::suppress($lead->email, $source);

        return true;
    }
}
