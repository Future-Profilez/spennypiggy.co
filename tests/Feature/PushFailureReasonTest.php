<?php

namespace Tests\Feature;

use App\Helpers;
use Tests\TestCase;

/**
 * 🚨 EVERY PUSH ON THE PLATFORM FAILED FOR OVER 24 HOURS AND THE LEDGER DID NOT
 * SAY WHY (Sentry JAVASCRIPT-REACT-BP, 8–9 Sep 2026).
 *
 * MagicBell answered 403 with `workspace_billing_expired` — the workspace was
 * suspended over an unpaid invoice — and the recorded reason was
 * `Push provider returned 403 Forbidden`, which the back office classifies as
 * "the provider rejected the request itself", i.e. a problem with that one
 * message. The provider's own error code was logged and then discarded.
 */
class PushFailureReasonTest extends TestCase
{
    private function reason(int $status, string $http, string $body): string
    {
        $method = new \ReflectionMethod(Helpers::class, 'pushFailureReason');
        $method->setAccessible(true);

        return $method->invoke(null, $status, $http, $body);
    }

    public function test_the_provider_error_code_reaches_the_recorded_reason(): void
    {
        $reason = $this->reason(403, 'Forbidden', json_encode([
            'errors' => [[
                'code' => 'workspace_billing_expired',
                'message' => 'Workspace billing has expired',
            ]],
        ]));

        $this->assertStringContainsString('workspace_billing_expired', $reason);
    }

    /**
     * ⚠️ APPENDED, NEVER REPLACING. `Push provider returned {status}` is the
     * prefix every existing needle in the admin app's vocabulary matches on.
     */
    public function test_the_existing_prefix_is_kept_intact(): void
    {
        $reason = $this->reason(429, 'Too Many Requests', '{"errors":[{"code":"rate_limited"}]}');

        $this->assertStringStartsWith('Push provider returned 429 Too Many Requests', $reason);
    }

    /**
     * 🚨 THE CONTROL. A body with no code must still produce the string the
     * vocabulary already understands, unchanged.
     */
    public function test_a_body_with_no_code_is_left_exactly_as_it_was(): void
    {
        $this->assertSame(
            'Push provider returned 500 Internal Server Error',
            $this->reason(500, 'Internal Server Error', '<html>gateway error</html>')
        );
    }

    /**
     * ⚠️ A supplier's PROSE is not a code, and an HTML error page must not push a
     * paragraph into a column an admin reads in a table cell.
     */
    public function test_a_sentence_is_not_treated_as_a_code(): void
    {
        $reason = $this->reason(403, 'Forbidden', json_encode([
            'errors' => [['code' => 'Workspace billing has expired, please pay the invoice']],
        ]));

        $this->assertSame('Push provider returned 403 Forbidden', $reason);
    }
}
