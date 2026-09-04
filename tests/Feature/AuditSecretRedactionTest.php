<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Observers\ActivityObserver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 A DELETE AUDIT DUMPS THE WHOLE ROW, SO ITS REDACTION LIST IS SECURITY.
 *
 * `ActivityObserver`'s list named `two_factor_secret` / `two_factor_key`, which
 * are not columns on this `users` table — the TOTP seed is `tfa_key` — so every
 * `USER_DELETED` row carried a live 2FA secret in plain text beside the
 * account's email and date of birth, with `password` redacted right next to it.
 */
class AuditSecretRedactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_delete_audit_does_not_carry_the_two_factor_secret(): void
    {
        $user = User::factory()->create(['tfa_key' => 'YCEEH36UXEEROAXY']);

        $user->delete();

        $row = AuditLog::where('action_type', 'USER_DELETED')
            ->where('reference_id', (string) $user->id)
            ->first();

        $this->assertNotNull($row, 'No USER_DELETED audit row was written.');

        $encoded = json_encode($row->metadata_json);

        $this->assertStringNotContainsString('YCEEH36UXEEROAXY', $encoded);
        $this->assertStringContainsString('[REDACTED]', $encoded);
    }

    /**
     * The explicit list is the rule; the name check is the backstop for a
     * column added later by somebody who never reads that file.
     */
    public function test_a_column_named_like_a_secret_is_redacted_without_being_listed(): void
    {
        $observer = new ActivityObserver;

        $method = new \ReflectionMethod($observer, 'sanitizeData');
        $method->setAccessible(true);

        $clean = $method->invoke($observer, [
            'some_new_secret' => 'do-not-log-me',
            'reset_token' => 'do-not-log-me-either',
            'bio' => 'this is ordinary content',
        ]);

        $this->assertSame('[REDACTED]', $clean['some_new_secret']);
        $this->assertSame('[REDACTED]', $clean['reset_token']);
        // ⚠️ The backstop must stay narrow — redacting ordinary fields makes a
        // log nobody can read, which is its own failure.
        $this->assertSame('this is ordinary content', $clean['bio']);
    }
}
