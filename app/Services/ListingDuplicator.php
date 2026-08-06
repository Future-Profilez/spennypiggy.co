<?php

namespace App\Services;

use App\Http\Controllers\Auth\BillsController;
use App\Http\Controllers\Auth\MembershipController;
use App\Http\Controllers\Auth\ShopsController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\PiggyPotController;
use App\Http\Controllers\TaskController;
use App\Models\User;
use App\Support\CatalogueRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * "Duplicate" — relist something almost identical without retyping the whole form.
 *
 * 🚨 A LISTING CANNOT BE COPIED AS A DATABASE ROW. Every one of the six carries its own
 * `stripe_product_id` and `price_id` on the creator's connected account, created at save
 * time. A row copy would carry those over, so the new listing would charge the ORIGINAL's
 * price forever — edit the copy to £30 and the supporter still pays £19.99. Silent, and
 * it only shows up in a payout.
 *
 * So a duplicate is not a copy. It is a **re-submission**: this builds the payload the
 * module's own create form would have posted and calls that module's own `store()`. Every
 * rule therefore comes free and cannot drift — the price limits (£4.99 and the per-feature
 * ceiling), `NoExpenseOrBrandName`, the blocked-word check, the reward contract, the media
 * moderation scan, the Stripe product, and the "created unapproved" default. There is no
 * second copy of any of it here.
 *
 * Same pattern as the admin app's `ReviewDispatchController::decide`, which forges a
 * request onto the handler that already knows how to do the work.
 */
class ListingDuplicator
{
    /** Appended to the copied title so the two are distinguishable in the catalogue. */
    public const SUFFIX = ' (copy)';

    /**
     * Which controller action creates each type, and the route its request is built for.
     *
     * @var array<string,array{0:class-string,1:string,2:string}>
     */
    private const STORE = [
        'wish' => [WishitemController::class, 'addWishItem', 'save_wish_item'],
        'shop' => [ShopsController::class, 'addShopItems', 'add-shop'],
        'task' => [TaskController::class, 'store', 'task.store'],
        'piggy_pot' => [PiggyPotController::class, 'store', 'piggy-pots.store'],
        'bill' => [BillsController::class, 'billSave', 'bill.save'],
        'membership' => [MembershipController::class, 'membershipLevelSave', 'membership.save'],
    ];

    /**
     * Duplicate one listing.
     *
     * @return array{ok:bool,message:string,type:string}
     */
    public function duplicate(User $creator, string $type, int $id): array
    {
        if (! isset(self::STORE[$type])) {
            return $this->fail($type, 'That kind of listing cannot be duplicated.');
        }

        $config = CatalogueRegistry::config($type);
        $model = $config['model'];

        // ⚠️ Ownership is resolved from the OWNER COLUMN, never from the id alone — and
        // Task's is `creator_id`, not `user_id`. Without this a guessed id would let one
        // creator mint a copy of another's listing onto their own account.
        $source = $model::query()
            ->where($config['owner'], $creator->id)
            ->find($id);

        if (! $source) {
            return $this->fail($type, 'That listing could not be found.');
        }

        try {
            $payload = $this->payloadFor($type, $source);
        } catch (Throwable $e) {
            Log::error('Duplicate: could not build payload', ['type' => $type, 'id' => $id, 'error' => $e->getMessage()]);

            return $this->fail($type, 'This listing could not be duplicated. Open it and use the form instead.');
        }

        // "Did a row appear?" is the only reliable success signal: the six store methods
        // return four different shapes between them (JSON, redirect-back-with-error,
        // redirect-with-errors, and a thrown ValidationException), and reading each one
        // correctly is a fifth place for them to drift.
        $before = (int) $model::query()->where($config['owner'], $creator->id)->max('id');

        [$controller, $method] = self::STORE[$type];

        try {
            app($controller)->{$method}($this->forge($type, $creator, $payload));
        } catch (ValidationException $e) {
            return $this->fail($type, $e->validator->errors()->first() ?: 'This listing could not be duplicated.');
        } catch (Throwable $e) {
            Log::error('Duplicate failed', ['type' => $type, 'id' => $id, 'error' => $e->getMessage()]);

            return $this->fail($type, 'Something went wrong duplicating this listing.');
        }

        $after = (int) $model::query()->where($config['owner'], $creator->id)->max('id');

        if ($after <= $before) {
            // The store method refused. Its own message is in the session or its JSON
            // body; the session is the one both redirect shapes use.
            $message = session('error') ?: 'This listing could not be duplicated.';

            return $this->fail($type, is_string($message) ? $message : 'This listing could not be duplicated.');
        }

        return [
            'ok' => true,
            'type' => $type,
            'message' => CatalogueRegistry::label($type).' duplicated. The copy is in review.',
        ];
    }

    /**
     * A request shaped exactly like the module's own create form would have posted.
     *
     * ⚠️ The session is carried over from the live request. Several store methods answer
     * a refusal with `redirect()->back()->with('error', …)`, which needs one — and that
     * session is also where this reads the refusal back from.
     */
    private function forge(string $type, User $creator, array $payload): Request
    {
        $forged = Request::create(route(self::STORE[$type][2], [], false), 'POST', $payload);

        $forged->setUserResolver(fn () => $creator);

        if (request()->hasSession()) {
            $forged->setLaravelSession(request()->session());
        }

        return $forged;
    }

    /**
     * The copied fields, per type.
     *
     * ⚠️ Public because it is the only part of this feature that can be tested without a
     * live Stripe key: every store method creates a real product on the creator's
     * connected account, so the six end-to-end paths are browser-verified, not unit
     * tested. What IS testable here — and is what the feature turns on — is exactly which
     * fields are carried over and which are not.
     *
     * Only what the module's own form posts. Everything not listed here is therefore
     * never carried over, which is the point: `stripe_product_id`, `price_id`, `uuid`,
     * the approval flags, `moderation_reason`, and the social-engagement counters
     * (`supporter_count`, `rising_score`, `engagement_level`, …) all belong to the
     * ORIGINAL listing's history and would be a lie on a brand-new one.
     *
     * @return array<string,mixed>
     */
    public function payloadFor(string $type, Model $source): array
    {
        $reward = [
            // ⚠️ The reward headline is NOT suffixed. It is what the SUPPORTER reads on
            // the card, the checkout and the receipt — "The full set (copy)" describes
            // the creator's workflow, not what is being sold. Only the listing's own
            // title is marked, and only so the creator can tell the two apart.
            'reward_title' => $source->reward_title ?: null,
            'reward_type' => $source->reward_type ?: null,
            // Read through getAttribute: `reward_body` is $hidden (it IS the paid
            // deliverable) but the creator is copying their own listing, and the reward
            // is the substance of what they are relisting.
            'reward_body' => $source->getAttribute('reward_body') ?: null,
            'reward_description' => $source->reward_description ?: null,
        ];

        return match ($type) {
            'wish' => $reward + [
                'wishname' => $this->copyTitle((string) $source->wishname),
                'goal_label' => $source->goal_label ?: null,
                'price' => $source->price,
                'item_url' => $source->item_url,
                'thumbnail' => $source->thumbnail,
                'content_file' => $source->content_file,
                'content_file_name' => $source->content_file_name,
                'content_file_type' => $source->content_file_type,
                'content_file_size' => $source->content_file_size,
                'ai_generated' => $source->ai_generated ?? 0,
                'subscription' => (int) ($source->subscription ?? 0),
                'subscription_period' => $source->subscription_period,
                'repeat_purchase' => $source->repeat_purchase ?? 0,
                'payment_methods_accepted' => $source->payment_methods_accepted,
            ],

            'shop' => $reward + [
                'type' => $source->type,
                'name' => $this->copyTitle((string) $source->name),
                'description' => $source->description,
                'price' => $source->price,
                'image' => $source->getAttribute('image'),
                'ask_question' => $source->ask_question,
                'slot_limitation' => $source->slot_limitation ?: null,
                'special_member_price' => $source->special_member_price ?: null,
                'quantity_allow' => (int) ($source->quantity_allow ?? 0),
                'ai_generated' => $source->ai_generated ?? 0,
                'reward_file' => $source->getAttribute('reward_file'),
                'reward_file_type' => $source->reward_file_type,
                'payment_methods_accepted' => $source->payment_methods_accepted,
            ] + $this->shopShipping($source),

            'task' => $reward + [
                'title' => $this->copyTitle((string) $source->title),
                'description' => $source->description,
                'price' => $source->price,
                'category' => $source->category,
                'type' => $source->type,
                'sla_hours' => $source->sla_hours,
                'deliverable_note' => $source->deliverable_note,
                // ⚠️ Task takes its media as an ARRAY, not a string — the form posts the
                // whole uploader payload. Passing the bare url silently drops the image.
                'media_file' => $source->media_url ? ['url' => $source->media_url, 'uuid' => $this->uuidFrom($source->media_url)] : null,
                'deliverable_file' => $source->deliverable_content
                    ? ['url' => $source->deliverable_content, 'mimeType' => $source->deliverable_content_type]
                    : null,
                'payment_methods_accepted' => $source->payment_methods_accepted,
            ],

            'piggy_pot' => $reward + [
                'title' => $this->copyTitle((string) $source->title),
                'description' => $source->description,
                'target_amount' => $source->target_amount,
                'currency' => $source->currency,
                'cover_media' => $source->cover_media,
                'content_file' => $source->content_file,
                'content_description' => $source->content_description,
                // ⚠️ The deadline is deliberately NOT copied. The original's date is
                // usually in the past, and a pot created already expired is worse than
                // one with no deadline at all — it is invisible the moment it is made.
                'deadline' => null,
                // A pot nobody can see yet cannot be the featured one; store() forces
                // this to false anyway, and copying `true` would read as a promise.
                'is_pinned' => false,
                'enable_leaderboard' => (bool) $source->enable_leaderboard,
                'allow_anonymous' => (bool) $source->allow_anonymous,
                'payment_methods_accepted' => $source->payment_methods_accepted,
            ],

            'bill' => $reward + [
                'name' => $this->copyTitle((string) $source->name),
                'goal_label' => $source->goal_label ?: null,
                'price' => $source->price,
                'period' => $source->period,
                'thumbnail' => $source->thumbnail,
                'content_file' => $source->content_file,
                'content_file_name' => $source->content_file_name,
                'content_file_type' => $source->content_file_type,
                'content_file_size' => $source->content_file_size,
            ],

            'membership' => $reward + [
                // ⚠️ `level` is unique per creator (membershipLevelSave refuses a repeat),
                // which the " (copy)" suffix satisfies on its own.
                'level' => $this->copyTitle((string) $source->level),
                // ⚠️ `month_price`, not `price` — this is the one module whose form field
                // does not match its column.
                'month_price' => $source->price,
                'thumbnail' => $source->thumbnail,
                'rewards' => $this->decodeRewards($source->rewards),
                'content_file' => $source->content_file,
                'content_file_name' => $source->content_file_name,
                'content_file_type' => $source->content_file_type,
                'content_file_size' => $source->content_file_size,
            ],

            default => [],
        };
    }

    /**
     * Shipping for a physical product.
     *
     * A profile is passed straight through. Without one the original's own country/price
     * rows are rebuilt into the JSON shape the form posts — `addShopItems` recreates the
     * `shop_shipping_info` rows from it, so the copy ships exactly like its original
     * instead of arriving with no shipping at all.
     *
     * @return array<string,mixed>
     */
    private function shopShipping(Model $source): array
    {
        if ($source->type !== 'physical') {
            return [];
        }

        try {
            $rows = $source->shop_shipping_info()
                ->get(['country', 'shipping_price'])
                ->map(fn ($row) => ['country' => $row->country, 'price' => (float) $row->shipping_price])
                ->all();
        } catch (Throwable $e) {
            // Shipping rows are a detail; losing them costs the creator one field to
            // re-enter. Losing the whole duplicate costs them the entire form.
            $rows = [];
        }

        return [
            'shipping_profile_id' => $source->shipping_profile_id ?: null,
            'shipping_info' => $source->shipping_information,
            // `shipping` is `required` for a physical product even when a profile is set.
            'shipping' => json_encode($rows),
        ];
    }

    /**
     * @return array<int,mixed>
     */
    private function decodeRewards($rewards): array
    {
        if (is_array($rewards)) {
            return $rewards;
        }

        $decoded = json_decode((string) $rewards, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * ⚠️ Capped at the column's own length. Several titles are `varchar(60)` or validated
     * `max:100`, so appending to a title already at the limit would fail validation and
     * the creator would be told their own listing is invalid.
     */
    private function copyTitle(string $title): string
    {
        $title = trim($title);

        if ($title === '') {
            return trim(self::SUFFIX);
        }

        if (str_ends_with($title, self::SUFFIX)) {
            return $title;
        }

        $room = 60 - strlen(self::SUFFIX);

        return (strlen($title) > $room ? rtrim(substr($title, 0, $room)) : $title).self::SUFFIX;
    }

    private function uuidFrom(?string $value): ?string
    {
        if ($value && preg_match('/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i', $value, $match)) {
            return $match[1];
        }

        return null;
    }

    /** @return array{ok:bool,message:string,type:string} */
    private function fail(string $type, string $message): array
    {
        return ['ok' => false, 'type' => $type, 'message' => $message];
    }
}
