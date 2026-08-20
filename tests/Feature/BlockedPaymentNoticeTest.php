<?php

namespace Tests\Feature;

use App\Mail\PaymentCouldNotGoThrough;
use App\Models\User;
use App\Support\BlockedPaymentNotice;
use App\Support\RiskMessages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The email a supporter gets when their payment was stopped.
 *
 * Answers questions 5 and 9 of the 9 Aug messaging brief: everything was on
 * screen only, so a supporter who navigated away had nothing — and a guest,
 * who has no account to return to, had nothing at all.
 */
class BlockedPaymentNoticeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Cache::flush();
    }

    private function ui(string $key = 'SPEND_CAP_REACHED', string $audience = RiskMessages::AUDIENCE_GUEST): array
    {
        return RiskMessages::get($key, $audience);
    }

    public function test_a_guest_is_emailed_when_their_payment_is_stopped(): void
    {
        BlockedPaymentNotice::send($this->ui(), 'guest@example.com');

        Mail::assertQueued(PaymentCouldNotGoThrough::class, function ($mail) {
            return $mail->hasTo('guest@example.com') && $mail->isGuest === true;
        });
    }

    /**
     * 🚨 THE POINT OF THE WHOLE FEATURE.
     *
     * The behaviour this exists to defuse is the retry spiral — someone tries
     * four times, assumes the worst and phones their bank. Four emails would
     * confirm every fear the copy is written to remove.
     */
    public function test_retrying_does_not_send_a_second_email(): void
    {
        foreach (range(1, 4) as $ignored) {
            BlockedPaymentNotice::send($this->ui(), 'repeat@example.com');
        }

        Mail::assertQueuedCount(1);
    }

    /**
     * A different problem is genuinely different news, so it is not silenced by
     * the first one's quiet period.
     */
    public function test_a_different_message_state_is_still_sent(): void
    {
        BlockedPaymentNotice::send($this->ui('SPEND_CAP_REACHED'), 'two@example.com');
        BlockedPaymentNotice::send($this->ui('COOLDOWN_ACTIVE'), 'two@example.com');

        Mail::assertQueuedCount(2);
    }

    /**
     * ⚠️ Step-up already sends a code to this exact address. A second email
     * landing beside it reads as two separate problems.
     */
    public function test_step_up_is_never_emailed_about(): void
    {
        BlockedPaymentNotice::send($this->ui('STEP_UP_REQUIRED'), 'stepup@example.com');

        Mail::assertNothingQueued();
    }

    public function test_the_guest_login_gate_is_never_emailed_about(): void
    {
        BlockedPaymentNotice::send($this->ui('GUEST_ACCOUNT_REQUIRED'), 'gate@example.com');
        BlockedPaymentNotice::send($this->ui('GUEST_ACCOUNT_REQUIRED_VALUE'), 'gate@example.com');

        Mail::assertNothingQueued();
    }

    public function test_nothing_is_sent_without_a_usable_address(): void
    {
        BlockedPaymentNotice::send($this->ui(), null);
        BlockedPaymentNotice::send($this->ui(), '');
        BlockedPaymentNotice::send($this->ui(), 'not-an-email');

        Mail::assertNothingQueued();
    }

    public function test_the_switch_stops_it_without_a_deploy(): void
    {
        config(['services.blocked_payment_notice.enabled' => false]);

        BlockedPaymentNotice::send($this->ui(), 'off@example.com');

        Mail::assertNothingQueued();
    }

    /**
     * ⚠️ It runs on the checkout path, after the refusal has already been
     * decided. An email failing must never turn "we couldn't take that payment"
     * into a 500.
     */
    public function test_it_never_throws(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('mail server down'));

        BlockedPaymentNotice::send($this->ui(), 'boom@example.com');

        $this->assertTrue(true, 'A failing mail server must not surface on the checkout path.');
    }

    /**
     * A signed-in supporter is greeted by name and is not told the platform is
     * guessing who they are.
     */
    public function test_a_signed_in_supporter_is_not_treated_as_a_guest(): void
    {
        $user = User::factory()->create(['name' => 'Ava Collins', 'email' => 'priya@example.com']);

        BlockedPaymentNotice::send(
            $this->ui('SPEND_CAP_REACHED', RiskMessages::AUDIENCE_AUTH),
            'priya@example.com',
            $user
        );

        /*
         * ⚠️ 'Ava', from the ACCOUNT'S NAME — not 'Priya', from the address they
         * happen to have typed. That distinction is the whole point of this test:
         * a signed-in supporter is greeted by who we know them to be, and
         * `firstNameOf()` reads `$user->name` for exactly that reason.
         *
         * This asserted 'Priya' and had been failing on it — a stale expectation
         * that contradicted the test's own title, found 20 Aug 2026 while
         * triaging a full-suite run. The code was right.
         */
        Mail::assertQueued(PaymentCouldNotGoThrough::class, function ($mail) {
            return $mail->isGuest === false && $mail->firstName === 'Ava';
        });
    }

    /**
     * 🚨 The three rules hold in an inbox too — an email keeps far longer than
     * a toast, and is the copy most likely to be forwarded or screenshotted.
     */
    public function test_the_rendered_email_reveals_no_threshold_and_accuses_nobody(): void
    {
        foreach (BlockedPaymentNotice::EMAILABLE_STATES as $key) {
            foreach ([RiskMessages::AUDIENCE_GUEST, RiskMessages::AUDIENCE_AUTH] as $audience) {
                $ui = RiskMessages::get($key, $audience);
                $html = (new PaymentCouldNotGoThrough($ui, $audience === RiskMessages::AUDIENCE_GUEST))
                    ->render();

                // Strip markup, styles and the CDN/asset URLs the layout carries,
                // so only what a person actually reads is examined.
                $text = strip_tags(preg_replace('/<(style|head|script)\b.*?<\/\1>/is', ' ', $html));
                $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $text = mb_strtolower(preg_replace('/\s+/', ' ', $text));

                foreach (RiskMessages::BANNED_SUPPORTER_WORDS as $word) {
                    $this->assertDoesNotMatchRegularExpression(
                        '/\b'.preg_quote($word, '/').'\b/u',
                        $text,
                        "The [{$key}] email uses the banned word \"{$word}\"."
                    );
                }

                $this->assertStringContainsString(
                    mb_strtolower($ui['next_step']),
                    $text,
                    "The [{$key}] email does not tell the reader what to do next."
                );
            }
        }
    }

    /**
     * ⚠️ A guest must never be handed a link into the signed-in app. They would
     * land on a login wall having already been turned away once.
     */
    public function test_a_guest_email_never_links_into_the_signed_in_app(): void
    {
        foreach (BlockedPaymentNotice::EMAILABLE_STATES as $key) {
            $ui = RiskMessages::get($key, RiskMessages::AUDIENCE_GUEST);
            $html = (new PaymentCouldNotGoThrough($ui, true))->render();

            $this->assertStringNotContainsString(route('support.history.page'), $html);
        }
    }
}
