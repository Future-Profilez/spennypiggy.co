<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * There is no Spenny Piggy identity check, anywhere.
 *
 * 🚨 THIS REPLACES `PayoutIdentityGateTest`, WHICH ASSERTED THE OPPOSITE. On 10 Sep 2026
 * identity became a PAYOUT gate and that file pinned it across all six payout paths. The
 * client's written instruction the next day reversed it — D5 and Q20, both CONFIRMED:
 *
 *   *"Remove the SP-specific ID-document and human identity-sign-off process entirely.
 *   **Do not move it to payout.**"*
 *   *"There is no SP ID upload, no manual face/ID comparison, and **no SP payout-stage
 *   identity gate.** This is a cost, friction and administration reduction decision."*
 *
 * The guard is inverted rather than dropped: what is worth pinning now is that the gate does
 * not come back by somebody copying an older payout job.
 *
 * 🚨 WHAT THIS MEANS FOR MONEY, PLAINLY: a creator Spenny Piggy has never identified can be
 * paid. **Stripe Connect's own KYC is the only control on that**, which is the client's
 * decision — they own payment compliance and we do not duplicate it.
 *
 * ⚠️ A SOURCE SCAN, deliberately. The fault it guards is a NEW payout path written by copying
 * an old one, and no behavioural test of today's seven paths can see an eighth.
 */
class NoSpennyPiggyIdentityCheckTest extends TestCase
{
    /** Every path that issues money. */
    private const PAYOUT_PATHS = [
        'app/Services/Risk/PayoutService.php',
        'app/Console/Commands/ReleaseReserves.php',
        'app/Jobs/ProcessFounderPayouts.php',
        'app/Jobs/ProcessFounderMonthlyBonuses.php',
        'app/Console/Commands/ProcessFastStartBonusPayouts.php',
        'app/Services/GrowthBonusService.php',
        'app/Http/Controllers/ReferAndEarnController.php',
    ];

    private function source(string $path): string
    {
        $source = file_get_contents(base_path($path));

        // Comments blanked: every one of these files explains the removal by NAMING the
        // class that used to gate it, so a raw scan finds the very string it checks for.
        return preg_replace_callback(
            '#/\*.*?\*/|//[^\n]*#s',
            fn ($m) => str_repeat("\n", substr_count($m[0], "\n")),
            $source
        );
    }

    public function test_no_payout_path_gates_on_a_spenny_piggy_identity_check(): void
    {
        foreach (self::PAYOUT_PATHS as $path) {
            $source = $this->source($path);

            foreach (['PayoutEligibility', 'identity_admin_status', 'identity_verified_at'] as $symbol) {
                $this->assertStringNotContainsString(
                    $symbol,
                    $source,
                    $path.' gates a payout on a Spenny Piggy identity check. The client '
                    .'removed that entirely on 11 Sep 2026 (D5/Q20) and specifically said '
                    .'not to move it to payout. Stripe Connect owns KYC.'
                );
            }
        }
    }

    public function test_the_identity_gate_classes_are_gone(): void
    {
        foreach ([
            'app/Support/PayoutEligibility.php',
            'app/Support/PayoutIdentityGatePayload.php',
            'app/Support/IdentityCheckState.php',
            'app/Support/IdentityRejection.php',
            'app/Support/IdentityFailureReason.php',
            'resources/js/Components/PayoutIdentityGate.jsx',
            'resources/js/Pages/Auth/StripeIdentity.jsx',
        ] as $path) {
            $this->assertFileDoesNotExist(
                base_path($path),
                $path.' is back. Spenny Piggy runs no identity check of its own — if a '
                .'creator cannot be paid, that is Stripe telling us so.'
            );
        }
    }

    public function test_spenny_piggy_mints_no_stripe_identity_session(): void
    {
        // 🚨 The session was BILLABLE and on our own platform account. Re-adding the route
        // is the cheapest way for this to come back without anybody deciding it should.
        $routes = $this->source('routes/auth.php');

        $this->assertStringNotContainsString('stripe/identity/verify', $routes);
        $this->assertStringNotContainsString('createVerificationSession', $routes);

        $this->assertStringNotContainsString(
            'createVerificationSession',
            $this->source('app/Http/Controllers/Auth/StripeController.php'),
            'Something mints a Stripe Identity session again.'
        );
    }

    /**
     * 🚨 THE MAILABLES WENT AND THE TEMPLATES STAYED — found in the §18 surface
     * audit, 12 Sep 2026. Four blades (`identity_failed`, `identity-check-reengage`,
     * `identity-verification-process`, `identity_success`) and two mailables
     * survived the identity removal with **nothing dispatching any of them**.
     *
     * ⚠️ They were not inert. `routes/debug-emails.php` builds its preview list by
     * GLOBBING `views/email/*.blade.php`, so anybody opening the template previewer
     * was shown a live-looking "Your ID check didn't go through" email for a check
     * this platform no longer runs — and that page can SEND. A dead template that
     * one route can still render is a message waiting to be sent by mistake.
     *
     * ⚠️ Checked as PATHS, not by grepping for the word "identity": Stripe's own
     * identity data still legitimately appears elsewhere (`identity:prune` keeps
     * the retention job), so a word sweep would fail on code that has to stay.
     */
    public function test_no_template_or_mailable_describes_a_spenny_piggy_id_check(): void
    {
        $gone = [
            'resources/views/email/identity_failed.blade.php',
            'resources/views/email/identity-check-reengage.blade.php',
            'resources/views/email/identity-verification-process.blade.php',
            'resources/views/email/identity_success.blade.php',
            'app/Mail/IdentityVerificationProcess.php',
            'app/Mail/IdentityVerificationSuccess.php',
        ];

        foreach ($gone as $path) {
            $this->assertFileDoesNotExist(
                base_path($path),
                $path.' is back. Spenny Piggy runs no ID check, and `routes/debug-emails.php` '
                .'globs the email folder — so this template is previewable and sendable.'
            );
        }
    }

    public function test_the_scan_actually_reads_the_payout_paths(): void
    {
        // Without this, a renamed file turns every assertion above into a silent pass.
        foreach (self::PAYOUT_PATHS as $path) {
            $this->assertNotSame('', trim($this->source($path)), $path.' read as empty.');
        }
    }
}
