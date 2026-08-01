<?php

namespace App\Services;

use App\Models\Membership;
use App\Models\MembershipOfferDismissal;
use App\Models\MembershipPayment;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * "Should this buyer be shown the creator's membership, and which one?"
 *
 * The moment someone has just paid a creator is the moment they are most likely to pay them
 * again — the card is out, the creator is chosen, the trust already exists. Both surfaces
 * that occupy that moment were empty: the thank-you page offered nothing at all, and the
 * receipt email's only forward step was a generic "Discover more creators on Spenny Piggy"
 * link to the home page that did not even name the creator they had just bought from.
 *
 * A one-off sale earns the platform one commission. A membership earns one every month, and
 * it is also what carries a creator past their own first-sale threshold. This asks for no new
 * traffic — it works entirely on people who are already paying.
 *
 * ⚠️ This class only decides WHETHER and WHICH. It renders nothing and it never assumes the
 * caller has checked anything: every reason to stay quiet is enforced here, so a second
 * surface cannot forget one.
 */
class MembershipUpsellService
{
    /**
     * How long a "No thanks" is honoured for.
     *
     * ⚠️ Not forever. A refusal means "not now" — the creator may have published a great deal
     * more three months later, and a permanent silence makes the first no the last word. This
     * mirrors the same decision made for `CreatorJourneyCard`, which re-shows after 7 days; the
     * window here is far longer because this is a sales prompt rather than the creator's own
     * to-do list, and being asked again too soon is worse than not being asked.
     */
    public const DISMISSAL_DAYS = 90;

    /**
     * The offer to show, or null to stay quiet.
     *
     * @return array{uuid:string, level:string, price:float, currency:string, title:?string, description:?string, thumbnail:?string, checkout_url:string}|null
     */
    public function for(?User $creator, ?User $viewer = null, ?string $viewerEmail = null): ?array
    {
        if (! $creator) {
            return null;
        }

        try {
            // A creator who never published a membership has nothing to offer, and pretending
            // otherwise sends the buyer to a dead page.
            $membership = $this->cheapestBuyable($creator);

            if (! $membership) {
                return null;
            }

            // ⚠️ Never sell someone what they already own. Somebody who is mid-membership
            // being told to "become a member" reads as the platform not knowing who they are,
            // and it is the fastest way to make every future prompt ignorable.
            if ($this->alreadySubscribed($creator, $viewer, $viewerEmail)) {
                return null;
            }

            // ⚠️ They have already said no to THIS creator. Asking again after a refusal is
            // how a prompt stops being read at all — including the ones that matter.
            if ($this->dismissed($creator, $viewer, $viewerEmail)) {
                return null;
            }

            return [
                'uuid' => (string) $membership->uuid,
                'level' => (string) $membership->level,
                'price' => (float) $membership->price,
                'currency' => (string) ($membership->currency ?: 'gbp'),
                'title' => $membership->reward_title,
                'description' => $membership->reward_description,
                'thumbnail' => $membership->thumbnail,
                'checkout_url' => route('membership.checkout', $membership->uuid),
            ];
        } catch (\Throwable $e) {
            // ⚠️ This runs on the thank-you page and inside the receipt email — both of which
            // confirm that money has changed hands. An upsell must never be the reason a buyer
            // cannot see their receipt.
            Log::warning('MembershipUpsellService: could not build offer', [
                'creator_id' => $creator->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * The creator's cheapest publicly buyable tier.
     *
     * Cheapest on purpose: this is a first step for someone who has bought once, not a pitch
     * for the top tier. The lowest rung is the one most likely to be taken, and a member on
     * the entry tier can move up — a visitor who bounced off a £50 tier cannot.
     */
    private function cheapestBuyable(User $creator): ?Membership
    {
        return Membership::query()
            ->where('user_id', $creator->id)
            // Memberships are created unapproved and cleared by an admin; an unapproved or
            // suspended tier is not for sale and must not be advertised.
            ->where('approved', 1)
            ->where(function ($q) {
                $q->whereNull('is_suspended')->orWhere('is_suspended', 0);
            })
            ->where('price', '>', 0)
            ->orderBy('price')
            ->first();
    }

    /**
     * Has this person turned this creator's offer down before?
     *
     * Per creator, never global: refusing one membership says nothing about another's.
     */
    private function dismissed(User $creator, ?User $viewer, ?string $viewerEmail = null): bool
    {
        $email = $viewerEmail ?: $viewer?->email;

        if (! $viewer && ! $email) {
            return false;
        }

        return MembershipOfferDismissal::query()
            ->where('creator_id', $creator->id)
            ->where('dismissed_at', '>=', now()->subDays(self::DISMISSAL_DAYS))
            ->where(function ($q) use ($viewer, $email) {
                if ($viewer) {
                    $q->orWhere('user_id', $viewer->id);
                }

                if ($email) {
                    $q->orWhere('email', $email);
                }
            })
            ->exists();
    }

    /**
     * Record a refusal. Idempotent — a second dismissal is not an error.
     */
    public function dismiss(User $creator, ?User $viewer, ?string $viewerEmail = null): void
    {
        $email = $viewerEmail ?: $viewer?->email;

        if (! $viewer && ! $email) {
            return;
        }

        try {
            MembershipOfferDismissal::updateOrCreate(
                ['creator_id' => $creator->id, 'user_id' => $viewer?->id, 'email' => $email],
                ['dismissed_at' => now()]
            );
        } catch (\Throwable $e) {
            // A refusal that fails to record costs one repeat prompt, not a broken page.
            Log::warning('MembershipUpsellService: could not record dismissal', [
                'creator_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Is this person already paying this creator monthly?
     *
     * Mirrors the active-subscription definition used by the posting-cadence enforcer: paid,
     * still recurring, and not past its end date.
     *
     * ⚠️ Matches on the account id AND on the email. The receipt emails do not all carry a
     * buyer model — `shop-buy-user` and `checkout-user` have only a deliverable — and without
     * the email branch an existing member would be emailed an invitation to join something
     * they already pay for, which is the one outcome that makes every future prompt
     * ignorable. A membership bought as a guest is only ever identified by email.
     */
    private function alreadySubscribed(User $creator, ?User $viewer, ?string $viewerEmail = null): bool
    {
        $email = $viewerEmail ?: $viewer?->email;

        if (! $viewer && ! $email) {
            return false;
        }

        return MembershipPayment::query()
            ->whereIn('membership_id', Membership::where('user_id', $creator->id)->select('id'))
            ->where(function ($q) use ($viewer, $email) {
                if ($viewer) {
                    $q->orWhere('user_id', $viewer->id);
                }

                if ($email) {
                    $q->orWhere('guest_email', $email)
                        ->orWhereIn('user_id', User::where('email', $email)->select('id'));
                }
            })
            ->where('status', 'paid')
            ->where('recurring_for', 'continue')
            ->where(function ($q) {
                $q->whereNull('end')->orWhere('end', '>=', now());
            })
            ->exists();
    }
}
