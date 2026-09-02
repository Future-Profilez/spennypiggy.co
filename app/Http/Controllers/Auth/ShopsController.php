<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckMediaModeration;
use App\Jobs\NotificationSave;
use App\Jobs\ShopBuyed;
use App\Jobs\ShopBuyedUser;
use App\Mail\ShopOrderStatusMail;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\Payment;
use App\Models\ShippingProfile;
use App\Models\ShippingProfileZone;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopPayment;
use App\Models\ShopShippingInfo;
use App\Models\User;
use App\Models\UserPayment;
use App\Models\UserShopCategories;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Rules\NoExpenseOrBrandName;
use App\Services\AbandonedCheckoutService;
use App\Services\CheckoutMethodResolver;
use App\Services\CreatorActivityService;
use App\Services\CreatorAvailabilityMessageService;
use App\Services\CreatorSubscriptionService;
use App\Services\Discovery\AttributionService;
use App\Services\ItemFunnelService;
use App\Services\ItemShareService;
use App\Services\ItemTextModeration;
use App\Services\ItemViewTracker;
use App\Services\RewardService;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\RiskService;
use App\Services\StockWaitlistService;
use App\Services\UserProfileService;
use App\StripeControl;
use App\Support\BlockedPaymentAlert;
use App\Support\NotificationContext;
use App\Traits\RiskEnforcement;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\StripeClient;

class ShopsController extends Controller
{
    use RiskEnforcement;

    public function shopList($username)
    {
        $user = User::where('username', $username)->first();
        if (! $user) {
            return response()->json([
                'status' => false,
                'msg' => 'User not found.',
            ]);
        }

        $isOwner = Auth::check() && Auth::id() === $user->id;

        $query = Shop::withScheduled()->where('user_id', $user->id);

        // If not the owner, only show approved and active items
        if (! $isOwner) {
            $query->where('approved', 1)->where('status', 1);
        }

        // category + withCount keep `real_category` / `total_sold` from firing
        // one query per row on a creator with a large shop.
        $shops = $query->orderBy('id', 'desc')
            ->with(['shop_shipping_info', 'category'])
            ->withCount('paidPayments')
            ->get();

        // The deliverable is only ever serialised for the owner here; buyers get
        // theirs through the order screens.
        if ($isOwner) {
            $shops->each->withDeliverable();

            // How many people are waiting for each sold-out item — the demand the
            // creator could not see before. ONE grouped query for the whole list,
            // never one per row.
            $counts = app(StockWaitlistService::class)->waitingCounts($shops->pluck('id')->all());

            // Seen → started checkout → sold, for the whole list in a fixed number of
            // queries. Owner only: it is their own performance data, and nobody else
            // has any business seeing how a listing is doing.
            $funnels = app(ItemFunnelService::class)->forItems('shop', $shops->pluck('id')->all());

            $shops->each(function ($shop) use ($counts, $funnels) {
                $shop->waiting_count = (int) ($counts[$shop->id] ?? 0);
                $shop->funnel = $funnels[$shop->id] ?? null;
            });
        }

        return response()->json([
            'status' => true,
            'shops' => $shops,
        ]);
    }

    /**
     * Run the SFW gate over a listing's paid deliverable. Only Uploadcare-hosted
     * images/videos can be scanned — an external URL is left alone.
     */
    /** Text half of the gate — a shop reward can be a written message or a link. */
    private function moderateShopText(?Shop $shop): void
    {
        if (! $shop) {
            return;
        }

        ItemTextModeration::apply(
            $shop,
            ['reward_title', 'reward_body', 'reward_description', 'name', 'description'],
            ['approved' => 0]
        );
    }

    /**
     * The reward file's MIME type, in the only shape anything can read.
     *
     * 🚨 THIS USED TO GUESS THE LITERAL STRING `'image'` whenever Uploadcare did
     * not report a mime — for ANY file, an mp3 included — and that guess was in a
     * shape no resolver accepts: `RewardService::kind()` and the JS `rewardKind()`
     * both test `str_starts_with($mime, 'image/')`, so a bare `image` matched
     * nothing, fell through to the extension test, and an Uploadcare UUID carries
     * no extension either. Every one of those listings therefore rendered a generic
     * download tile instead of the picture, with nothing wrong in any log.
     *
     * ⚠️ The client already sends the real mime (`AddItem` posts
     * `reward.file.mime` as `reward_file_type`) and this method used to ignore it.
     * Preference order: what Uploadcare told the server, then what the client
     * reported, then the existing value on an edit, then NULL — never a guess.
     * Null is safe: `kind()` falls back to the file extension, and
     * `moderateRewardFile()` treats an unknown type as scannable rather than
     * skipping it.
     */
    private static function rewardFileMime(mixed $file, Request $request, ?string $existing): ?string
    {
        /*
         * ⚠️ `$file` IS THE UPLOADCARE UUID STRING, NOT AN ARRAY — `$file =
         * $request->reward_file` a few lines above every call site, and `AddItem`
         * posts `reward.file.uuid`. The original expression read
         * `$file['contentInfo']['mime']['type']` on it, and `empty()` swallows an
         * illegal string offset silently, so that branch was ALWAYS false and the
         * `'image'` guess below it was the only outcome that ever ran. That is why
         * the live rows read exactly `image` (6) or nothing (14), and never a real
         * mime. The array form is still honoured in case a caller ever passes the
         * full Uploadcare payload.
         */
        if (is_array($file) && ! empty($file['contentInfo']['mime']['type'])) {
            return $file['contentInfo']['mime']['type'];
        }

        // What the client actually reported. The form has always sent this and the
        // controller has never looked at it.
        $fromClient = trim((string) $request->input('reward_file_type', ''));

        if ($fromClient !== '' && str_contains($fromClient, '/')) {
            return $fromClient;
        }

        return ! empty($request->reward_file) ? $existing : null;
    }

    private function moderateRewardFile(Shop $shop): void
    {
        if (empty($shop->reward_file) || Str::startsWith($shop->reward_file, ['http://', 'https://'])) {
            return;
        }

        $type = strtolower((string) $shop->reward_file_type);
        if ($type !== '' && ! Str::contains($type, ['image', 'video'])) {
            return;
        }

        CheckMediaModeration::dispatch(
            Shop::class,
            $shop->id,
            $shop->reward_file,
            ['approved' => 0],
            'reward_file'
        );
    }

    /**
     * Reward columns for a shop listing, plus the legacy success_page_* pair
     * kept in step with them.
     *
     * The order screens and the buyer's receipt still read success_page_type /
     * success_page_value, so deriving them here — rather than asking the form
     * for both — keeps one editor writing one truth and stops the two
     * representations drifting apart.
     *
     * @return array<string, mixed>
     */
    private function shopRewardColumns(Request $request): array
    {
        $columns = RewardService::columnsFrom($request->all());

        // A physical product's deliverable is the parcel and its name already
        // describes it, so the form does not ask for a second headline — fill
        // it from the product name rather than rejecting the listing.
        if ($request->type === 'physical') {
            $columns['reward_title'] = trim((string) $request->name) ?: $columns['reward_title'];
            $columns['reward_type'] = null;
            $columns['reward_body'] = null;

            return $columns;
        }

        if (empty($columns['reward_type'])) {
            return $columns;
        }

        return $columns + [
            'success_page_type' => match ($columns['reward_type']) {
                'link' => 'url',
                'message' => 'text',
                default => 'file',
            },
            'success_page_value' => $columns['reward_body'],
        ];
    }

    public function addShopItems(Request $request)
    {
        $request->validate(
            [
                'type' => [
                    'required',
                ],
                'name' => [
                    'required',
                    'string',
                    new NoExpenseOrBrandName,
                ],
                'description' => [
                    'required',
                ],
                // `required`, not `sometimes` — an omitted price used to skip the
                // £4.99–£10,000 rule entirely and create a £0 listing.
                'price' => [
                    'required',
                    'numeric',
                    function ($attribute, $value, $fail) {
                        // Stripe compliance: products priced £4.99–£10,000 (GBP equivalent)
                        $err = Helpers::priceWithinLimits($value, Auth::user()->default_currency ?? 'gbp', 4.99, 10000);
                        if ($err) {
                            $fail($err);
                        }
                    },
                ],
                'image' => [
                    'required',
                    'string',
                ],
                'ask_question' => [
                    'nullable',
                    'string',
                ],
                'slot_limitation' => [
                    'nullable',
                    'integer',
                    'min:1',
                ],
                'special_member_price' => [
                    'sometimes',
                    'nullable',
                    'numeric',
                    'lt:price',
                ],
                'quantity_allow' => [
                    'required',
                    'numeric',
                    Rule::in([0, 1]),
                ],
                'category' => [
                    'sometimes',
                    'nullable',
                ],
            ] + RewardService::validationRules(requiredRule: 'required_unless:type,physical')
        );

        if ($linkError = RewardService::submittedLinkError($request->all())) {
            return redirect()->back()->with('error', $linkError);
        }

        Log::info('Add Shop Item Request', ['request_data' => $request->all()]);

        if ($request->type == 'physical') {
            $request->validate(
                [
                    'shipping' => [
                        'required',
                    ],
                    'shipping_info' => [
                        'sometimes',
                        'nullable',
                        'string',
                    ],
                    'varients' => [
                        'sometimes',
                        'nullable',
                    ],
                ]
            );
        }

        $user = User::find(Auth::id());

        // A listing cannot exist without a payment destination. createProduct()
        // takes a non-nullable string, so an unconnected creator would 500 on a
        // TypeError (an Error, not an Exception — the catch below never sees it).
        if (empty($user->account_id)) {
            return response()->json([
                'status' => false,
                'msg' => 'Please connect your Stripe account before creating items.',
            ]);
        }

        if (Helpers::checkBlockData($request) == 1) {
            return response()->json([
                'status' => false,
                'msg' => 'Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress, 😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦',
            ]);
        }

        // A shipping profile may only ever be one of the creator's own.
        if ($request->filled('shipping_profile_id')
            && ! ShippingProfile::where('id', $request->shipping_profile_id)->where('user_id', $user->id)->exists()) {
            return response()->json([
                'status' => false,
                'msg' => 'Invalid shipping profile.',
            ]);
        }

        $file = [];
        if (! empty($request->reward_file)) {
            $file = $request->reward_file;
            // $file = json_decode($request->reward_file);
        }

        $rewardColumns = $this->shopRewardColumns($request);

        if ($request->type != 'physical') {
            $shop = Shop::create(array_merge([
                'user_id' => $user->id,
                'type' => $request->type,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'currency' => $user->default_currency ?? 'gbp',
                'image' => $request->image ?? null,
                'success_page_type' => ! empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                'success_page_value' => ! empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                'reward_file_type' => self::rewardFileMime($file, $request, null),
                'reward_file' => ! empty($file['uuid']) ? $file['uuid'] : (! empty($request->reward_file) ? $request->reward_file : null),
                'ai_generated' => $request->ai_generated,
                'ask_question' => $request->ask_question ?? null,
                'slot_limitation' => $request->slot_limitation ?? null,
                'special_member_price' => $request->special_member_price ?? null,
                'quantity_allow' => $request->quantity_allow ?? null,
                'payment_methods_accepted' => in_array($request->payment_methods_accepted, ['card', 'bank', 'both'], true) ? $request->payment_methods_accepted : 'both',
            ], $rewardColumns));
        } else {
            $shop = Shop::create(array_merge([
                'user_id' => $user->id,
                'type' => $request->type,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'currency' => $user->default_currency ?? 'gbp',
                'image' => $request->image ?? null,
                'success_page_type' => ! empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                'success_page_value' => ! empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                'reward_file_type' => self::rewardFileMime($file, $request, null),
                'reward_file' => ! empty($file['uuid']) ? $file['uuid'] : (! empty($request->reward_file) ? $request->reward_file : null),
                'ask_question' => $request->ask_question ?? null,
                'slot_limitation' => $request->slot_limitation ?? null,
                'special_member_price' => $request->special_member_price ?? null,
                'quantity_allow' => $request->quantity_allow ?? null,
                'payment_methods_accepted' => in_array($request->payment_methods_accepted, ['card', 'bank', 'both'], true) ? $request->payment_methods_accepted : 'both',
                'shipping_profile_id' => $request->shipping_profile_id ?? null,
                'shipping_information' => $request->shipping_info ?? null,
            ], $rewardColumns));

            if (empty($request->shipping_profile_id)) {
                $shipping = json_decode($request->shipping);

                foreach ($shipping as $value) {
                    $ship = new ShopShippingInfo;
                    $ship->uuid = Uuid::uuid4();
                    $ship->shop_id = $shop->id;
                    $ship->country = $value->country;
                    $ship->shipping_price = $value->price;
                    $ship->save();
                }
            }
        }

        $shop->refresh();

        // SFW gate: scan the product image; hold (un-approve) if it fails moderation.
        if (! empty($shop->image)) {
            CheckMediaModeration::dispatch(
                Shop::class,
                $shop->id,
                $shop->image,
                ['approved' => 0],
                'product_image'
            );
        }

        // The reward file is the thing actually sold — scanning only the shop-front
        // thumbnail let unscanned media ship to buyers.
        $this->moderateRewardFile($shop);
        $this->moderateShopText($shop);

        // Stripe compliance: high-value listings (>£2,500 GBP-equiv) get an enhanced review
        // before going live (held un-approved until an admin clears them).
        if (! empty($shop->price) && Helpers::priceFormat(strtoupper($shop->currency ?? 'GBP'), (float) $shop->price, 'GBP') > 2500) {
            $shop->approved = 0;
            $shop->save();
        }

        if (! empty($request->category)) {
            $categories = json_decode($request->category);
            $cat = UserShopCategories::whereIn('uuid', $categories)->get();
            foreach ($cat as $value) {
                $shop_cat = new ShopCategory;
                $shop_cat->uuid = Uuid::uuid4();
                $shop_cat->shop_id = $shop->id;
                $shop_cat->user_shop_categories_id = $value->id;
                $shop_cat->save();
            }
        }

        $currency = $user->default_currency ?? 'gbp';

        // Use new gross-up flow for consistent fee calculation
        // Calculate the base amount the creator should receive (Price + VAT)
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $request->price * $vatPercent / 100;

        $listedPriceToGrossUp = $request->price + $vatAmount;

        $metrics = app(RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Creator id resolves their bespoke platform rate, if they have one — the
        // listing's advertised price has to match what checkout will charge.
        $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $currency, $reserveRate, 'card', $user->id);

        $createpriceid = $breakdown['total_supporter_pays'];

        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $slug = strtolower(str_replace(' ', '-', $shop->name));
        $productPayload = [
            'name' => "Shop Item: {$shop->name} (Total value including all fees)",
            'images' => [$shop->perma_link],
            'default_price_data' => [
                'currency' => $currency,
                'unit_amount_decimal' => round($createpriceid * $multiplier, 2, PHP_ROUND_HALF_UP),
            ],
            'url' => env('APP_URL')."/shop/$slug/$shop->uuid",
            'metadata' => [
                'shop_item_name' => $shop->name,
                'creator_id' => $user->id,
                'creator_net_amount' => (string) ($breakdown['net_to_creator'] * $multiplier),
                'total_charge_amount' => (string) ($createpriceid * $multiplier),
            ],
        ];

        try {
            $product = StripeControl::createProduct($productPayload, $user->account_id);
            $shop->stripe_product_id = $product->id;
            $shop->price_id = $product->default_price;
            $shop->save();

            // Clear user caches
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => 'Shop Item has been added, your upload will be approved shortly.',
            ]);
        } catch (Exception $e) {
            $shop->delete();

            return response()->json([
                'status' => false,
                'msg' => 'Stripe Error: '.$e->getMessage(),
            ]);
            // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
        }
    }

    public function updateShopItems(Request $request, $uuid)
    {
        $user = User::find(Auth::id());

        $shop = Shop::withScheduled()->where('uuid', $uuid)->where('user_id', $user->id)->first();

        if (! $shop) {
            return response()->json([
                'status' => false,
                'msg' => "Shop item not found or you don't have permission.",
            ]);
        }

        $old_price = $shop->price;
        $oldImage = $shop->image;
        $oldRewardFile = $shop->reward_file;

        // The update below writes `$request->x` with no fallback for these, so an
        // omitted field used to blank the listing (a missing price also skipped
        // the £4.99–£10,000 rule and left a £0 item on sale).
        $request->validate([
            'type' => ['required', 'string'],
            'name' => ['required', 'string', new NoExpenseOrBrandName],
            'description' => ['required'],
            'price' => ['required', 'numeric'],
            'slot_limitation' => ['nullable', 'integer', 'min:0'],
            'special_member_price' => ['nullable', 'numeric', 'lt:price'],
        ] + RewardService::validationRules(requiredRule: 'required_unless:type,physical'));

        if ($linkError = RewardService::submittedLinkError($request->all())) {
            return response()->json(['status' => false, 'msg' => $linkError]);
        }

        // Stripe compliance: products priced £4.99–£10,000 (GBP equivalent)
        $priceError = Helpers::priceWithinLimits($request->price, $shop->currency ?? ($user->default_currency ?? 'gbp'), 4.99, 10000);
        if ($priceError) {
            return response()->json(['status' => false, 'msg' => $priceError]);
        }

        // A shipping profile may only ever be one of the creator's own — otherwise
        // checkout would price shipping off another creator's zones.
        if ($request->filled('shipping_profile_id')) {
            $ownsProfile = ShippingProfile::where('id', $request->shipping_profile_id)
                ->where('user_id', $user->id)
                ->exists();
            if (! $ownsProfile) {
                return response()->json(['status' => false, 'msg' => 'Invalid shipping profile.']);
            }
        }

        if (Helpers::checkBlockData($request) == 1) {
            return redirect()->back()->with('error', 'Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦');
        }

        $file = [];
        if (! empty($request->reward_file)) {
            $file = $request->reward_file;
            // $file = json_decode($request->reward_file);
        }

        $rewardColumns = $this->shopRewardColumns($request);

        if (! empty($shop)) {

            if ($request->type != 'physical') {
                Shop::where('uuid', $uuid)->update(array_merge([
                    'type' => $request->type,
                    'name' => $request->name,
                    'description' => $request->description,
                    'price' => $request->price,
                    'currency' => $user->default_currency,
                    'image' => ! empty($request->image) ? $request->image : $shop->image,
                    'success_page_type' => ! empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                    'success_page_value' => ! empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                    'reward_file_type' => self::rewardFileMime($file, $request, $shop->reward_file_type),
                    'reward_file' => ! empty($file['uuid']) ? $file['uuid'] : (! empty($request->reward_file) ? $request->reward_file : $shop->reward_file),
                    'ai_generated' => $request->ai_generated ?? $shop->ai_generated,
                    'ask_question' => $request->ask_question ?? null,
                    'slot_limitation' => $request->slot_limitation ?? null,
                    'special_member_price' => $request->special_member_price ?? null,
                    'quantity_allow' => $request->quantity_allow ?? 0,
                    'payment_methods_accepted' => in_array($request->payment_methods_accepted, ['card', 'bank', 'both'], true) ? $request->payment_methods_accepted : $shop->payment_methods_accepted,
                ], $rewardColumns));
            } else {
                Shop::where('uuid', $uuid)->update(array_merge([
                    'user_id' => $user->id,
                    'type' => $request->type,
                    'name' => $request->name,
                    'description' => $request->description,
                    'price' => $request->price,
                    'currency' => $user->default_currency,
                    'image' => ! empty($request->image) ? $request->image : $shop->image,
                    'success_page_type' => ! empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                    'success_page_value' => ! empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                    'reward_file_type' => self::rewardFileMime($file, $request, $shop->reward_file_type),
                    'reward_file' => ! empty($file['uuid']) ? $file['uuid'] : (! empty($request->reward_file) ? $request->reward_file : $shop->reward_file),
                    'ai_generated' => $request->ai_generated ?? $shop->ai_generated,
                    'ask_question' => $request->ask_question ?? null,
                    'slot_limitation' => $request->slot_limitation ?? null,
                    'special_member_price' => $request->special_member_price ?? null,
                    'quantity_allow' => $request->quantity_allow ?? null,
                    'payment_methods_accepted' => in_array($request->payment_methods_accepted, ['card', 'bank', 'both'], true) ? $request->payment_methods_accepted : $shop->payment_methods_accepted,
                    'shipping_profile_id' => $request->shipping_profile_id ?? null,
                    'shipping_information' => $request->shipping_info ?? null,
                ], $rewardColumns));

                if (! empty($request->shipping_profile_id)) {
                    ShopShippingInfo::where('shop_id', $shop->id)->delete();
                } else {
                    $shipping = json_decode($request->shipping);
                    ShopShippingInfo::where('shop_id', $shop->id)->delete();
                    foreach ($shipping as $value) {
                        $ship = new ShopShippingInfo;
                        $ship->uuid = Uuid::uuid4();
                        $ship->shop_id = $shop->id;
                        $ship->country = $value->country;
                        $ship->shipping_price = $value->price;
                        $ship->save();
                    }
                }
            }

            $shop->refresh();

            // The creator may have just put stock back. Both update branches above are
            // query-builder mass updates, which fire no model events, so nothing else
            // would notice. Never throws; the scheduled sweep covers it regardless.
            app(StockWaitlistService::class)->checkRestock($shop->id);

            // An edit could swap in new media, so re-run the SFW gate — previously
            // only creation was scanned, making edit a way around moderation.
            if (! empty($request->image) && $request->image !== $oldImage) {
                CheckMediaModeration::dispatch(Shop::class, $shop->id, $shop->image, ['approved' => 0], 'product_image');
            }
            if ($shop->reward_file && $shop->reward_file !== $oldRewardFile) {
                $this->moderateRewardFile($shop);
                $this->moderateShopText($shop);
            }

            if (! empty($request->category)) {
                ShopCategory::where('shop_id', $shop->id)->delete();

                $categories = json_decode($request->category);
                $cat = UserShopCategories::whereIn('uuid', $categories)->get();
                foreach ($cat as $value) {
                    $shop_cat = new ShopCategory;
                    $shop_cat->uuid = Uuid::uuid4();
                    $shop_cat->shop_id = $shop->id;
                    $shop_cat->user_shop_categories_id = $value->id;
                    $shop_cat->save();
                }
            }

            $currency = $user->default_currency ?? 'gbp';

            // Use new gross-up flow for consistent fee calculation
            // Calculate the base amount the creator should receive (Price + VAT)
            $vatPercent = $user->vat_amount_percentage ?? 0;
            $vatAmount = $request->price * $vatPercent / 100;

            $listedPriceToGrossUp = $request->price + $vatAmount;

            // Fetch creator risk metrics for reserve calculation
            $metrics = CreatorMetric::firstOrCreate(['creator_id' => $user->uuid]);
            $reserveRate = $metrics->reserve_percent ?? 0;

            // Use new gross-up flow for consistent fee calculation
            $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $currency, $reserveRate, 'card', $user->id);

            $createpriceid = $breakdown['total_supporter_pays'];

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            $slug = strtolower(str_replace(' ', '_', $shop->name));
            // NOTE: no `default_price_data` here — that key is accepted by Stripe's product
            // CREATE endpoint only. On update the price is minted separately below and the
            // product is pointed at it with `default_price`.
            $productPayload = [
                'name' => 'Total value of item including all fees',
                'images' => [$shop->perma_link],
                'url' => env('APP_URL')."/shop/$slug/$shop->uuid",
                'metadata' => [
                    'shop_item_name' => $shop->name,
                    'creator_id' => $user->id,
                    'creator_net_amount' => (string) ($breakdown['net_to_creator'] * $multiplier),
                    'total_charge_amount' => (string) ($createpriceid * $multiplier),
                ],
            ];

            try {
                $stripe = new StripeClient(config('services.stripe.secret'));

                if ($shop->type != 'physical') {
                    if ($old_price == $shop->price) {
                        $stripe_client = $stripe->products->update($shop->stripe_product_id, [
                            'name' => 'Total value of item including all fees',
                            'images' => [$shop->perma_link],
                            'default_price' => $shop->price_id,
                            'metadata' => [
                                'shop_item_name' => $request->name ?? $shop->name,
                                'creator_id' => $user->id,
                                'creator_net_amount' => (string) ($breakdown['net_to_creator'] * $multiplier),
                                'total_charge_amount' => (string) ($createpriceid * $multiplier),
                            ],
                        ], [
                            'stripe_account' => $user->account_id,
                        ]);
                    } else {
                        $oldPriceId = $shop->price_id;

                        $newPrice = StripeControl::createPrice([
                            'currency' => $currency,
                            'unit_amount_decimal' => round($createpriceid * $multiplier, 2, PHP_ROUND_HALF_UP),
                            'product' => $shop->stripe_product_id,
                        ], $user->account_id);

                        $stripe_client = StripeControl::updateSubscription(
                            $shop->stripe_product_id,
                            $productPayload + ['default_price' => $newPrice->id],
                            $user->account_id
                        );

                        $shop->price_id = $newPrice->id;

                        if (! empty($oldPriceId) && $oldPriceId !== $newPrice->id) {
                            try {
                                $stripe->prices->update($oldPriceId, ['active' => false], [
                                    'stripe_account' => $user->account_id,
                                ]);
                            } catch (Exception $e) {
                                Log::warning('Could not deactivate old shop price', [
                                    'old_price_id' => $oldPriceId,
                                    'shop_id' => $shop->id,
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        }
                    }
                    $shop->stripe_product_id = $stripe_client->id;
                    $shop->approved = 0;
                    $shop->save();
                }

                $logs = Logs::where('edited_shop_id', $shop->id)->where('status', 'pending')->first();
                if (! empty($logs)) {
                    $logs->status = 'updated';
                    $logs->save();
                }

                // Stripe compliance: high-value listings (>£2,500 GBP-equiv) require an
                // enhanced review on every edit (held un-approved until an admin clears them).
                if (! empty($shop->price) && Helpers::priceFormat(strtoupper($shop->currency ?? 'GBP'), (float) $shop->price, 'GBP') > 2500) {
                    $shop->approved = 0;
                    $shop->save();
                }

                // Clear user caches
                app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

                return response()->json([
                    'status' => true,
                    'msg' => 'Shop Item has been updated, your upload will be approved shortly.',
                ]);
                // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Shop Item has been added, your upload will be approved shortly.");

            } catch (Exception $e) {
                // Do NOT delete the existing listing on a transient Stripe error during an
                // update — that would destroy the creator's shop item (and orphan its orders).
                return response()->json([
                    'status' => false,
                    'msg' => 'Stripe Error: '.$e->getMessage(),
                ]);
                // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
            }
        }
    }

    public function deleteShop($uuid)
    {
        $shop = Shop::withScheduled()->where('uuid', $uuid)->where('user_id', Auth::id())->first();

        if (! $shop) {
            return response()->json([
                'status' => false,
                'msg' => "Shop item not found or you don't have permission.",
            ]);
        }

        ShopCategory::where('shop_id', $shop->id)->delete();

        ShopShippingInfo::where('shop_id', $shop->id)->delete();

        ShopPayment::where('shop_id', $shop->id)->delete();

        $shop->delete();

        // Clear user caches
        $user = $shop->user;
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => 'Shop item removed successfully.',
        ]);
    }

    public function singleShopList($_slug, $uuid, $session_id = null)
    {
        $shop = Shop::where('uuid', $uuid)
            ->with(['user', 'shop_shipping_info', 'category'])
            ->first();

        if (! $shop) {
            abort(404);
        }

        $isShopOwner = Auth::check() && Auth::id() === (int) $shop->user_id;

        // Someone who already paid keeps access to their own item/receipt even
        // if the listing is later moderated, deactivated or suspended. Scope to
        // the viewer (never a bare session_id) so this can't unlock for others.
        $hasPaid = false;
        if (Auth::check()) {
            $hasPaid = ShopPayment::where('shop_id', $shop->id)
                ->where('payment_status', 'paid')
                ->where('user_id', Auth::id())
                ->exists();
        } elseif (! empty($session_id)) {
            $hasPaid = ShopPayment::where('shop_id', $shop->id)
                ->where('payment_status', 'paid')
                ->where('session_id', $session_id)
                ->exists();
        }

        // A listing held by moderation, deactivated or suspended must not be
        // reachable (or buyable) by direct link — only its owner or a prior
        // buyer may open it.
        if (! $isShopOwner && ! $hasPaid && (! $shop->approved || ! $shop->status || $shop->is_suspended)) {
            abort(404);
        }

        $opened = null;
        if (! empty($session_id)) {
            $payments = ShopPayment::where('session_id', $session_id)
                ->where('shop_id', $shop->id)
                ->first();
            if ($payments) {
                $opened = $payments->opened;
                $payments->opened = 1;
                $payments->save();
            }
        }

        if (Auth::check()) {
            $user = User::find(Auth::id());
            $member = MembershipPayment::where(function ($que) use ($user) {
                $que->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            })->whereHas('membership', function ($q) use ($shop) {
                $q->where('user_id', $shop->user_id);
            })->where('status', 'paid')->where('upcoming_payment', '>=', Carbon::now())->count();
            if ($member >= 1) {
                $shop->is_member = 1;
            } else {
                $shop->is_member = 0;
            }
        } else {
            $shop->is_member = 0;
        }

        if ($shop->is_member == 1 && ! empty($shop->special_member_price)) {
            $amount = round($shop->special_member_price, 2, PHP_ROUND_HALF_UP);
        } else {
            $amount = round($shop->price, 2, PHP_ROUND_HALF_UP);
        }

        $tax = 0;

        $vat_percentage_amount = 0;
        if (! empty($shop->user->vat_amount_percentage)) {
            $vat_percentage_amount = $amount * $shop->user->vat_amount_percentage / 100;
        }

        $card_capabilities = StripeControl::hasCardPaymentsCapability($shop->user->account_id);

        $my_purchases = null;
        if (Auth::check()) {
            $my_purchases = ShopPayment::where('shop_id', $shop->id)
                ->where('user_id', Auth::id())
                ->where('payment_status', 'paid')
                ->with('deliverable')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // Reveal the digital deliverable only to the owner or someone who has
        // actually paid for it (including the checkout we just came back from).
        $shop->entitledFor(Auth::id(), $session_id);

        // The creator model is serialised to a public page — expose only what
        // the item page renders. Without this the whole users row (email, DOB,
        // 2fa_key, ip_address, identity notes) ships to every visitor.
        if ($shop->relationLoaded('user') && $shop->user) {
            $shop->user->setVisible([
                'uuid', 'name', 'username', 'avatar_url',
                'default_currency', 'vat_amount_percentage', 'suspended_account',
            ]);
        }

        // Count the view. Runs after the visibility checks above, so a listing nobody
        // may open is never counted. The creator's own views are excluded inside the
        // tracker, and it never throws — analytics must not be why a page fails.
        app(ItemViewTracker::class)->record(request(), 'shop', $shop->id, $shop->user_id);

        // Server-side link preview. SSR is off, so an unfurler only ever sees the
        // server-rendered <head> — without this a shared item link showed the generic
        // site card instead of the product. Only for a listing the public can open.
        if ($shop->approved && $shop->status && ! $shop->is_suspended) {
            ItemShareService::applySeo($shop, 'shop', $shop->user);
        }

        $shop->share = ItemShareService::payloadFor($shop, 'shop', $shop->user);

        // Waitlist state for THIS viewer. Safe here because this page is not cached —
        // the profile/discover payloads are shared across viewers, so `is_waiting`
        // deliberately never goes into those.
        $waitlist = app(StockWaitlistService::class);
        $shop->waiting_count = $waitlist->waitingCount($shop->id);
        $shop->is_waiting = $waitlist->isWaiting($shop, Auth::user());

        return Inertia::render('shop/Item', [
            'shop' => $shop,
            'payment_id' => $session_id,
            'opened' => $opened,
            'vat_percent' => $vat_percentage_amount,
            'card_capabilities' => $card_capabilities,
            'my_purchases' => $my_purchases,
        ]);
    }

    public function shippingPrice($shop_id)
    {
        $shop = Shop::where('uuid', $shop_id)->first();
        $shipping_price = 0;
        if ($shop && $shop->type == 'physical') {
            $country = request()->query('country');
            if (! empty($country)) {
                if (! empty($shop->shipping_profile_id)) {
                    $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                        ->where('country', $country)
                        ->first();
                    if (empty($shipping)) {
                        $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                            ->where('country', 'all')
                            ->first();
                    }
                } else {
                    $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', $country)->first();
                    if (empty($shipping)) {
                        $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', 'all')->first();
                    }
                }
            }
            if (empty($shipping) || empty($country)) {
                if (! empty($shop->shipping_profile_id)) {
                    $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                        ->where('country', 'all')
                        ->first();
                } else {
                    $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', 'all')->first();
                }
            }
            $shipping_price = ! empty($shipping) ? (float) $shipping->shipping_price : 0;
        }

        return response()->json([
            'status' => true,
            'shipping_price' => $shipping_price,
        ]);
    }

    public function saveUserShopCategory(Request $request)
    {
        $request->validate([
            'category' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'alpha_dash',
            ],
        ]);

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return response()->json([
                'status' => false,
                'msg' => 'Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦',
            ]);
        }

        $categories = UserShopCategories::where('user_id', Auth::id())->get();
        foreach ($categories as $value) {
            if (strtolower($request->category) == strtolower($value->category)) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Category is already exists.',
                ]);
            }
        }

        UserShopCategories::create([
            'user_id' => Auth::id(),
            'category' => $request->category ?? null,
        ]);

        return response()->json([
            'status' => true,
            'msg' => 'Category Saved.',
        ]);
    }

    public function buyShopItem(Request $request, $shop_id)
    {
        // Stripe compliance: product orders require an account so the order can be
        // tracked and delivered (guest checkout is only allowed for Piggy Pot and Wishes).
        if (! Auth::check()) {
            return response()->json([
                'status' => false,
                'requires_login' => true,
                'message' => 'Please create an account or log in to purchase — orders need an account so they can be tracked and delivered.',
            ]);
        }

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus == true) {
            return response()->json([
                'status' => false,
                'message' => '⚠️ Please complete your card verification payment and wait for admin approval before making further payments.',
            ]);
        }

        $this->ensureTurnstileVerified($request);

        try {
            $message = request()->query('message');
            if ($message !== null && $message !== '') {
                if ($msgErr = Helpers::validateSupporterMessage($message)) {
                    return response()->json([
                        'status' => false,
                        'message' => $msgErr,
                    ]);
                }
            }

            // Only approved + active items can be purchased — blocks buying items still on
            // moderation hold or held for >£2,500 enhanced review (approved=0).
            $shop = Shop::where('uuid', $shop_id)
                ->where('approved', 1)
                ->where('status', 1)
                ->where('is_suspended', 0)
                ->first();

            if (! $shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Shop item not found.',
                ]);
            }

            // Quantity is buyer-supplied: `?quantity=0` used to make the order free
            // and a negative value defeated the stock guard entirely.
            $requestedQuantity = (int) request()->query('quantity', 1);
            if ($requestedQuantity < 1) {
                $requestedQuantity = 1;
            }
            if (! $shop->quantity_allow) {
                $requestedQuantity = 1;
            }

            // `slot_limitation` is REMAINING stock (successPayment decrements it).
            if ($shop->slot_limitation !== null) {
                if ($shop->slot_limitation <= 0) {
                    return response()->json([
                        'status' => false,
                        'message' => 'This item is currently sold out.',
                    ]);
                }
                if ($shop->slot_limitation < $requestedQuantity) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Not enough stock available. Only '.$shop->slot_limitation.' left.',
                    ]);
                }
            }

            if (! $shop->user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Creator account not found or deactivated.',
                ]);
            }

            // NEW: Check creator subscription eligibility first
            $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($shop->user);

            // Check if creator has card_payments capability
            if (! StripeControl::hasCardPaymentsCapability($shop->user->account_id)) {
                // Same rule as the subscription gate below: a refusal nobody
                // records is a lost sale the creator never hears about and no
                // admin can see.
                BlockedPaymentAlert::record(
                    $shop->user,
                    $shop->price,
                    $shop->currency ?? $shop->user->default_currency ?? 'GBP',
                    'stripe_disabled',
                );

                return response()->json([
                    'status' => false,
                    'message' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ['eligible' => false, 'status' => 'stripe_disabled']),
                ]);
            }

            if (! $subscriptionCheck['eligible']) {
                // Send notification to creator about blocked payment
                $shop->user->notify(new SubscriptionBlockedNotification($subscriptionCheck, $shop->price));
                // Recorded and counted: one lost sale is a warning, six is a reason.
                BlockedPaymentAlert::record(
                    $shop->user,
                    $shop->price,
                    $shop->currency ?? $shop->user->default_currency ?? 'GBP',
                    $subscriptionCheck['status'] ?? null,
                );

                // Log the blocked payment for subscription issues
                Log::warning('Shop payment blocked due to subscription issue', [
                    'creator_id' => $shop->user->id,
                    'creator_username' => $shop->user->username,
                    'shop_id' => $shop->id,
                    'shop_price' => $shop->price,
                    'subscription_status' => $subscriptionCheck['status'],
                    'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown',
                ]);

                // Return user-friendly error to fan
                return response()->json([
                    'status' => false,
                    'message' => app(CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null),
                ]);
            }

            // NEW: Check creator activity eligibility
            $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($shop->user);

            if (! $activityCheck['eligible']) {
                // Send notification to creator about blocked payment
                $shop->user->notify(new PaymentBlockedNotification($activityCheck, $shop->price));

                // Log the blocked payment for analytics
                Log::info('Shop payment blocked due to insufficient creator activity', [
                    'creator_id' => $shop->user->id,
                    'creator_username' => $shop->user->username,
                    'shop_id' => $shop->id,
                    'shop_price' => $shop->price,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0,
                ]);

                // Return user-friendly error to fan
                return response()->json([
                    'status' => false,
                    'message' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck),
                ]);
            }

            // Log successful activity check for analytics
            if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
                Log::info('Shop payment allowed - creator activity check passed', [
                    'creator_id' => $shop->user->id,
                    'creator_username' => $shop->user->username,
                    'shop_id' => $shop->id,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0,
                ]);
            }

            // Calculate the base amount the creator should receive (Price + Tax + VAT)
            $amount = round($shop->price, 2, PHP_ROUND_HALF_UP);

            // Check membership discount
            if (Auth::check()) {
                $user = User::find(Auth::id());
                $isMember = MembershipPayment::where(function ($que) use ($user) {
                    $que->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                })->whereHas('membership', function ($q) use ($shop) {
                    $q->where('user_id', $shop->user_id);
                })->where('status', 'paid')->where('upcoming_payment', '>=', Carbon::now())->exists();

                if ($isMember && ! empty($shop->special_member_price)) {
                    $amount = round($shop->special_member_price, 2, PHP_ROUND_HALF_UP);
                }
            }

            $amount = $amount * $requestedQuantity;

            // Add Shipping Price if physical item
            $shipping_price = 0;
            $shipping_info = null;
            if ($shop->type == 'physical') {
                $shipping_info = $request->shipping_info;
                $country = $request->query('country');
                if (! empty($country)) {
                    // First check if shop has a shipping profile
                    if ($shop->shipping_profile_id) {
                        $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                            ->where('country', $country)
                            ->first();
                        if (empty($shipping)) {
                            $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                                ->where('country', 'all')
                                ->first();
                        }
                        $shipping_price = ! empty($shipping) ? $shipping->shipping_price : 0;
                    } else {
                        // Fallback to legacy shop-specific shipping info
                        $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', $country)->first();
                        if (empty($shipping)) {
                            $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', 'all')->first();
                        }
                        $shipping_price = ! empty($shipping) ? $shipping->shipping_price : 0;
                    }
                    $shipping_price = $shipping_price * $requestedQuantity;
                }
            }

            // Add VAT if applicable
            $vatAmount = 0;
            if (! empty($shop->user->vat_amount_percentage)) {
                $vatAmount = $amount * $shop->user->vat_amount_percentage / 100;
            }

            $listedPriceToGrossUp = $amount + $vatAmount + $shipping_price;

            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                $request,
                $shop->user,
                $listedPriceToGrossUp,
                $shop->user->default_currency ?? 'GBP',
                'shop',
                true // JSON response expected
            );

            // If it's a JSON error response (blocked, step_up, login required), return it immediately
            if ($riskData instanceof JsonResponse) {
                return $riskData;
            }

            $chargeCurrency = $shop->user->default_currency ?? 'GBP';

            // Resolve requested payment method (card|bank) against listing
            // preference, progressive tiers, and creator capabilities.
            $methodResolution = CheckoutMethodResolver::resolve(
                $request->input('payment_method', 'card'),
                $shop->payment_methods_accepted ?? 'both',
                $listedPriceToGrossUp,
                $chargeCurrency,
                Auth::user(),
                request()->query('email'),
                $shop->user->account_id
            );
            if (! ($methodResolution['ok'] ?? false)) {
                return response()->json([
                    'status' => false,
                    'code' => $methodResolution['code'],
                    'message' => $methodResolution['message'],
                    'msg' => $methodResolution['message'],
                ]);
            }

            // Fetch creator risk metrics for reserve calculation
            $metrics = CreatorMetric::firstOrCreate(['creator_id' => $shop->user->uuid]);
            $reserveRate = $metrics->reserve_percent ?? 0;

            // Use new gross-up flow with the full price the creator expects to receive
            $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $chargeCurrency, $reserveRate, $methodResolution['fee_profile'], $shop->user->id);
            $applicationFeeAmount = $breakdown['application_fee'] ?? 0;

            $guestRestriction = Helpers::guestCheckoutRestriction($chargeCurrency, $breakdown['total_supporter_pays'] ?? 0);
            if ($guestRestriction) {
                return response()->json([
                    'status' => false,
                    'code' => 'AUTH_REQUIRED',
                    'reason_code' => $guestRestriction['code'],
                    'message' => 'Login required',
                    'msg' => $guestRestriction['message'],
                ]);
            }

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($chargeCurrency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
            $precision = $multiplier === 1 ? 0 : 2;

            $unitAmount = (int) round($breakdown['total_supporter_pays'] * $multiplier);

            if (! Auth::check()) {
                $logged_out_user = User::where('email', request()->query('email'))->first();
            }

            $request->validate([
                'digital_waiver' => ['required', 'accepted'],
            ]);

            $shopPaymentDetail = ShopPayment::create([
                'amount' => $amount,
                'total_paid' => (float) ($breakdown['total_supporter_pays'] ?? $listedPriceToGrossUp),
                'fee_profile' => $methodResolution['fee_profile'],
                'tax_amount' => 0,
                'vat_tax_amount' => $vatAmount,
                'shipping_amount' => $shipping_price,
                'currency' => $chargeCurrency,
                'shop_id' => $shop->id,
                'user_id' => (Auth::check()) ? Auth::id() : (! empty($logged_out_user) ? $logged_out_user->id : null),
                'name' => request()->query('from') ?? null,
                'email' => request()->query('email'),
                'message' => $message ?? null,
                'ask_question' => $shop->ask_question,
                'anonymous' => request()->query('anonymous') ?? 0,
                // The validated quantity, not the raw query value the price was
                // never calculated from.
                'quantity' => $requestedQuantity,
                'shipping_info' => $shipping_info ?? null,
                // The rates this charge was priced at. Read back by every recompute
                // path so a later change to the creator's deal cannot re-price it.
                ...Helpers::feeRateColumns($breakdown),
                // Discovery Phase 1 — this row's ledger entry is written later by
                // finance:sync-transactions, in a worker with no cookie, so the
                // source has to be persisted here while the browser is present.
                'discovery_source' => AttributionService::sourceForCreator($shop->user_id),
            ]);

            // Apply digital waiver confirmation
            Helpers::applyDigitalWaiver($shopPaymentDetail, (bool) $request->digital_waiver);
            $shopPaymentDetail->save();
            $shopPaymentDetail->refresh();

            $sessionCreate = null;
            $connectedAccountId = $shop->user->account_id;

            if ($methodResolution['fee_profile'] === 'card' && ! StripeControl::hasCardPaymentsCapability($connectedAccountId)) {
                BlockedPaymentAlert::record(
                    $shop->user,
                    $shop->price,
                    $shop->currency ?? $shop->user->default_currency ?? 'GBP',
                    'stripe_disabled',
                );

                return response()->json([
                    'status' => false,
                    'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ['eligible' => false, 'status' => 'stripe_disabled']),
                ]);
            }

            $creatorTransferAmountMinor = (int) round(round($listedPriceToGrossUp, $precision, PHP_ROUND_HALF_UP) * $multiplier);

            $metadata = Helpers::buildStripeMetadata('shop', $shopPaymentDetail, [
                'shop_item_id' => $shop->id,
                'quantity' => $shopPaymentDetail->quantity,
                'anonymous' => $shopPaymentDetail->anonymous,
                'creator_net_amount' => (string) $creatorTransferAmountMinor,
                'total_charge_amount' => (string) $unitAmount,
            ]);

            // Build session payload (platform checkout + destination transfer)
            $payload = [
                'success_url' => route('shop.success-payment', [$shopPaymentDetail->uuid]),
                'cancel_url' => route('shop.cancel-payment', [$shopPaymentDetail->uuid]),
                'line_items' => [[
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $chargeCurrency,
                        'product_data' => [
                            'name' => 'Total value of item including all fees',
                            'description' => Helpers::rewardLineDescription(
                                $shop,
                                "From @{$shop->user->username}"
                            ),
                        ],
                        'unit_amount' => $unitAmount,
                    ],
                ]],
                'mode' => 'payment',
                'payment_method_types' => $methodResolution['payment_method_types'],
                'customer_email' => $shopPaymentDetail->email ?? ($shopPaymentDetail->user->email ?? null),
                'metadata' => $metadata,
                'payment_intent_data' => [
                    'receipt_email' => $shopPaymentDetail->email ?? ($shopPaymentDetail->user->email ?? null),
                    'description' => "Shop Payment for {$shop->user->username} (Total value including all fees)",
                    'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
                    'metadata' => $metadata,
                ],
            ];

            // Check if we need to force 3DS (risk engine or £1k+ tier fallback; card sessions only)
            if ($methodResolution['fee_profile'] === 'card'
                && (in_array('FORCE_3DS', $riskData['reason_codes'] ?? []) || $methodResolution['force_3ds'])) {
                $payload['payment_method_options'] = [
                    'card' => [
                        'request_three_d_secure' => 'any',
                    ],
                ];
            }

            $sessionCreate = StripeControl::createCheckoutSession($payload, $connectedAccountId, false, $shop->user->username);

            $shopPaymentDetail->session_id = $sessionCreate->id;
            $shopPaymentDetail->save();

            // Recovery tracking. Swallows its own errors — a missed reminder costs one
            // email, a thrown exception here would cost the sale.
            AbandonedCheckoutService::record(
                $sessionCreate,
                'shop',
                $shop->user,
                $shop->id,
                $shopPaymentDetail->user_id,
                $shopPaymentDetail->email ?? null,
                (int) ($sessionCreate->amount_total ?? 0),
                $sessionCreate->currency ?? null,
                $methodResolution['fee_profile'] ?? null
            );

            try {
                Payment::firstOrCreate(
                    ['stripe_session_id' => $sessionCreate->id],
                    [
                        'creator_id' => $shop->user->uuid,
                        'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                        'amount' => app(MoneyNormalizer::class)->toGbpMinor((int) $unitAmount, strtoupper($chargeCurrency)),
                        'currency' => 'gbp',
                        'stripe_payment_intent_id' => $sessionCreate->payment_intent ?? null,
                        'status' => 'initiated',
                        'reason_codes' => $riskData['reason_codes'] ?? [],
                    ]
                );
            } catch (Exception $e) {
                Log::warning('Risk Ledger: Failed to record shop payment', [
                    'session_id' => $sessionCreate->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => true,
                'url' => $sessionCreate->url,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ]);
            // Log::error("Error in createCheckout: " . $th->getMessage());
            // throw $e->getMessage();
        }
    }

    public function successPayment($id)
    {
        $stripeid = null;

        try {
            return DB::transaction(function () use ($id, &$stripeid) {
                $stripeid = ShopPayment::with(['shop', 'user'])->where('uuid', $id)->lockForUpdate()->first();

                if (! $stripeid) {
                    Log::error("No ShopPayment found for UUID: $id");

                    /*
                     * 🚨 THE BUYER ARRIVES HERE FROM STRIPE, SO THERE IS NO
                     * "BACK".
                     *
                     * `redirect()->back()` reads the Referer, and a return from
                     * a Stripe-hosted checkout carries no same-site one — so
                     * this dropped somebody who had JUST PAID on the homepage,
                     * with a flash message that (until 22 Aug 2026) no layout
                     * rendered. From their side: they paid and the site
                     * forgot. That is the worst dead end on the platform and
                     * the one most likely to end at their bank.
                     *
                     * Their purchases page is the honest destination: whatever
                     * went wrong with this id, what they bought is listed there.
                     */
                    return redirect()->route('gifter.hub')
                        ->with('error', 'We could not match that payment reference. If money left your account, your purchase will appear here shortly — contact us if it does not.');
                }

                NotificationContext::for([
                    'context_type' => 'shop',
                    'context_id' => $stripeid->shop_id,
                    'stripe_session_id' => $stripeid->session_id,
                    'buyer_id' => $stripeid->user_id,
                    'buyer_email' => $stripeid->user->email ?? $stripeid->guest_email ?? null,
                    'creator_id' => $stripeid->shop->user_id ?? null,
                ]);

                // Delayed-settlement bank methods (SEPA/ACH): don't fulfil on the
                // redirect while the debit is still clearing — the
                // async_payment_succeeded webhook completes fulfilment later.
                if (! config('payments.instant_fulfilment', true)
                    && $stripeid->fee_profile === 'bank' && $stripeid->payment_status !== 'paid') {
                    $settled = false;
                    try {
                        $session = StripeControl::getCheckoutSession($stripeid->session_id, $stripeid->shop->user->account_id);
                        $settled = $session && ($session->payment_status ?? null) === 'paid';
                    } catch (Exception $e) {
                        // Fail closed: never fulfil an unconfirmed bank payment on a
                        // transient Stripe error — the webhook completes it later.
                        Log::error('Failed settlement check for bank shop payment', ['error' => $e->getMessage()]);
                    }

                    if (! $settled) {
                        $stripeid->update(['payment_status' => 'processing']);

                        return redirect(route('user.show', [$stripeid->shop->user->username]))
                            ->with('success', 'Payment received — your bank payment is processing. Your content unlocks as soon as it clears.');
                    }
                }

                $existingUserPayment = UserPayment::where('payment_details', json_encode($stripeid->session_id, true))->exists();

                $totalPaid = $stripeid->total_paid;
                if (! $totalPaid || $totalPaid <= 0) {
                    try {
                        $session = StripeControl::getCheckoutSession($stripeid->session_id, $stripeid->shop->user->account_id);
                        if ($session) {
                            $currencyModel = Currency::where('ISO', strtoupper($stripeid->currency ?? 'GBP'))->first();
                            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
                            $totalPaid = (float) ($session->amount_total / $multiplier);
                            $stripeid->total_paid = $totalPaid;
                            $stripeid->save();
                        }
                    } catch (Exception $e) {
                        Log::error('Failed to fetch Stripe session for shop payment', ['error' => $e->getMessage()]);
                    }
                }
                $displayAmount = $stripeid->getResolvedTotalPaidAmount();

                // Idempotency check: if UserPayment already exists, the business logic has already run.
                if ($existingUserPayment) {
                    $thankYouParams = [
                        'username' => $stripeid->shop->user->username,
                        'type' => 'shop',
                        'item_name' => $stripeid->shop->name,
                        'amount' => $displayAmount,
                        'currency' => $stripeid->currency ?? 'GBP',
                        'item_id' => $stripeid->shop->uuid,
                        'item_slug' => Str::slug($stripeid->shop->name),
                        'is_instant' => $stripeid->shop->type !== 'physical' ? '1' : '0',
                        'source' => 'shop_payments',
                        'source_id' => $stripeid->id,
                    ];

                    if (! empty($stripeid->shop->ask_question) && empty($stripeid->answer)) {
                        $thankYouParams['ask_question'] = $stripeid->shop->ask_question;
                        $thankYouParams['payment_id'] = $stripeid->id;
                    }

                    if ($stripeid->shop->type !== 'physical') {

                        if ($stripeid->shop->reward_file) {
                            $contentUrl = $stripeid->shop->reward_file;
                            if (! Str::startsWith($contentUrl, ['http://', 'https://'])) {
                                $contentUrl = 'https://ucarecdn.com/'.$contentUrl.'/';
                            }
                        }
                    }

                    return redirect()->route('thank-you', $thankYouParams)->with('success', 'Payment Successful.');
                }

                // 1. Decrement stock if applicable
                $shop = $stripeid->shop;
                if ($shop->slot_limitation !== null) {
                    $purchasedQuantity = $stripeid->quantity > 0 ? $stripeid->quantity : 1;
                    // Conditional UPDATE, so two buyers racing the last unit can
                    // never take stock below zero — the loser simply gets 0 rows.
                    $claimed = Shop::where('id', $shop->id)
                        ->where('slot_limitation', '>=', $purchasedQuantity)
                        ->decrement('slot_limitation', $purchasedQuantity);

                    if ($claimed === 0) {
                        // Money is already taken, so fulfilment still proceeds —
                        // but the creator is told they oversold and must resolve it.
                        Log::warning('Shop item oversold during payment success', [
                            'shop_id' => $shop->id,
                            'shop_payment_id' => $stripeid->id,
                            'quantity' => $purchasedQuantity,
                        ]);
                        NotificationSave::dispatch(
                            'An order came in for "'.$shop->name.'" after it sold out. Please fulfil or refund it from your orders.',
                            $shop->user,
                            $stripeid->user,
                            'Shop'
                        );
                    } else {
                        $shop->refresh();
                    }
                }

                Helpers::addGmv($stripeid->shop->user_id, (float) $stripeid->amount);

                if ($stripeid->anonymous == 1) {
                    $username = 'Anonymous user';
                } else {
                    $username = $stripeid->name ?? 'Anonymous user';
                }

                $message = $username.' just purchased your shop item '.$stripeid->shop->name;
                NotificationSave::dispatch($message, $stripeid->shop->user, $stripeid->user, 'Shop');

                $stripeid->update([
                    'payment_status' => 'paid',
                    'updated_at' => Carbon::now(),
                ]);

                $symbol = Currency::where('iso', strtoupper($stripeid->currency))->first();

                $message = $stripeid->message;
                // Calculate creator net amount using the SAME logic as buyShopItem
                $listedPriceToGrossUp = $stripeid->amount + $stripeid->vat_tax_amount + ($stripeid->shipping_amount ?? 0);

                // >£2,500 enhanced-review threshold is measured on the FULL charged amount
                // (base + VAT + shipping), not the base alone — a £2,400 item with VAT/
                // shipping over the line must still be held for admin review.
                $needsHighValueReview = Helpers::priceFormat(strtoupper($stripeid->currency ?? 'GBP'), (float) $listedPriceToGrossUp, 'GBP') > 2500;

                $currencyModel = Currency::where('ISO', strtoupper($stripeid->currency))->first();
                $digits = $currencyModel && $currencyModel->ISOdigits == 0 ? 0 : 2;
                $creatorNetAmount = ($symbol->symbol ?? '£').number_format($listedPriceToGrossUp, $digits);

                if ($stripeid->anonymous == 0) {
                    ShopBuyed::dispatch($stripeid, false, $creatorNetAmount, $symbol->symbol);
                } else {
                    ShopBuyed::dispatch($stripeid, true, $creatorNetAmount, $symbol->symbol);
                }

                // Create deliverable record for shop item
                try {
                    if (! Deliverable::where('session_id', $stripeid->session_id)->exists()) {
                        Deliverable::create([
                            'uuid' => (string) Str::uuid(),
                            'product_id' => $stripeid->shop->stripe_product_id ?? 'shop_'.$stripeid->shop->id,
                            'price_id' => $stripeid->shop->price_id,
                            'item_id' => $stripeid->shop->id,
                            'creator_id' => $stripeid->shop->user_id,
                            'gifter_id' => $stripeid->user_id,
                            'session_id' => $stripeid->session_id,
                            'deliverable_type' => $stripeid->shop->type == 'physical' ? 'shipping' : 'digital_file',
                            'product_type' => 'shop_item',
                            'transaction_amount' => $stripeid->amount,
                            // Bare, never the signed accessor — the column
                            // stays unsigned and DeliveriesController signs
                            // per click (see Shop::bareRewardFileUrl).
                            'deliverable_url' => $stripeid->shop->bareRewardFileUrl(),
                            'customer_email' => $stripeid->email ?? ($stripeid->user->email ?? null),
                            'customer_name' => $stripeid->name ?? ($stripeid->user->name ?? null),
                            'payment_status' => 'paid',
                            'payment_currency' => strtoupper($stripeid->currency ?? 'GBP'),
                            'anonymous' => $stripeid->anonymous ?? false,
                            'message' => $stripeid->message,
                            // Stripe compliance: high-value orders (>£2,500) are held for an
                            // enhanced review (admin confirms delivery before payout clears).
                            'needs_admin_review' => $needsHighValueReview,
                            'status' => ($stripeid->shop->type == 'physical' || $needsHighValueReview) ? 'pending' : 'delivered',
                            'delivered_at' => ($stripeid->shop->type == 'physical' || $needsHighValueReview) ? null : now(),
                            'metadata' => json_encode([
                                'shop_item_id' => $stripeid->shop->id,
                                'shop_item_name' => $stripeid->shop->name,
                                'type' => $stripeid->shop->type,
                                'amount' => $stripeid->amount,
                                'currency' => $stripeid->currency,
                                'creator_net_amount' => $creatorNetAmount,
                            ]),
                        ]);
                        Log::info('ShopsController: Deliverable record created for shop item', ['shop_id' => $stripeid->shop->id]);
                    }
                } catch (Exception $e) {
                    Log::error('ShopsController: Failed to create deliverable record', ['error' => $e->getMessage()]);
                }

                Log::info('SHOP EMAIL DEBUG', [
                    'payment_id' => $stripeid->id,
                    'session_id' => $stripeid->session_id,

                    'product_amount' => $stripeid->amount,
                    'shipping_amount' => $stripeid->shipping_amount,
                    'vat_tax_amount' => $stripeid->vat_tax_amount,

                    'database_total_paid' => $stripeid->total_paid,
                    'display_amount' => $displayAmount,
                    'creator_net_amount' => $creatorNetAmount,

                    'payment_status' => $stripeid->payment_status,
                    'currency' => $stripeid->currency,
                ]);
                // Queued and post-commit — see the note on the webhook's copy
                // (StripeWebhookController::processShopItemPayment). This path
                // also runs inside a DB transaction holding a lockForUpdate on
                // the shop_payments row, so an inline SMTP call held that lock
                // for the length of the mail server's response.
                ShopBuyedUser::dispatch($stripeid, $stripeid->shop->reward_file_url, $symbol->symbol)->afterCommit();

                /**************************SHOP**PWA**START****************************************************/
                // below is SHOP pwa for fans

                $CreatorName = ucfirst($stripeid->shop->user->name ?? 'A Creator');
                $title = '🛍️ Purchase Confirmed!';
                $content = $stripeid->shop->type !== 'physical'
                    ? "Your digital purchase from $CreatorName is complete and ready to access."
                    : "You bought something from $CreatorName ’s shop. They’ll process it soon.";
                $email = $stripeid->email ?? $stripeid->user->email;

                Helpers::sendNotification($title, $content, $email);

                // below is wish pwa for creator
                $FanName = ucfirst($stripeid->user->name ?? $stripeid->name ?? 'A Fan');
                $title = '📦 New Shop Order!';
                $content = $stripeid->shop->type !== 'physical'
                    ? "$FanName purchased a digital item from your shop. Delivery was completed automatically."
                    : "$FanName placed an order in your shop. Time to fulfill it!.";
                $email = $stripeid->shop->user->email;

                Helpers::sendNotification($title, $content, $email);

                /****************************SHOP**PWA**ENDS****************************************************/

                // Idempotency check for UserPayment
                $existingUserPayment = UserPayment::where('payment_details', json_encode($stripeid->session_id, true))->exists();

                if (! $existingUserPayment) {
                    $userPayment = new UserPayment;
                    $userPayment->from_user_id = $stripeid->user_id ?? null;
                    $userPayment->to_user_id = $stripeid->shop->user_id;
                    $userPayment->product_type = 'shop';
                    $userPayment->amount = $stripeid->amount;
                    $userPayment->currency = $stripeid->currency;
                    $userPayment->payment_method = 'stripe';
                    $userPayment->payment_details = json_encode($stripeid->session_id, true);
                    $userPayment->paid_at = Carbon::now();
                    $userPayment->status = 'paid';
                    $userPayment->save();
                }

                // Clear user caches
                app(UserProfileService::class)->clearUserCaches($stripeid->shop->user->username, $stripeid->shop->user->id);

                $thankYouParams = [
                    'username' => $stripeid->shop->user->username,
                    'type' => 'shop',
                    'item_name' => $stripeid->shop->name,
                    'amount' => $displayAmount,
                    'currency' => $stripeid->currency ?? 'GBP',
                    'item_id' => $stripeid->shop->uuid,
                    'item_slug' => Str::slug($stripeid->shop->name),
                    'is_instant' => $stripeid->shop->type !== 'physical' ? '1' : '0',
                    'source' => 'shop_payments',
                    'source_id' => $stripeid->id,
                ];

                if (! empty($stripeid->shop->ask_question) && empty($stripeid->answer)) {
                    $thankYouParams['ask_question'] = $stripeid->shop->ask_question;
                    $thankYouParams['payment_id'] = $stripeid->uuid;
                }

                if ($stripeid->shop->type !== 'physical') {

                    if ($stripeid->shop->reward_file) {
                        $contentUrl = $stripeid->shop->reward_file;
                        if (! Str::startsWith($contentUrl, ['http://', 'https://'])) {
                            $contentUrl = 'https://ucarecdn.com/'.$contentUrl.'/';
                        }
                    }
                }

                return redirect()->route('thank-you', $thankYouParams)->with('success', 'Payment Successful.');
            });
        } catch (Exception $e) {
            // The catch sits OUTSIDE the transaction on purpose: inside it, a
            // failure part-way through still committed (stock taken, status paid)
            // while the buyer was told the payment had failed.
            Log::error('Error in successPayment: '.$e->getMessage(), ['shop_payment_uuid' => $id]);

            $username = $stripeid?->shop?->user?->username;

            return $username
                ? redirect(route('user.show', [$username]))->with('error', 'Something went wrong during payment processing.')
                : redirect('/')->with('error', 'Something went wrong during payment processing.');
        }
    }

    public function cancelPayment($id)
    {
        $payment = ShopPayment::with('shop.user')->where('uuid', $id)->first();

        if (! $payment) {
            return redirect('/')->with('error', 'Payment not found.');
        }

        // Only the buyer may cancel their own checkout. Without this the cancel
        // URL is a public write — anyone holding it could flip an order.
        $isBuyer = (Auth::check() && (int) $payment->user_id === Auth::id())
            || (Auth::check() && $payment->email && $payment->email === Auth::user()->email);

        // A paid/processing order is never rolled back here: Stripe has already
        // taken (or is clearing) the money, so 'unpaid' would hide a real order
        // from ordersList while the creator still owes delivery.
        if ($isBuyer && in_array($payment->payment_status, [null, '', 'pending', 'unpaid'], true)) {
            $payment->payment_status = 'unpaid';
            $payment->save();
        }

        $username = $payment->shop?->user?->username;

        return $username
            ? redirect(route('user.show', [$username]))->with('error', 'Payment Cancelled.')
            : redirect('/')->with('error', 'Payment Cancelled.');
    }

    public function deactivateShop($uuid)
    {
        $shop = Shop::withScheduled()->where('uuid', $uuid)->where('user_id', Auth::id())->first();
        if (! empty($shop)) {
            if ($shop->status == 1) {
                $shop->status = 0;
                $shop->save();

                return redirect()->back()->with('success', 'Shop Deactivated successfully.');
            } else {
                $shop->status = 1;
                $shop->save();

                return redirect()->back()->with('success', 'Shop Activated successfully.');
            }
        } else {
            return redirect()->back()->with('error', 'Shop not found.');
        }
    }

    public function updateFulfillment(Request $request, $uuid)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered',
            'tracking_id' => 'nullable|string',
            'courier_name' => 'nullable|string',
            'expected_delivery_date' => 'nullable|date',
            'creator_note' => 'nullable|string',
        ]);

        $shopPayment = ShopPayment::with('shop')->where('uuid', $uuid)->firstOrFail();

        // Only the creator who OWNS the listing may fulfil its orders — this endpoint
        // had no ownership check, so any signed-in user could update anyone's order.
        if (! $shopPayment->shop || (int) $shopPayment->shop->user_id !== Auth::id()) {
            return response()->json([
                'status' => false,
                'message' => 'You do not have permission to update this order.',
            ], 403);
        }

        $deliverable = Deliverable::where('session_id', $shopPayment->session_id)
            ->where('creator_id', Auth::id())
            ->firstOrFail();

        $updateData = [
            'status' => $request->status,
            'tracking_id' => $request->tracking_id,
            'courier_name' => $request->courier_name,
            'expected_delivery_date' => $request->expected_delivery_date,
        ];

        if ($request->status === 'shipped' && ! $deliverable->shipped_at) {
            $updateData['shipped_at'] = now();
        }

        if ($request->status === 'delivered') {
            $updateData['delivered_at'] = now();
        }

        $deliverable->update($updateData);

        // Persist creator note into deliverable metadata so it is returned to the frontend
        try {
            $meta = (array) ($deliverable->metadata ?? []);
            if ($request->has('creator_note')) {
                if ($request->creator_note !== null && $request->creator_note !== '') {
                    $meta['creator_note'] = $request->creator_note;
                } else {
                    unset($meta['creator_note']);
                }
            }
            $deliverable->metadata = $meta;
            $deliverable->save();
            $deliverable->refresh();

            // Also store a copy on the ShopPayment row for easier frontend access
            try {
                $shopPayment->creator_note = $request->has('creator_note') ? $request->creator_note : $shopPayment->creator_note;
                $shopPayment->save();
            } catch (Exception $inner) {
                Log::warning('Fulfillment: Failed to save creator_note on ShopPayment', ['error' => $inner->getMessage()]);
            }
        } catch (Exception $e) {
            Log::error('Fulfillment: Failed to save creator_note', ['error' => $e->getMessage()]);
        }

        // Send PWA notification to supporter about status update
        try {
            $creatorName = ucfirst(Auth::user()->name);
            $title = '🚚 Order Update!';

            if ($request->status === 'shipped') {
                $content = "Great news! $creatorName has shipped your order. Tracking: ".($request->tracking_id ?? 'Available soon');
            } elseif ($request->status === 'delivered') {
                $content = "Your order from $creatorName has been delivered!";
            } else {
                $content = "Your order from $creatorName is now ".ucfirst($request->status).'.';
            }

            if ($request->expected_delivery_date) {
                $content .= ' Expected delivery: '.Carbon::parse($request->expected_delivery_date)->format('M d');
            }

            Helpers::sendNotification($title, $content, $deliverable->customer_email);
            Log::info('Fulfillment: Status notification (PWA) sent', ['deliverable_id' => $deliverable->id, 'status' => $request->status]);
        } catch (Exception $e) {
            Log::error('Fulfillment: Failed to send status notification', ['error' => $e->getMessage()]);
        }

        // Send Email Notification for any status update
        try {
            $gifter = $deliverable->gifter_id
                ? User::find($deliverable->gifter_id)
                : User::where('email', $deliverable->customer_email)->first();

            if (User::shouldSendEmail($gifter)) {
                Mail::to($deliverable->customer_email)
                    ->send(new ShopOrderStatusMail($deliverable, Auth::user(), $request->status));
                Log::info('Fulfillment: Status update email sent', ['deliverable_id' => $deliverable->id, 'status' => $request->status]);
            }
        } catch (Exception $e) {
            Log::error('Fulfillment: Failed to send status update email', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Fulfillment status updated successfully.',
            'deliverable' => $deliverable,
        ]);
    }

    /**
     * Get all shipping profiles for the authenticated creator
     */
    public function getShippingProfiles()
    {
        $profiles = ShippingProfile::where('user_id', Auth::id())
            ->with('zones')
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'profiles' => $profiles,
        ]);
    }

    /**
     * Save or update a shipping profile
     */
    public function saveShippingProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'zones' => 'required|array',
            'zones.*.country' => 'required|string',
            'zones.*.shipping_price' => 'required|numeric|min:0',
        ]);

        // An id belonging to another creator used to fall through to an INSERT
        // reusing their primary key — a duplicate-key 500 instead of a rejection.
        if ($request->filled('id')
            && ! ShippingProfile::where('id', $request->id)->where('user_id', Auth::id())->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'Shipping profile not found.',
            ], 404);
        }

        return DB::transaction(function () use ($request) {
            $profile = ShippingProfile::updateOrCreate(
                ['id' => $request->id, 'user_id' => Auth::id()],
                ['name' => $request->name]
            );

            // Delete old zones if updating
            $profile->zones()->delete();

            // Create new zones
            foreach ($request->zones as $zone) {
                $profile->zones()->create([
                    'country' => $zone['country'],
                    'shipping_price' => $zone['shipping_price'],
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Shipping profile saved successfully.',
                'profile' => $profile->load('zones'),
            ]);
        });
    }

    /**
     * Delete a shipping profile
     */
    public function deleteShippingProfile($id)
    {
        $profile = ShippingProfile::where('id', $id)->where('user_id', Auth::id())->firstOrFail();
        $profile->delete();

        return response()->json([
            'status' => true,
            'message' => 'Shipping profile deleted successfully.',
        ]);
    }

    public function ordersList(Request $request)
    {
        $user = Auth::user();
        $type = $request->query('type', 'sales');
        $isPurchases = $type === 'purchases';

        $search = trim((string) $request->query('search', ''));
        $statusFilter = $request->query('status', 'all');
        $perPage = min(30, max(6, (int) $request->query('per_page', 12)));

        // Base query: buyer's purchases, or the creator's own sales. Delivery
        // status lives on `deliverables` (keyed by session_id), so we leftJoin it
        // to filter/sort by status without pulling every row into memory.
        /*
         * 🚨 ALIASING A SOFT-DELETING MODEL'S TABLE BREAKS ITS OWN GLOBAL SCOPE.
         *
         * `SoftDeletingScope` qualifies with the MODEL'S TABLE NAME
         * (`getQualifiedDeletedAtColumn()`), so `ShopPayment::query()->from('shop_payments as sp')`
         * built `from shop_payments as sp where shop_payments.deleted_at is null` —
         * and in MySQL an alias REPLACES the table name, so `shop_payments.` is no
         * longer a valid reference. Every load of /shop/orders-list answered
         * **1054 "Unknown column 'shop_payments.deleted_at'"** (JAVASCRIPT-REACT-90).
         *
         * ⚠️ THE COLUMN EXISTS — this is NOT the missing-column fault that migration
         * `2026_08_21_100000_add_deleted_at_to_payment_tables` closed, and it was
         * mistaken for it once. Verified: `Schema::hasColumn('shop_payments','deleted_at')`
         * is true and the generated SQL still names the un-aliased table.
         *
         * Telling the model its table IS the alias makes the scope qualify `sp.`,
         * which is the reference the query actually has.
         */
        $aliased = (new ShopPayment)->setTable('sp');

        $base = $aliased->newQuery()
            ->from('shop_payments as sp')
            ->join('shops', 'shops.id', '=', 'sp.shop_id')
            ->leftJoin('deliverables as d', 'd.session_id', '=', 'sp.session_id')
            ->where('sp.payment_status', 'paid')
            ->when($isPurchases,
                fn ($q) => $q->where('sp.user_id', $user->id),
                fn ($q) => $q->where('shops.user_id', $user->id)
            )
            ->select('sp.*');

        // Totals are over ALL paid sales, unaffected by search/status filters.
        $totalsQuery = (clone $base);
        $allTime = $isPurchases ? 0 : (float) (clone $totalsQuery)->sum('sp.amount');
        $thirtyDays = $isPurchases ? 0 : (float) (clone $totalsQuery)
            ->where('sp.created_at', '>=', Carbon::now()->subDays(30))
            ->sum('sp.amount');

        // Search: item name, or (for sales) the buyer, (for purchases) the creator.
        if ($search !== '') {
            $base->where(function ($q) use ($search, $isPurchases) {
                $q->where('shops.name', 'like', "%{$search}%");
                if ($isPurchases) {
                    $q->orWhereExists(function ($sub) use ($search) {
                        $sub->from('users as cu')
                            ->whereColumn('cu.id', 'shops.user_id')
                            ->where(fn ($w) => $w->where('cu.name', 'like', "%{$search}%")->orWhere('cu.username', 'like', "%{$search}%"));
                    });
                } else {
                    $q->orWhere('sp.name', 'like', "%{$search}%")
                        ->orWhere('sp.email', 'like', "%{$search}%")
                        ->orWhereExists(function ($sub) use ($search) {
                            $sub->from('users as bu')
                                ->whereColumn('bu.id', 'sp.user_id')
                                ->where(fn ($w) => $w->where('bu.name', 'like', "%{$search}%")->orWhere('bu.username', 'like', "%{$search}%")->orWhere('bu.email', 'like', "%{$search}%"));
                        });
                }
            });
        }

        // Status filter — an order with no deliverable row counts as 'pending'.
        if ($statusFilter && $statusFilter !== 'all') {
            if ($statusFilter === 'pending') {
                $base->where(fn ($q) => $q->whereNull('d.status')->orWhere('d.status', 'pending'));
            } else {
                $base->where('d.status', $statusFilter);
            }
        }

        $paginator = $base->orderBy('sp.id', 'desc')->paginate($perPage);
        $orders = $paginator->getCollection()->load($isPurchases ? 'shop.user' : 'shop');

        // Batch the per-row lookups for just this page.
        $deliverables = Deliverable::whereIn('session_id', $orders->pluck('session_id')->filter()->all())
            ->get()
            ->keyBy('session_id');
        $buyers = $isPurchases
            ? collect()
            : User::whereIn('id', $orders->pluck('user_id')->filter()->unique()->all())->get()->keyBy('id');

        $formattedOrders = $orders->map(function ($order) use ($deliverables, $buyers, $isPurchases) {
            $deliverable = $deliverables->get($order->session_id);
            // Both parties are entitled to the deliverable (buyer paid, seller owns).
            $order->shop?->withDeliverable();
            if ($isPurchases) {
                $order->shop?->user?->setVisible(['uuid', 'name', 'username', 'avatar_url']);
            }
            $buyer = $isPurchases ? null : $buyers->get($order->user_id);

            $isDelayed = false;
            if ($order->shop?->type === 'physical' && ($deliverable->status ?? 'pending') !== 'delivered') {
                if (Carbon::parse($order->created_at)->addDays(7)->isPast()) {
                    $isDelayed = true;
                }
            }

            $row = [
                'id' => $order->id,
                'uuid' => $order->uuid,
                'amount' => $order->amount,
                'total_paid' => $order->total_paid,
                'tax_amount' => $order->tax_amount ?? 0,
                'vat_tax_amount' => $order->vat_tax_amount ?? 0,
                'shipping_amount' => $order->shipping_amount ?? 0,
                'currency' => $order->currency,
                'created_at' => $order->created_at,
                'shop' => $order->shop,
                'quantity' => $order->quantity,
                'shipping_info' => $order->shipping_info,
                'status' => $deliverable->status ?? 'pending',
                'is_delayed' => $isDelayed,
                'tracking_id' => $deliverable->tracking_id ?? null,
                'courier_name' => $deliverable->courier_name ?? null,
                'expected_delivery_date' => $deliverable->expected_delivery_date ?? null,
                'creator_note' => $order->creator_note,
                'metadata' => $deliverable->metadata ?? [],
                'ask_question' => $order->ask_question,
                'answer' => $order->answer,
                'message' => $order->message,
            ];

            if ($isPurchases) {
                $row['name'] = $order->shop->user->name ?? 'Unknown';
                $row['username'] = $order->shop->user->username ?? '';
                $row['avatar_url'] = $order->shop->user->avatar_url ?? null;
            } else {
                $row['name'] = $order->name ?? ($buyer->name ?? 'Anonymous');
                $row['username'] = $buyer->username ?? '';
                $row['email'] = $order->email ?? ($buyer->email ?? '');
                $row['avatar_url'] = $buyer->avatar_url ?? null;
            }

            return $row;
        })->values();

        return response()->json([
            'status' => true,
            'orders' => $formattedOrders,
            'all_time' => $allTime,
            'thirtydays' => $thirtyDays,
            'total_claims' => $paginator->total(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function answerPayment(Request $request, $payment_id)
    {
        $payment = ShopPayment::where('uuid', $payment_id)->first();

        if (! $payment && is_numeric($payment_id)) {
            $payment = ShopPayment::where('id', $payment_id)->first();
        }

        if (! $payment) {
            return response()->json([
                'status' => false,
                'message' => 'Payment not found or unauthorized.',
            ]);
        }

        if (Auth::check()) {
            if (($payment->user_id ?? null) !== Auth::id() && ($payment->email ?? null) !== Auth::user()->email) {
                return response()->json([
                    'status' => false,
                    'message' => 'Payment not found or unauthorized.',
                ]);
            }
        } else {
            if (is_numeric($payment_id)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Payment not found or unauthorized.',
                ]);
            }
        }

        if (! empty($payment->answer)) {
            return response()->json([
                'status' => false,
                'message' => 'You have already answered this question.',
            ]);
        }

        $request->validate([
            'answer' => 'required|string|max:1000',
        ]);

        $payment->answer = $request->answer;
        $payment->save();

        return response()->json([
            'status' => true,
            'message' => 'Answer submitted successfully.',
            'answer' => $payment->answer,
        ]);
    }
}
