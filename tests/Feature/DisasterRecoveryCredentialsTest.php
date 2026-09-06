<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * 🚨 THE DR COMMANDS MUST NOT BUILD AWS CREDENTIALS BY HAND.
 *
 * Both `infra:dr-check` and `db:backup-offsite` used to read AWS_ACCESS_KEY_ID and
 * AWS_SECRET_ACCESS_KEY out of the environment and pass them to the SDK as an explicit
 * credentials pair. On Lambda that is not a harmless duplicate of the default provider
 * chain — it is WRONG. The runtime injects THREE variables for the execution role, and
 * they are TEMPORARY credentials: an `ASIA…` key presented without its AWS_SESSION_TOKEN
 * is refused with `InvalidClientTokenId`.
 *
 * Measured in production 5 Sep 2026. It blinded the RDS posture half of `infra:dr-check`,
 * which is the half that catches configuration drift — the normal way a DR plan dies.
 *
 * ⚠️ THIS IS A SOURCE SCAN, DELIBERATELY. Reaching the real branch needs a Lambda with a
 * live execution role; what has to be pinned is that nobody re-adds the hand-rolled pair
 * while "tidying up" or copying the block into a third command. A behavioural test cannot
 * see that, because locally the two-thirds-complete credentials happen to work.
 */
class DisasterRecoveryCredentialsTest extends TestCase
{
    /** @var string[] */
    private const COMMANDS = [
        'app/Console/Commands/CheckDisasterRecoveryPosture.php',
        'app/Console/Commands/BackupDatabaseOffsite.php',
    ];

    public function test_no_dr_command_hand_rolls_aws_credentials(): void
    {
        foreach (self::COMMANDS as $relative) {
            $path = base_path($relative);
            $this->assertFileExists($path);

            $source = $this->withoutComments(file_get_contents($path));

            $this->assertStringNotContainsString(
                "'credentials'",
                $source,
                $relative.' builds an AWS credentials array by hand. Let the SDK default '
                    .'provider chain resolve them — it reads AWS_SESSION_TOKEN too, and a '
                    .'key+secret pair without it is rejected on Lambda as InvalidClientTokenId.'
            );

            $this->assertStringNotContainsString(
                'AWS_ACCESS_KEY_ID',
                $source,
                $relative.' reads AWS_ACCESS_KEY_ID directly. The SDK already does, along '
                    .'with the session token that makes it usable.'
            );
        }
    }

    /**
     * The docblock explaining the trap is the only thing standing between the next author
     * and re-introducing it, so a rewrite that drops the reasoning fails here too.
     */
    public function test_the_reason_is_written_down_beside_the_code(): void
    {
        foreach (self::COMMANDS as $relative) {
            $this->assertStringContainsString(
                'AWS_SESSION_TOKEN',
                file_get_contents(base_path($relative)),
                $relative.' no longer explains why credentials are left to the SDK. '
                    .'Without that note the block gets "helpfully" added back.'
            );
        }
    }

    /**
     * Comments are stripped before the scan — a commented-out example of the bad pattern,
     * or the docblock naming the variable, is not shipped code.
     */
    private function withoutComments(string $source): string
    {
        $out = '';

        foreach (token_get_all($source) as $token) {
            if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }

            $out .= is_array($token) ? $token[1] : $token;
        }

        return $out;
    }
}
