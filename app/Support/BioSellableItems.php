<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * The ONE place a bio-page card turns into a checkout.
 *
 * 🚨 NOTHING HERE CREATES A PAYMENT, PRICES ONE, OR DECIDES WHO MAY MAKE ONE.
 * Every value it returns is a URL to a buying path that already exists on the
 * main site — `buyShopItem`, `TaskController::purchase`, `buyBill`, `buyLevel`,
 * the Piggy Pot widget's `piggy-pot.pay`, and `wishItemSubscribe`. That is the
 * whole design of the B stream: the bio page is a NEW WAY IN to the same six
 * checkouts, never a seventh checkout. Every rule those paths enforce —
 * `CheckoutMethodResolver`, the risk engine, `Helpers::priceWithinLimits`, the
 * supporter-account requirement, the £1 card-verification gate, the creator
 * subscription and activity gates, `fee_profile` threading and the Deliverable
 * every payment must produce — is enforced where it always was, on arrival.
 * Adding a Stripe call to this class, or to anything that consumes it, is what
 * the brief means by "let the bio page bypass a rule the main site enforces".
 *
 * 🚨 THE TYPE LIST IS `CatalogueRegistry::TYPES` AND IS NOT RESTATED HERE. Six
 * modules already drifted apart once by each keeping its own idea of what a
 * creator sells; a seventh copy on the most-shared page on the platform is the
 * last place that should happen. This class adds only what the registry
 * deliberately does not carry — where a supporter goes to BUY the thing, which
 * is a routing decision and not a column.
 *
 * ⚠️ `requiresAccount()` mirrors the Stripe content-first rule exactly: Bills,
 * Memberships, Paid Tasks and Shop need a signed-in supporter so the order can
 * be tracked, delivered, renewed and cancelled; guest checkout is allowed ONLY
 * for Piggy Pot and Wishes. It is a LABEL on the card, never the gate — the gate
 * is the `! Auth::check()` refusal inside each buy path, which still runs
 * whatever this returns.
 */
class BioSellableItems
{
    /**
     * How many listings a creator may put on the page.
     *
     * The page's job is to be read in one scroll on a phone from an in-app
     * browser. Twelve cards is already a long thumb-scroll; an uncapped list
     * turns the fastest page on the platform into the slowest.
     */
    public const MAX_ITEMS = 12;

    /**
     * Types a supporter may buy without an account.
     *
     * ⚠️ Exactly the two the compliance rule names. Do not extend this list to
     * "make the bio page convert better" — it is the same decision as guest
     * checkout everywhere else, and it is not a bio-page decision.
     */
    private const GUEST_CHECKOUT_TYPES = ['wish', 'piggy_pot'];

    /** The word on the button, per type. Content-first vocabulary only. */
    private const CTA = [
        'wish' => 'Unlock',
        'shop' => 'Buy',
        'task' => 'Request',
        'piggy_pot' => 'Support',
        'bill' => 'Subscribe',
        'membership' => 'Join',
    ];

    public static function supports(?string $type): bool
    {
        return CatalogueRegistry::supports($type);
    }

    /** @return array<string> */
    public static function typeKeys(): array
    {
        return CatalogueRegistry::typeKeys();
    }

    public static function requiresAccount(string $type): bool
    {
        return ! in_array($type, self::GUEST_CHECKOUT_TYPES, true);
    }

    public static function cta(string $type): string
    {
        return self::CTA[$type] ?? 'View';
    }

    /**
     * Where a tapped card sends the supporter.
     *
     * 🚨 REBUILT FROM THE STORED ROW, NEVER TAKEN FROM A REQUEST — the same rule
     * `BioLinkPlatforms` documents for the outbound redirect. The only input is
     * a type and a model the caller has already scoped to its owner.
     *
     * Per type, and why each is the closest existing checkout entry point:
     *
     *   wish        `wish/checkout/{uuid}` — a GET renders `cart/SubCheckout`,
     *               the wish's own checkout page. `onetime` unless the creator
     *               configured the wish as a subscription, in which case the
     *               recurring offer is the one they set up.
     *   shop        the item's own public page, which carries `BuyShopItem` and
     *               the shipping/quantity fields a shop order needs before it
     *               can be priced. There is no shorter honest route: a shop
     *               order is not fully specified by its uuid.
     *   task        the task's own public page, which carries the request form
     *               and the SLA the supporter is agreeing to.
     *   bill        `bill/checkout/{uuid}` — a GET renders `bills/BillCheckout`.
     *   membership  `membership/checkout/{uuid}` — a GET renders `MemberCheckout`.
     *   piggy_pot   ⚠️ THE ONE TYPE WITH NO STANDALONE CHECKOUT PAGE. A pot is
     *               bought through `PiggyPotWidget`, which opens as a popup from
     *               the profile's pot grid, so the deep link carries `?pot=` and
     *               `PiggyPotsGrid` opens that pot on arrival. Building a second
     *               pot checkout to avoid the hop would be a new Stripe surface,
     *               which is the one thing this feature must not create.
     */
    public static function checkoutUrl(string $type, Model $item, User $creator): ?string
    {
        $uuid = (string) ($item->uuid ?? '');

        if ($uuid === '' || ! self::supports($type)) {
            return null;
        }

        return match ($type) {
            'wish' => route('wish.subscribe.checkout', array_filter([
                'uuid' => $uuid,
                'reccure' => self::wishIsRecurring($item) ? null : 'onetime',
            ])),
            'shop' => route('single-shop-list', [
                'slug' => Str::slug((string) ($item->name ?? '')) ?: 'item',
                'uuid' => $uuid,
            ]),
            'task' => route('task.show', ['uuid' => $uuid]),
            'bill' => route('bill.checkout', ['uuid' => $uuid]),
            'membership' => route('membership.checkout', ['uuid' => $uuid]),
            'piggy_pot' => route('user.show', [
                'username' => $creator->username,
                'page' => 'piggy-pots',
            ]).'?pot='.$uuid,
            default => null,
        };
    }

    /**
     * ⚠️ A wish is recurring only when the creator ticked it AND set a period.
     * `subscription` alone has been found set with no period, which produces a
     * "Pay every " button with nothing after it.
     */
    private static function wishIsRecurring(Model $item): bool
    {
        return (bool) ($item->subscription ?? false)
            && filled($item->subscription_period ?? null);
    }
}
