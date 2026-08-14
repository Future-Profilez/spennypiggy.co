<?php

namespace Tests\Feature;

use App\Support\RiskMessages;
use Tests\TestCase;

/**
 * The three rules from the customer-facing messaging brief (9 Aug 2026),
 * enforced mechanically rather than by review.
 *
 * This test is the whole reason `RiskMessages` is one class. The wording used
 * to live in eighteen places and had already drifted; a rule that only exists
 * in a document is one somebody breaks in six months by adding a nineteenth
 * message that reads perfectly well and quietly names a threshold.
 */
class RiskMessagesGoldenRulesTest extends TestCase
{
    /**
     * Rule 1 — never reveal a threshold to a supporter.
     *
     * No cooldown minutes, no spend headroom, no attempt count, no
     * "N new creators per day". Anyone testing stolen cards would use it to
     * stay just under the line, which is precisely how the old copy read:
     * "Please wait 15 minutes", "You can support 1 new creator per day",
     * "Larger payments more than £50 need to login."
     */
    public function test_no_supporter_message_contains_a_number(): void
    {
        foreach (RiskMessages::supporterKeys() as $key) {
            foreach ([RiskMessages::AUDIENCE_GUEST, RiskMessages::AUDIENCE_AUTH] as $audience) {
                $m = RiskMessages::get($key, $audience);
                $text = $m['title'].' '.$m['body'].' '.$m['next_step'];

                // The £1 card-verification charge is a fixed, disclosed price
                // the supporter is about to pay — not a line to stay under.
                foreach (RiskMessages::SUPPORTER_DIGIT_ALLOWLIST as $allowed) {
                    $text = str_replace($allowed, '', $text);
                }

                $this->assertDoesNotMatchRegularExpression(
                    '/\d/',
                    $text,
                    "Supporter message [{$key}/{$audience}] contains a number. "
                    .'Thresholds must never be printed — spell a duration out in words '
                    .'("about ten seconds") or say "in a little while".'
                );
            }
        }
    }

    /**
     * Rule 2 — never imply the supporter is a criminal.
     *
     * The overwhelming majority of people hitting these are genuine, and the
     * internal state names (THROTTLE, FREEZE) must never surface at all.
     */
    public function test_no_supporter_message_uses_a_banned_word(): void
    {
        foreach (RiskMessages::supporterKeys() as $key) {
            foreach ([RiskMessages::AUDIENCE_GUEST, RiskMessages::AUDIENCE_AUTH] as $audience) {
                $m = RiskMessages::get($key, $audience);
                $text = mb_strtolower($m['title'].' '.$m['body'].' '.$m['next_step']);

                foreach (RiskMessages::BANNED_SUPPORTER_WORDS as $word) {
                    $this->assertDoesNotMatchRegularExpression(
                        '/\b'.preg_quote($word, '/').'\b/u',
                        $text,
                        "Supporter message [{$key}/{$audience}] uses the banned word \"{$word}\"."
                    );
                }
            }
        }
    }

    /**
     * Rule 3 — always give a next step.
     *
     * A dead end is what sends someone to their bank instead of our chat, and
     * that is a chargeback we caused ourselves.
     */
    public function test_every_message_gives_a_next_step(): void
    {
        foreach (RiskMessages::keys() as $key) {
            $audience = in_array($key, RiskMessages::creatorKeys(), true)
                ? RiskMessages::AUDIENCE_CREATOR
                : RiskMessages::AUDIENCE_GUEST;

            $m = RiskMessages::get($key, $audience);

            $this->assertNotSame('', trim($m['next_step']), "Message [{$key}] has no next step.");
            $this->assertNotSame('', trim($m['title']), "Message [{$key}] has no title.");
            $this->assertNotSame('', trim($m['body']), "Message [{$key}] has no body.");
        }
    }

    /**
     * 🚨 A guest has no /history, no dashboard and no account.
     *
     * Sending them to a page they cannot reach is worse than saying nothing —
     * they arrive at a login wall having already been refused once. The
     * audience is resolved on the server for exactly this reason, so this must
     * hold for EVERY state, not only the ones written with guests in mind.
     */
    public function test_a_guest_is_never_linked_to_an_authenticated_page(): void
    {
        $guestSafe = [route('register'), route('login'), route('home')];

        foreach (RiskMessages::keys() as $key) {
            $m = RiskMessages::get($key, RiskMessages::AUDIENCE_GUEST);

            foreach (['cta', 'cta_secondary'] as $slot) {
                $url = $m[$slot]['url'] ?? null;
                if ($url === null) {
                    continue;
                }

                $this->assertContains(
                    $url,
                    $guestSafe,
                    "Message [{$key}] hands a guest a link to {$url}, which they cannot reach."
                );
            }
        }
    }

    /**
     * The spend-cap message is the one the brief splits explicitly (4a / 4b).
     * A guest must never be shown their spend figures at all: guest identity is
     * keyed to card fingerprint, device and IP, so a running total on an
     * unauthenticated screen is a live readout of remaining headroom.
     */
    public function test_the_spend_cap_message_only_offers_history_to_a_signed_in_supporter(): void
    {
        $guest = RiskMessages::get('SPEND_CAP_REACHED', RiskMessages::AUDIENCE_GUEST);
        $auth = RiskMessages::get('SPEND_CAP_REACHED', RiskMessages::AUDIENCE_AUTH);

        $this->assertStringNotContainsString('support history', mb_strtolower($guest['body']));
        $this->assertSame(route('register'), $guest['cta']['url']);

        $this->assertStringContainsString('support history', mb_strtolower($auth['body']));
        $this->assertStringStartsWith(route('support.history.page'), $auth['cta']['url']);
    }

    /**
     * Every reason code the engine can emit has to land on a real state.
     *
     * A code with no mapping falls through to GENERIC_HOLD, which is safe but
     * says nothing useful — and the failure is silent, so nothing would catch a
     * new rule shipping without its message.
     */
    public function test_every_engine_reason_code_maps_to_a_real_state(): void
    {
        $emitted = [
            'IDENTITY_BLOCKED', 'ACTIVE_COOLDOWN', 'GUEST_BLOCKED_IN_STATE',
            'LIMIT_EXCEEDED_1H', 'LIMIT_EXCEEDED_24H', 'LIMIT_EXCEEDED_7D',
            'HIGH_VALUE_TX', 'NEW_CREATOR_VOLUME_LIMIT', 'VELOCITY_5_IN_10M',
            'ACCELERATION_3_IN_10M', 'RAPID_AFTER_STEP_UP', 'NEW_CREATOR_LIMIT',
            'NEW_CREATOR_RESTRICTED', 'HIGH_VALUE_VELOCITY_2H',
            'GUEST_CHECKOUT_DISABLED', 'HIGH_VALUE_GUEST',
        ];

        foreach ($emitted as $code) {
            $this->assertArrayHasKey(
                $code,
                RiskMessages::REASON_CODE_MAP,
                "Reason code {$code} has no message. Add it to REASON_CODE_MAP."
            );

            $stateKey = RiskMessages::REASON_CODE_MAP[$code];
            $this->assertNotNull(
                RiskMessages::definition($stateKey),
                "Reason code {$code} maps to [{$stateKey}], which is not a defined state."
            );
        }
    }

    /**
     * A state declaring `requires` must render fully once those values are
     * supplied — an un-substituted ":reason" printed to a creator is the exact
     * generic-string failure the brief exists to remove.
     */
    public function test_states_with_placeholders_render_fully_when_given_their_values(): void
    {
        foreach (RiskMessages::keys() as $key) {
            $requires = RiskMessages::definition($key)['requires'] ?? [];
            if ($requires === []) {
                continue;
            }

            $vars = [];
            foreach ($requires as $name) {
                $vars[$name] = 'VALUE';
            }

            $m = RiskMessages::get($key, RiskMessages::AUDIENCE_CREATOR, $vars);

            foreach ($requires as $name) {
                $this->assertStringNotContainsString(
                    ':'.$name,
                    $m['title'].$m['body'].$m['next_step'],
                    "Message [{$key}] still shows the raw placeholder :{$name}."
                );
            }
        }
    }

    /**
     * 🚨 The audience fallback must never cross the supporter/creator line.
     *
     * A creator's copy carries their reserve percentage, their payout hold
     * reason and their account state. Handing any of that to a supporter — let
     * alone a guest — discloses the creator's private position to whoever
     * happens to open their page. The fallback used to prefer the creator
     * variant unconditionally, so the first state written with `creator` + `auth`
     * and no `guest` would have leaked it silently.
     */
    public function test_a_supporter_is_never_shown_creator_copy(): void
    {
        $creatorOnly = array_values(array_diff(
            RiskMessages::creatorKeys(),
            RiskMessages::supporterKeys()
        ));

        $this->assertNotEmpty($creatorOnly, 'Expected at least one creator-only state to guard.');

        // 1. No engine reason code may resolve to a creator-only state. The
        //    engine's output is rendered straight to whoever is paying, so this
        //    is the path a leak would actually travel down.
        foreach (RiskMessages::REASON_CODE_MAP as $code => $stateKey) {
            $this->assertNotContains(
                $stateKey,
                $creatorOnly,
                "Reason code {$code} resolves to [{$stateKey}], which is creator-only copy — "
                .'it would be rendered to the supporter being refused.'
            );
        }

        // 2. And the generic fallback every unmapped code lands on is a
        //    supporter state, so a new rule shipping without a message cannot
        //    show a supporter something written for the creator either.
        $fallback = RiskMessages::forReasonCodes(['A_CODE_NOBODY_MAPPED'], RiskMessages::AUDIENCE_GUEST);
        $this->assertSame('GENERIC_HOLD', $fallback['key']);
        $this->assertContains('GENERIC_HOLD', RiskMessages::supporterKeys());
    }

    /**
     * The audience fallback must not cross the supporter/creator line even when
     * a state defines only one supporter variant — a guest falls back to the
     * signed-in supporter's copy, never to the creator's.
     */
    public function test_a_missing_guest_variant_falls_back_to_the_supporter_copy(): void
    {
        $definition = RiskMessages::definition('CREATOR_SUBSCRIPTION_INACTIVE');

        $guest = RiskMessages::get('CREATOR_SUBSCRIPTION_INACTIVE', RiskMessages::AUDIENCE_GUEST);
        $creatorBody = $definition[RiskMessages::AUDIENCE_CREATOR]['body'];

        $this->assertNotSame($creatorBody, $guest['body']);
        $this->assertStringNotContainsString('earning', $guest['body']);
    }

    /**
     * An unknown key must degrade to the generic state rather than throw. This
     * runs inside checkout refusals; an exception here would turn "we couldn't
     * take that payment" into a 500.
     */
    public function test_an_unknown_key_falls_back_instead_of_throwing(): void
    {
        $m = RiskMessages::get('NO_SUCH_STATE_AT_ALL', RiskMessages::AUDIENCE_GUEST);

        $this->assertSame('GENERIC_HOLD', $m['key']);
        $this->assertNotSame('', $m['next_step']);
    }
}
