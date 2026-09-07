<?php

namespace Tests\Feature;

use App\Support\ContentWording;
use Tests\TestCase;

/**
 * The two apps must reach the SAME verdict about a creator's bio.
 *
 * 🚨 `App\Support\ContentWording` is MIRRORED in admin.spennypiggy.co — the apps
 * share a database and not code — and the whole reason it was extracted is that a
 * phrase the website accepts and the admin console then flags is a creator waiting
 * days for a rejection naming a word their own form allowed. Nothing structural
 * was stopping the two copies drifting; the lists were identical by luck.
 *
 * ⚠️ This is the `fee_profiles` rule applied to a wording list. Two guards, because
 * neither is sufficient alone across two independent git repositories:
 *
 *   · the sibling comparison catches a real drift, but only where both repos are
 *     checked out side by side (the layout this project is developed in). In CI,
 *     where one app is cloned alone, there is nothing to compare against.
 *   · the fingerprint catches an edit made in THIS app wherever the suite runs. It
 *     cannot see the other app at all — its job is to fail the moment somebody
 *     changes a list, so the mirror is not forgotten.
 */
class ContentWordingMirrorTest extends TestCase
{
    /**
     * 🚨 UPDATE THIS ONLY WHEN YOU HAVE UPDATED BOTH COPIES.
     * The failure message tells you the new value; changing it without editing
     * admin.spennypiggy.co/app/Support/ContentWording.php is exactly the drift
     * this test exists to prevent.
     */
    private const RULE_FINGERPRINT = '348dbab1cd57d9d0a8e713c1478f321598ec1ca839b3c96eb755037b9127228d';

    private const MIRROR_PATH = __DIR__.'/../../../admin.spennypiggy.co/app/Support/ContentWording.php';

    public function test_the_lists_have_not_changed_without_the_mirror_being_updated(): void
    {
        $this->assertSame(
            self::RULE_FINGERPRINT,
            $this->fingerprint(self::lists()),
            'A ContentWording list changed. Copy the change into '
            .'admin.spennypiggy.co/app/Support/ContentWording.php, then update '
            .'RULE_FINGERPRINT in this test to '.$this->fingerprint(self::lists())
        );
    }

    /**
     * ⚠️ Skips rather than fails when the sibling repo is not checked out — a
     * guard that fails in CI for a reason nobody can act on is a guard people
     * delete.
     */
    public function test_the_admin_mirror_declares_the_same_lists(): void
    {
        if (! is_file(self::MIRROR_PATH)) {
            $this->markTestSkipped('admin.spennypiggy.co is not checked out beside this app.');
        }

        $mirror = self::listsFrom(file_get_contents(self::MIRROR_PATH));
        $ours = self::lists();

        foreach ($ours as $name => $terms) {
            $this->assertNotNull(
                $mirror[$name] ?? null,
                "The admin mirror does not declare {$name}."
            );

            // Reported as a diff both ways, because "the mirror is missing a term"
            // and "the mirror has a term we do not" are different mistakes and the
            // fix is different.
            $this->assertSame(
                [],
                array_values(array_diff($terms, $mirror[$name])),
                "Terms in this app's {$name} that the admin mirror is missing."
            );
            $this->assertSame(
                [],
                array_values(array_diff($mirror[$name], $terms)),
                "Terms in the admin mirror's {$name} that this app is missing."
            );
        }
    }

    /**
     * ⚠️ ORDER IS PART OF THE CONTRACT, so it is fingerprinted rather than sorted:
     * `firstMatch()` returns the FIRST hit and "gift card" is both a brand token and
     * transfer wording, so a reordered list changes which message a creator reads.
     *
     * @param  array<string, array<int, string>>  $lists
     */
    private function fingerprint(array $lists): string
    {
        return hash('sha256', json_encode($lists));
    }

    /** @return array<string, array<int, string>> */
    private static function lists(): array
    {
        return [
            'brands' => ContentWording::BLOCKED_BRANDS,
            'expense' => ContentWording::BLOCKED_EXPENSE_TERMS,
            'transfer' => ContentWording::BLOCKED_TRANSFER_TERMS,
        ];
    }

    /**
     * The mirror's lists, read from its SOURCE.
     *
     * ⚠️ Its class shares this one's fully-qualified name, so it cannot be loaded
     * — PHP would either collide with the class already in memory or, worse,
     * autoload one app's copy and silently compare it with itself.
     *
     * @return array<string, array<int, string>>
     */
    private static function listsFrom(string $source): array
    {
        $names = [
            'brands' => 'BLOCKED_BRANDS',
            'expense' => 'BLOCKED_EXPENSE_TERMS',
            'transfer' => 'BLOCKED_TRANSFER_TERMS',
        ];

        $lists = [];

        foreach ($names as $key => $const) {
            if (! preg_match('/const\s+'.$const.'\s*=\s*\[(.*?)\];/s', $source, $m)) {
                continue;
            }

            preg_match_all("/'((?:[^'\\\\]|\\\\.)*)'/", $m[1], $terms);
            $lists[$key] = array_map(
                static fn (string $t) => stripslashes($t),
                $terms[1]
            );
        }

        return $lists;
    }
}
