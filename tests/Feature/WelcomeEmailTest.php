<?php

namespace Tests\Feature;

use App\Mail\Welcome;
use Tests\TestCase;

/**
 * The welcome email splits by role, and every figure in it comes from config.
 *
 * 🚨 NONE OF THIS CAN FAIL LOUDLY IN PRODUCTION. A creator sent the supporter's
 * mail reads perfectly — it is simply about somebody else's account. A figure
 * typed into the template renders perfectly too, and goes on rendering the old
 * number after the client changes the fee. Both are the silent class this suite
 * exists for, so every assertion here is against RENDERED output.
 */
class WelcomeEmailTest extends TestCase
{
    private function render(int $role): string
    {
        return (new Welcome([
            'to' => 'x@example.com',
            'name' => 'naveen',
            'username' => 'naveen',
            'uuid' => 'u-1',
            'role' => $role,
        ]))->render();
    }

    public function test_a_creator_and_a_supporter_get_different_mail(): void
    {
        $creator = $this->render(1);
        $supporter = $this->render(0);

        $this->assertStringContainsString('Six ways to sell', $creator);
        $this->assertStringNotContainsString('Six ways to sell', $supporter);
    }

    /**
     * ⚠️ The role is optional in the payload, and the supporter mail is the
     * safer of the two to send to the wrong person — it describes nothing about
     * an account the reader may not have.
     */
    public function test_a_missing_role_falls_back_to_the_supporter_mail(): void
    {
        $html = (new Welcome(['name' => 'naveen', 'uuid' => 'u-1']))->render();

        $this->assertStringNotContainsString('Six ways to sell', $html);
    }

    /**
     * 🚨 The button used to be `env('APP_URL')`, which is null once config is
     * cached — i.e. on every production deploy — so the only control in the
     * welcome email pointed at an empty href.
     */
    public function test_both_mails_carry_a_real_destination(): void
    {
        foreach ([0, 1] as $role) {
            $this->assertStringNotContainsString('href=""', $this->render($role));
        }

        $this->assertStringContainsString(
            rtrim(config('app.url'), '/').'/naveen',
            $this->render(1),
            'The creator CTA must land on their own page, which is their dashboard.'
        );
    }

    public function test_every_figure_follows_the_config_that_enforces_it(): void
    {
        config([
            'membership_credits.threshold_gbp' => 750,
            'referral.reward_amount' => 80,
            'referral.qualifying_gmv' => 4000,
        ]);

        $html = $this->render(1);

        $this->assertStringContainsString('£750', $html);
        // The ladder is derived from the one step, so every rung moves with it.
        $this->assertStringContainsString('£1,500', $html);
        $this->assertStringContainsString('£4,500', $html);
        $this->assertStringContainsString('£80', $html);
        $this->assertStringContainsString('£4,000', $html);

        $this->assertStringNotContainsString('£500', $html);
    }

    /**
     * ⚠️ A rung past a lifetime cap promises months the engine will never award,
     * so it is dropped rather than clamped.
     */
    public function test_a_lifetime_cap_drops_the_rungs_it_would_never_pay(): void
    {
        config(['membership_credits.max_months_per_creator' => 2]);

        $html = $this->render(1);

        $this->assertStringContainsString('2 free months', $html);
        $this->assertStringNotContainsString('6 free months', $html);
    }

    public function test_the_ladder_is_absent_while_the_scheme_is_off(): void
    {
        config(['membership_credits.enabled' => false]);

        $html = $this->render(1);

        $this->assertStringNotContainsString('free month', $html);
        // The rest of the mail still stands on its own.
        $this->assertStringContainsString('Six ways to sell', $html);
    }

    /**
     * 🚨 TRANSACTIONAL. It explains the account the reader has just opened, so a
     * marketing opt-out must not silence it and it carries no unsubscribe link —
     * the shared layout only appends its footer pair when a mail supplies one.
     */
    public function test_the_creator_mail_is_transactional(): void
    {
        $this->assertStringNotContainsString('Unsubscribe', $this->render(1));
    }

    /**
     * Stripe content-first compliance. ⚠️ This is the rendered mail, so a banned
     * word in a comment is not what this catches — it is a word a creator reads.
     */
    public function test_neither_mail_uses_banned_vocabulary(): void
    {
        foreach ([0, 1] as $role) {
            $html = strtolower($this->render($role));

            foreach (['gift', 'tip jar', 'donation', 'donate', 'fundraise', 'coffee'] as $banned) {
                $this->assertStringNotContainsString($banned, $html, "Banned wording in the role {$role} welcome mail.");
            }
        }
    }
}
