<?php

namespace App\Mail;

use App\Services\Pricing\FeeModel;
use App\Support\Incentives;
use App\Support\SubscriptionPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * The welcome email, sent once on registration.
 *
 * 🚨 TWO AUDIENCES, TWO TEMPLATES. Until 12 Sep 2026 every new account —
 * creator and supporter alike — got `email.welcome-fans`, which told a supporter
 * to "set up your wishlist page and start connecting with your fans". A creator
 * is signing up to sell and a supporter is signing up to buy; one mail could
 * only ever be right for one of them.
 *
 * 🚨 TRANSACTIONAL. It states what the reader's own new account is and can do,
 * carries no unsubscribe link, and is sent with `Mail::to()` rather than
 * `EmailService::sendMarketingEmail` — a marketing opt-out must not silence the
 * one message explaining the account somebody just opened. The shared layout
 * only appends its own footer pair when a mail supplies `unsubscribeUrl`, so
 * leaving that unset is what keeps it off.
 *
 * 🚨 EVERY FIGURE IS READ FROM CONFIG AT SEND TIME, NEVER TYPED INTO THE BLADE.
 * The supporter fee, the membership-credit ladder, the referral reward and the
 * platform subscription price are all client-tunable without a deploy, and a
 * literal in a template is a number that cannot follow them. Same reason the
 * creator forms read the shared `fees` prop rather than printing "19%".
 *
 * ⚠️ `config()`, NOT `env()`. This class used to build its From address from
 * `env('MAIL_FROM_ADDRESS')` and the template its CTA from `env('APP_URL')` —
 * both null once config is cached, which is every production deploy, so the
 * welcome email's only button pointed at an empty href.
 */
class Welcome extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        $from = config('mail.from.address') ?: 'noreply@spennypiggy.co';
        $fromName = config('mail.from.name') ?: 'Spenny Piggy';

        $name = trim((string) ($this->data['name'] ?? ''));
        $name = $name !== '' ? ucwords($name) : 'there';

        $isCreator = (int) ($this->data['role'] ?? 0) === 1;

        if (! $isCreator) {
            return $this->view('email.welcome-fans')
                ->with([
                    'name' => $name,
                    'uuid' => $this->data['uuid'] ?? null,
                    'ctaUrl' => $this->siteUrl(),
                    'preheader' => 'Your account is ready — find a creator and unlock their content.',
                ])
                ->from($from, $fromName)
                ->subject('Welcome to Spenny Piggy');
        }

        return $this->view('email.welcome-creator')
            ->with($this->creatorPayload($name))
            ->from($from, $fromName)
            ->subject('Welcome to Spenny Piggy — your page is ready');
    }

    /**
     * Everything the creator template renders, resolved once here.
     *
     * @return array<string, mixed>
     */
    private function creatorPayload(string $name): array
    {
        $username = trim((string) ($this->data['username'] ?? ''));

        return [
            'name' => $name,
            'preheader' => 'Six ways to sell, and how to earn your subscription back.',

            // The creator's own page IS their dashboard (`/{username}`), so this
            // is the one link that lands them where the setup steps are.
            'ctaUrl' => $username !== ''
                ? $this->siteUrl().'/'.rawurlencode($username)
                : $this->siteUrl(),

            // "12%" — the one advertised supporter fee. `describe()` is the same
            // source the shared `fees` prop reads, so the mail and the checkout
            // cannot quote different numbers.
            'feeLabel' => FeeModel::describe('card')['rate_label'],

            'planPrice' => SubscriptionPlan::formatted(),

            'creditsEnabled' => Incentives::membershipCreditsEnabled(),
            'creditRungs' => $this->creditRungs(),

            'referralReward' => $this->money((float) config('referral.reward_amount', 50)),
            'referralThreshold' => $this->money((float) config('referral.qualifying_gmv', 2000)),
        ];
    }

    /**
     * The three milestones the client stated — £500 / £1,000 / £3,000 — derived
     * from the configured step rather than typed out.
     *
     * ⚠️ The step is LINEAR by deliberate design (`config/membership_credits.php`
     * chose one step over a rung table so the two could never disagree), so the
     * multipliers are the only literals here, and a change to `threshold_gbp` or
     * `months_per_threshold` moves all three figures together.
     *
     * ⚠️ A rung past `max_months_per_creator` is dropped, not clamped: a row
     * reading "£3,000 — 6 free months" under a 2-month lifetime cap promises
     * four months the engine will never award.
     *
     * @return array<int, array{amount: string, months: int, label: string}>
     */
    private function creditRungs(): array
    {
        $threshold = (float) config('membership_credits.threshold_gbp', 500);
        $perStep = (int) config('membership_credits.months_per_threshold', 1);
        $cap = config('membership_credits.max_months_per_creator');

        if ($threshold <= 0 || $perStep <= 0) {
            return [];
        }

        $rungs = [];

        foreach ([1, 2, 6] as $multiple) {
            $months = $perStep * $multiple;

            if ($cap !== null && $months > (int) $cap) {
                continue;
            }

            $rungs[] = [
                'amount' => $this->money($threshold * $multiple),
                'months' => $months,
                'label' => $months === 1 ? '1 free month' : $months.' free months',
            ];
        }

        return $rungs;
    }

    /** £500, not £500.00 — a figure in a sentence is read aloud. */
    private function money(float $amount): string
    {
        $decimals = fmod($amount, 1.0) === 0.0 ? 0 : 2;

        return '£'.number_format($amount, $decimals);
    }

    private function siteUrl(): string
    {
        return rtrim((string) (config('app.url') ?: url('/')), '/');
    }
}
