<?php

namespace Tests\Feature;

use App\Mail\BirthdayReminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 A MAIL THAT SUPPLIES ITS OWN FOOTER LINKS MUST NOT ALSO GET THE LAYOUT'S PAIR.
 *
 * `email/default-2.blade.php` used to render its own "Manage preferences · Unsubscribe"
 * unconditionally, so the birthday e-mails shipped FOUR footer links — and the layout's
 * two were the wrong ones for them:
 *
 *   · Its Unsubscribe called `generateUnsubscribeToken($user)` with NO category, which
 *     defaults to `marketing_emails_enabled` AND suppresses the address for all
 *     marketing. The birthday reminder is a CATEGORY-class mail, so clicking the link
 *     that looks like its unsubscribe silenced every promotion the person had agreed to
 *     and did not stop the birthday reminders at all.
 *   · Its "Manage preferences" was a bare `/email-preferences`, which sits behind `auth` —
 *     the login dead end the SIGNED no-login centre exists to avoid.
 *
 * Nothing errored and the mail looked perfect, which is why this needs a test rather than
 * a reading. The assertions are on RENDERED output: the payload is exactly what lies here.
 */
class EmailFooterLinkTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The reminder takes the RECIPIENT's id and a pre-built creator card — the same
     * shape `SendBirthdayReminders` passes it. Nothing here depends on the card's
     * contents; the footer is what is under test.
     */
    private function render(User $recipient): string
    {
        $card = [
            'name' => 'Jane',
            'username' => 'jane',
            'birthday_label' => '12 March',
            'avatar_url' => 'https://ucarecdn.com/'.str_repeat('a', 36).'/',
            'url' => 'https://example.test/jane?sp_d=birthday-reminder',
            'line' => 'Jane has a birthday coming up.',
        ];

        return (new BirthdayReminder($recipient->id, 0, $card))->render();
    }

    public function test_the_footer_offers_one_opt_out_and_one_preference_link_not_two_of_each(): void
    {
        $html = $this->render(User::factory()->create());

        // The mail draws its own, in its own words. The layout used to draw a second
        // pair underneath: four links leading to two destinations.
        $this->assertSame(
            1,
            preg_match_all('/>\s*(Turn off birthday emails|Unsubscribe)\s*</', $html),
            'The footer carries two opt-out links.'
        );

        $this->assertSame(
            1,
            preg_match_all('/>\s*(Choose what you hear from us|Manage preferences)\s*</', $html),
            'The footer carries two preference-centre links.'
        );
    }

    public function test_every_opt_out_on_the_page_stops_birthday_mail_rather_than_all_marketing(): void
    {
        $html = $this->render(User::factory()->create());

        $this->assertStringContainsString(
            'category=birthday_emails_enabled',
            $html,
            'The birthday opt-out must name its own category, not fall back to marketing.'
        );

        // The layout's own token carries NO category, so it defaults to
        // `marketing_emails_enabled` and suppresses the address globally. On this mail
        // that is the wrong switch, and it is the link labelled "Unsubscribe" — the one
        // a reader is likeliest to press.
        $optOuts = preg_match_all('#href="([^"]*unsubscribe[^"]*)"#i', $html, $m);
        $this->assertGreaterThan(0, $optOuts, 'no opt-out link was rendered at all');

        foreach ($m[1] as $href) {
            $this->assertStringContainsString(
                'category=birthday_emails_enabled',
                html_entity_decode($href),
                'An opt-out link silences marketing instead of birthday mail: '.$href
            );
        }
    }

    public function test_no_footer_link_points_at_the_login_walled_preferences_page(): void
    {
        $html = $this->render(User::factory()->create());

        // A suspended creator cannot sign in, so the bare path is a dead end for exactly
        // the person most likely to be using it. The signed centre is the one that works.
        $this->assertDoesNotMatchRegularExpression(
            '#href="[^"]*/email-preferences"#',
            $html,
            'A footer link points at the auth-gated preferences page.'
        );
    }

    public function test_a_mail_that_supplies_no_links_still_gets_the_layout_fallback(): void
    {
        $user = User::factory()->create();

        $html = view('email.default-2', [
            'user' => $user,
            'slot' => '',
            'content' => '',
        ])->render();

        $this->assertStringContainsString('>Unsubscribe<', $html);
        $this->assertStringContainsString('Manage preferences', $html);
    }

    /**
     * Eight of the ten mails that draw their own opt-out draw NO preference link
     * (`AbandonedCheckoutReminder`, `FinishAddingYourCard`, `PublishYourFirstItem`,
     * `FounderCongratulations`, `PushAlertsNeedChecking`, `ReactivationReminder`,
     * `StockBackInStock`, `SubscriptionPolicyChanged`). Suppressing the layout's whole
     * pair would take the preference centre away from all eight — so the opt-out is
     * dropped and the preference link is kept, as the SIGNED token.
     *
     * "Stop this one" and "choose what I do want" are different intentions, and a footer
     * offering only the first is what makes people opt out of everything.
     */
    public function test_a_mail_with_an_opt_out_and_no_centre_link_still_gets_the_signed_centre(): void
    {
        $user = User::factory()->create();

        $html = view('email.default-2', [
            'user' => $user,
            'slot' => '',
            'content' => '',
            'unsubscribeUrl' => 'https://example.test/unsubscribe/1?category=restock_emails_enabled',
        ])->render();

        $this->assertSame(
            0,
            substr_count($html, '>Unsubscribe<'),
            'The layout drew a second opt-out beside the one the mail supplied.'
        );

        $this->assertStringContainsString('Manage preferences', $html);
        $this->assertMatchesRegularExpression(
            '#href="[^"]*email-preferences/manage/#',
            $html,
            'The preference link must be the signed no-login centre, not the auth-gated path.'
        );
    }
}
