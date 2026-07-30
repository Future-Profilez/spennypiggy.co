<?php

namespace Tests\Unit;

use App\Support\IdentityFailureReason;
use Tests\TestCase;

class IdentityFailureReasonTest extends TestCase
{
    public function test_it_resolves_a_known_stripe_code_into_creator_facing_copy(): void
    {
        $payload = IdentityFailureReason::payload('selfie_face_mismatch', 'The selfie did not match.');
        $explained = IdentityFailureReason::explain($payload);

        $this->assertSame('selfie_face_mismatch', $explained['code']);
        $this->assertStringContainsString('selfie', strtolower($explained['title']));
        $this->assertNotEmpty($explained['what_to_do']);
        // Stripe's own sentence is kept for support, never as the headline.
        $this->assertSame('The selfie did not match.', $explained['reason']);
    }

    public function test_an_unknown_code_still_produces_an_actionable_card(): void
    {
        $explained = IdentityFailureReason::explain(
            IdentityFailureReason::payload('some_code_stripe_added_last_week', null)
        );

        $this->assertNotEmpty($explained['title']);
        $this->assertNotEmpty($explained['what_happened']);
        $this->assertNotEmpty($explained['what_to_do']);
    }

    public function test_it_backfills_copy_for_rows_written_before_the_map_existed(): void
    {
        // Legacy shape: Stripe's raw last_error, stored verbatim.
        $legacy = json_encode(['code' => 'document_expired', 'reason' => 'The document has expired.']);

        $explained = IdentityFailureReason::explain($legacy);

        $this->assertSame('document_expired', $explained['code']);
        $this->assertStringContainsString('expired', strtolower($explained['title']));
        $this->assertNotEmpty($explained['what_to_do']);
    }

    public function test_an_admin_note_survives_the_round_trip(): void
    {
        $explained = IdentityFailureReason::explain(
            IdentityFailureReason::payload('admin_rejected', null, 'Your passport photo was cropped.')
        );

        $this->assertSame('Your passport photo was cropped.', $explained['note']);
    }

    public function test_it_returns_null_for_empty_or_unparseable_input(): void
    {
        $this->assertNull(IdentityFailureReason::explain(null));
        $this->assertNull(IdentityFailureReason::explain(''));
        $this->assertNull(IdentityFailureReason::explain('not json'));
    }
}
