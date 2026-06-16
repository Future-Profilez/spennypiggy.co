<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\AutoTweetWishAdd;
use App\Models\Logs;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\UserIntro;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Models\RyeProduct;
use App\Models\RyeCart;
use App\Models\RyeProductPayment;
use App\Models\ProductOrderDetail;
use App\Models\CreatorShippingAddress;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\ShopPayment;
use App\Jobs\SendThankYouMailAdmin;
use App\Jobs\SurpriseTweet;
use App\Jobs\CrowdfundTweet;
use App\Jobs\CheckoutTweet;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\TipJarTweet;
use App\Services\CreatorActivityService;
use App\Services\CreatorSubscriptionService;
use App\Services\CreatorAvailabilityMessageService;
use App\Notifications\SubscriptionBlockedNotification;
use App\Notifications\PaymentBlockedNotification;
use App\Rules\ValidSubscriptionPeriod;
use App\Services\UserProfileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Stripe\StripeClient;
use App\StripeControl;
use Ramsey\Uuid\Uuid;
use Inertia\Inertia;
use Exception;

class WishitemController extends Controller
{
    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        $this->userProfileService = $userProfileService;
        // $this->middleware('auth');
    }

    public function saveWishItem(Request $request): RedirectResponse
    {
        $request->validate([
            "wishname" => [
                "required",
                "string",
                "min:4",
                "max:255",
                new \App\Rules\NoBrandOrExpenseName,
            ],
            "price" => [
                "required",
                "numeric",
                "min:0"
            ],
            "item_url" => [
                "nullable"
            ],
            "fullfill_amount" => [
                "nullable"
            ],
            "thumbnail" => [
                "sometimes",
                "nullable"
            ],
            "subscription_period" => [
                "sometimes",
                "nullable",
            ],
            "subscription" => [
                "required",
                "integer",
                Rule::in([0, 1, 2])
            ],
            "repeat_purchase" => [
                "sometimes",
                "nullable"
            ],
            "category" => [
                "sometimes",
                "nullable"
            ]
        ]);

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return redirect()->back()->with("error", "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
        } else {
            $user = User::find(Auth::id());
            $currency = $user->default_currency ?? 'gbp';

            // Use new gross-up flow for consistent fee calculation
            $breakdown = Helpers::calculateStripeDirectChargeFlow($request->price, $currency);

            $finalTotalAmount = $breakdown['total_supporter_pays'];
            $applicationFeeAmount = $breakdown['application_fee'];
            $createpriceid = $finalTotalAmount;
            $totalTax = $applicationFeeAmount;

            $wish = WishItem::create([
                "user_id" => Auth::id(),
                'wishname' => $request->wishname,
                'price' => ceil($request->price),
                'currency' => $user->default_currency,
                'item_url' => $request->item_url != "" ? $request->item_url : null,
                'thumbnail' => $request->thumbnail ?? null,
                'subscription' => $request->subscription,
                'subscription_period' => $request->subscription_period ?? null,
                'repeat_purchase' => $request->repeat_purchase ?? 0,
                'tax_amount' => $totalTax,
                // 'category' => $request->category ?? null,
            ]);

            $wish->refresh();

            if (!empty($request->category)) {
                foreach ($request->category as $value) {
                    $wish_cat = new WishCategory();
                    $wish_cat->uuid = Uuid::uuid4();
                    $wish_cat->wish_item_id = $wish->id;
                    $wish_cat->user_category_id = $value;
                    $wish_cat->save();
                }
            }


            if ($request->subscription != 2) {
                $currencyModel = \App\Models\Currency::where('ISO', strtoupper($currency))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                $productPayload = [
                    'name' => 'Exclusive content',
                    'images' => [$wish->perma_link],
                    'default_price_data' => [
                        'currency' => strtolower($currency),
                        'unit_amount_decimal' => number_format($createpriceid * $multiplier, 0, '.', ''), // Stripe expects string or int
                    ],
                    'metadata' => [
                        'creator_id' => $user->id,
                        'wish_id' => $wish->id,
                        'wish_name' => $request->wishname ?? 'Untitled Wish',
                        'deliverable_type' => 'media_bundle',
                        'certificate' => 'true',
                        'product_type' => 'wish_onetime',
                    ],
                ];

                // Add a URL if available
                if (!empty($request->item_url)) {
                    $productPayload['url'] = $request->item_url;
                } else {
                    $productPayload['url'] = env('APP_URL') . '/' . Auth::user()->username . '?item=' . $wish->uuid;
                }

                // Create the product under the connected account
                $stripeProduct = StripeControl::createProduct($productPayload, $user->account_id);

                // Save product and price IDs to the wish
                $wish->stripe_product_id = $stripeProduct->id;
                $wish->price_id = $stripeProduct->default_price;
                $wish->save();
            }

            // Clear user caches
            $this->userProfileService->clearUserCaches($user->username, $user->id);

            return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added.");
        }
    }

    /**
     * Create A WishList Item
     *
     * @param Request $request
     * @return mixed
     */
    public function addWishItem(Request $request): RedirectResponse
    {
        // Temporary debug logging
        Log::info('Wish creation attempt', [
            'user_id' => Auth::id(),
            'request_data' => $request->except(['password', '_token']),
            'user_role' => Auth::user()?->role,
            'subscription_status' => Auth::user()?->subscription_status,
        ]);

        $request->validate([
            "wishname" => [
                "required",
                "string",
                "min:4",
                "max:255",
                new \App\Rules\NoBrandOrExpenseName,
            ],
            "price" => [
                "required",
                "numeric",
                function ($attribute, $value, $fail) {
                    // Stripe compliance: min £4.99, max £500 (GBP equivalent) for content unlocks
                    $err = Helpers::priceWithinLimits($value, Auth::user()->default_currency ?? 'gbp', 4.99, 500);
                    if ($err) {
                        $fail($err);
                    }
                },
            ],
            "item_url" => [
                "nullable"
            ],
            "fullfill_amount" => [
                "nullable"
            ],
            "thumbnail" => [
                "sometimes",
                "nullable"
            ],
            "content_file" => [
                "required", // Stripe compliance: every wish must deliver a real content file
                "string" // Uploadcare UUID
            ],
            "content_file_name" => [
                "nullable",
                "string"
            ],
            "content_file_type" => [
                "nullable",
                "string"
            ],
            "content_file_size" => [
                "nullable",
                "integer"
            ],
            // 'reward_file' => [
            //     'required'
            // ],
            "subscription" => [
                "required",
                "integer",
                Rule::in([0, 1, 2])
            ],
            "subscription_period" => [
                "required_if:subscription,1",
                new ValidSubscriptionPeriod
            ],
            "repeat_purchase" => [
                "sometimes",
                "nullable"
            ],
            "category" => [
                "sometimes",
                "nullable"
            ]
        ], [
            'subscription_period.required_if'   =>  'Please select subscription period',
            'content_file.required'             =>  'Please attach the exclusive content file the supporter will receive.',
        ]);

        // return response()->json([
        //     "data" => $request->all()
        // ]);

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return redirect()->back()->with("error", "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
        }

        // if (Helpers::checkUnsafeContent($request->thumbnail)) {
        //     return redirect()->back()->with("error", "NSFW Detected in the media content. Try alternative.");
        // }

        $user = User::find(Auth::id());
        $price = $request->price;
        $currency = $user->default_currency ?? 'gbp';

        // Use new gross-up flow for consistent fee calculation
        $breakdown = Helpers::calculateStripeDirectChargeFlow($price, $currency);

        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $applicationFeeAmount = $breakdown['application_fee'];
        $taxamount = $applicationFeeAmount;
        $createpriceid = $finalTotalAmount;

        // Handle content file UUID from Uploadcare
        $contentFile = $request->content_file; // Uploadcare UUID
        $contentFileType = $request->content_file_type;
        $contentFileName = $request->content_file_name;
        $contentFileSize = $request->content_file_size;

        $wish = WishItem::create([
            "user_id" => Auth::id(),
            'wishname' => $request->wishname,
            'price' => $price,
            'currency' => $user->default_currency,
            'item_url' => $request->item_url != "" ? $request->item_url : null,
            'thumbnail' => $request->thumbnail ?? null,
            'reward' => null,
            'content_file' => $contentFile,
            'content_file_type' => $contentFileType,
            'content_file_name' => $contentFileName,
            'content_file_size' => $contentFileSize,
            // 'reward' => $request->reward_file ?? null,
            "ai_generated" => $request->ai_generated,
            'subscription' => $request->subscription,
            'subscription_period' => $request->subscription_period ?? null,
            'repeat_purchase' => $request->repeat_purchase ?? 0,
            'tax_amount' => $taxamount,
            // 'category' => $request->category ?? null,
        ]);

        $wish->refresh();

        if (!empty($request->category)) {
            foreach ($request->category as $value) {
                $wish_cat = new WishCategory();
                $wish_cat->uuid = Uuid::uuid4();
                $wish_cat->wish_item_id = $wish->id;
                $wish_cat->user_category_id = $value;
                $wish_cat->save();
            }
        }

        // Clear user caches
        $this->userProfileService->clearUserCaches($user->username, $user->id);

        if (in_array($request->subscription, [0, 1])) {
            try {
                $currency = $user->default_currency ?? 'gbp';
                $currencyModel = \App\Models\Currency::where('ISO', strtoupper($currency))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                $productPayload = [
                    'name' => 'Exclusive content',
                    'images' => [$wish->perma_link],
                    'default_price_data' => [
                        'currency' => strtolower($currency),
                        'unit_amount_decimal' => number_format($createpriceid * $multiplier, 0, '.', ''), // Stripe expects string or int
                    ],
                    'metadata' => [
                        'creator_id' => $user->id,
                        'wish_id' => $wish->id,
                        'wish_name' => $request->wishname ?? 'Untitled Wish',
                        'deliverable_type' => $request->subscription == 1 ? 'access' : 'media_bundle',
                        'certificate' => 'true',
                        'product_type' => $request->subscription == 1 ? 'wish_subscription' : 'wish_onetime',
                    ],
                ];

                if ($request->subscription == 1) {
                    $productPayload['default_price_data']['recurring']  =   [
                        'interval'  =>  StripeControl::$periods[$request->subscription_period],
                        'interval_count'    =>  1
                    ];
                }

                // Add a URL if available
                if (!empty($request->item_url)) {
                    $productPayload['url'] = $request->item_url;
                } else {
                    $productPayload['url'] = env('APP_URL') . '/' . Auth::user()->username . '?item=' . $wish->uuid;
                }

                // Create the product under the connected account
                $product = StripeControl::createProduct($productPayload, $user->account_id);

                $wish->stripe_product_id = $product->id;
                $wish->price_id = $product->default_price;
                $wish->save();

                if ($wish->user->auto_tweet == 1) {
                    // MakeAutoTweets::dispatch($wish->user);
                    AutoTweetWishAdd::dispatch($wish);
                }
            } catch (Exception $e) {
                $wish->delete();
                return redirect(route("user.show", ["username" => Auth::user()->username, "page" => "wishes"]))->with('error', "Stripe Error: " . $e->getMessage());
            }
        }

        // Clear activity cache to ensure real-time updates
        app(CreatorActivityService::class)->clearActivityCache(Auth::user());

        return redirect(route("user.show", ["username" => Auth::user()->username, "page" => "wishes"]))->with('success', "Wish Item has been added, your upload will be approved shortly.");
    }

    public function updateWishItem(Request $request, $uuid = null)
    {
        $wish = WishItem::where('uuid', $uuid)->where('user_id', Auth::id())->firstOrFail();
        $old_wish = $wish->subscription;
        $old_wish_name = $wish->wish_name;
        $old_price_id = $wish->price_id;

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return redirect()->back()->with("error", "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
        }

        // Stripe compliance: keep price within £4.99–£500 and never strip the content file
        $effectivePrice = !empty($request->price) ? $request->price : $wish->price;
        $priceErr = Helpers::priceWithinLimits($effectivePrice, Auth::user()->default_currency ?? 'gbp', 4.99, 500);
        if ($priceErr) {
            return redirect()->back()->with('error', $priceErr);
        }
        $effectiveContent = ($request->content_file && $request->content_file !== $wish->content_file)
            ? $request->content_file
            : $wish->content_file;
        if (empty($effectiveContent)) {
            return redirect()->back()->with('error', 'Please attach the exclusive content file the supporter will receive.');
        }

        $old_price = $wish->price;
        $new_price = $request->price;
        $user = User::find(Auth::id());
        $currency = $user->default_currency ?? 'gbp';

        if (!empty($request->price)) {
            // Use new gross-up flow for consistent fee calculation
            $breakdown = Helpers::calculateStripeDirectChargeFlow($request->price, $currency);

            $finalTotalAmount = $breakdown['total_supporter_pays'];
            $applicationFeeAmount = $breakdown['application_fee'];
            $taxamount = $applicationFeeAmount;
            $price = $request->price;
            $createpriceid = $finalTotalAmount;
        } else {
            // Re-calculate with current price to ensure gross-up logic is applied if it wasn't before
            $breakdown = Helpers::calculateStripeDirectChargeFlow($wish->price, $currency);
            $taxamount = $breakdown['application_fee'];
            $price = $wish->price;
            $createpriceid = $breakdown['total_supporter_pays'];
        }
        if (!empty($wish)) {
            // Handle content file UUID from Uploadcare for update
            $contentFile = $wish->content_file;
            $contentFileType = $wish->content_file_type;
            $contentFileName = $wish->content_file_name;
            $contentFileSize = $wish->content_file_size;

            if ($request->content_file && $request->content_file !== $wish->content_file) {
                // Update with new Uploadcare UUID and metadata
                $contentFile = $request->content_file;
                $contentFileType = $request->content_file_type;
                $contentFileName = $request->content_file_name;
                $contentFileSize = $request->content_file_size;
            }

            WishItem::where('uuid', $uuid)->update([
                "user_id" => Auth::id(),
                'wishname' => $request->wishname ?? $wish->wishname,
                'price' => $price,
                'item_url' => $request->item_url != "" ? $request->item_url : $wish->item_url,
                'thumbnail' => $request->thumbnail ?? $wish->thumbnail,
                'reward' => $request->reward_file ?? $wish->reward,
                'content_file' => $contentFile,
                'content_file_type' => $contentFileType,
                'content_file_name' => $contentFileName,
                'content_file_size' => $contentFileSize,
                "ai_generated" => $request->ai_generated ?? $wish->ai_generated,
                'subscription' => $request->subscription ?? $wish->subscription,
                'subscription_period' => $request->subscription_period ?? $wish->subscription_period,
                'repeat_purchase' => $request->repeat_purchase ??
                    $wish->repeat_purchase,
                'fullfill_amount' => $request->fullfill_amount ??
                    $wish->fullfill_amount,
                'tax_amount' => $taxamount,
            ]);


            $wish->refresh();
            if (!empty($request->category)) {
                WishCategory::where('wish_item_id', $wish->id)->delete();
                foreach ($request->category as $value) {
                    $wish_cat = new WishCategory();
                    $wish_cat->uuid = Uuid::uuid4();
                    $wish_cat->wish_item_id = $wish->id;
                    $wish_cat->user_category_id = $value;
                    $wish_cat->save();
                }
            }

            // Clear user caches
            $user = User::find(Auth::id());
            $this->userProfileService->clearUserCaches($user->username, $user->id);

            $user = User::whereId(Auth::id())->first();
            $unit_amount_decimal = round($createpriceid * 100); // Stripe expects integer cents

            if (in_array($request->subscription, [0, 1])) {

                $productPayload = [
                    "name"  =>  "Exclusive content",
                    "images" => [$wish->perma_link],
                    "default_price_data"    =>  [
                        "currency"  =>  $user->default_currency,
                        "unit_amount_decimal"   => $unit_amount_decimal,
                    ],
                    "url"   =>  $request->item_url ?? env('APP_URL') . '/' . $user->username . "?item=$wish->uuid/",
                    'metadata' => [
                        'wish_name' => $wish->wishname,
                    ]
                ];

                if ($request->subscription == 1) {
                    $productPayload['default_price_data']['recurring']  =   [
                        'interval'  =>  StripeControl::$periods[$request->subscription_period],
                        'interval_count'    =>  1
                    ];
                }

                try {
                    $stripeClient = new StripeClient(env('STRIPE_SECRET_KEY'));

                    // Check if Stripe product exists, if not create a new one
                    $stripeProduct = null;
                    if (!empty($wish->stripe_product_id)) {
                        try {
                            $stripeProduct = StripeControl::getProduct($wish->stripe_product_id, $wish->user->account_id);
                        } catch (Exception $e) {
                            Log::warning('Stripe product not found during update', [
                                'wish_id' => $wish->id,
                                'stripe_product_id' => $wish->stripe_product_id,
                                'error' => $e->getMessage()
                            ]);
                            $stripeProduct = null;
                        }
                    }

                    // If product doesn't exist, create a new one
                    if (!$stripeProduct) {
                        $productPayload['metadata'] = [
                            'creator_id' => $user->id,
                            'wish_id' => $wish->id,
                            'deliverable_type' => 'media_bundle',
                            'certificate' => 'true',
                            'product_type' => 'wish_onetime',
                        ];

                        $stripeProduct = StripeControl::createProduct($productPayload, $user->account_id);

                        // Save the new product and price IDs
                        $wish->stripe_product_id = $stripeProduct->id;
                        $wish->price_id = $stripeProduct->default_price;
                        $wish->save();
                    } else {
                        // Product exists, handle price updates if needed
                        if ($old_price != $new_price || $request->subscription != $old_wish || $request->wishname != $old_wish_name) {
                            // Create new price only if product exists
                            $newPricePayload = [
                                "currency" => $user->default_currency,
                                "unit_amount_decimal" => round($createpriceid * 100, 2),
                                "product" => $wish->stripe_product_id,
                            ];

                            if ($request->subscription == 1) {
                                $newPricePayload["recurring"] = [
                                    "interval" => StripeControl::$periods[$request->subscription_period],
                                    "interval_count" => 1
                                ];
                            }

                            $newPrice = StripeControl::createPrice($newPricePayload, $wish->user->account_id);
                            $wish->price_id = $newPrice->id;

                            // Update product details
                            $productUpdatePayload = [
                                'name' => "Exclusive content",
                                'images' => [$wish->perma_link],
                                'default_price' => $newPrice->id,
                                'metadata' => [
                                    'wish_name' => !empty($request->wishname) ? $request->wishname : $wish->wishname,
                                ]
                            ];

                            $stripeProduct = StripeControl::updateSubscription($wish->stripe_product_id, $productUpdatePayload, $wish->user->account_id);

                            // Deactivate old price if it exists
                            if (!empty($old_price_id)) {
                                try {
                                    $stripeClient->prices->update($old_price_id, [
                                        'active' => false
                                    ], [
                                        'stripe_account' => $user->account_id
                                    ]);
                                } catch (Exception $e) {
                                    Log::warning('Could not deactivate old price', [
                                        'old_price_id' => $old_price_id,
                                        'error' => $e->getMessage()
                                    ]);
                                }
                            }
                        }
                    }

                    $wish->is_approved = 0;
                    $wish->save();


                    $logs = Logs::where('edited_wish_id', $wish->id)->where('status', 'pending')->first();
                    if (!empty($logs)) {
                        $logs->status = 'updated';
                        $logs->save();
                    }
                } catch (Exception $e) {
                    // $wish->delete();
                    return redirect(route("user.show", ["username" => Auth::user()->username, 'page' => 'wishes']))->with('error', "Stripe Error: " . $e->getMessage());
                }
            }
            //send email
            // SaveWishlist::dispatch($user);
            return redirect(route("user.show", ["username" => Auth::user()->username, 'page' => 'wishes']))->with('success', "Wish Item has been updated.");
        }
    }

    public function deleteWishItem($uuid)
    {
        $wishitem = WishItem::where('uuid', $uuid)->first();

        if (!$wishitem) {
            return response()->json([
                'status' => false,
                'msg' => "Wishitem not found."
            ]);
        }

        try {
            // Delete related database records first
            WishCategory::where('wish_item_id', $wishitem->id)->delete();
            UserCart::where('wish_item_id', $wishitem->id)->delete();

            $si = StripePaymentItems::where('wish_item_id', $wishitem->id)->get();

            foreach ($si as $value) {
                StripePaymentDetail::where('id', $value->stripe_payment_detail_id)->delete();
                $value->delete();
            }

            WishItemSubscription::where('wish_item_id', $wishitem->id)->delete();

            // Try to delete Stripe product if it exists
            if (!empty($wishitem->stripe_product_id)) {
                try {
                    $stripeProduct = StripeControl::getProduct($wishitem->stripe_product_id, $wishitem->user->account_id);

                    if ($stripeProduct) {
                        StripeControl::deleteProductAndPrices($stripeProduct->id, $wishitem->user->account_id);
                        Log::info('Deleted Stripe product during wish deletion', [
                            'wish_id' => $wishitem->id,
                            'stripe_product_id' => $wishitem->stripe_product_id
                        ]);
                    }
                } catch (Exception $e) {
                    Log::warning('Could not delete Stripe product during wish deletion', [
                        'wish_id' => $wishitem->id,
                        'stripe_product_id' => $wishitem->stripe_product_id,
                        'error' => $e->getMessage()
                    ]);
                    // Continue with deletion even if Stripe fails
                }
            }

            // Delete the wish item from database
            $wishitem->delete();

            // Clear user caches
            $user = User::find(Auth::id());
            $this->userProfileService->clearUserCaches($user->username, $user->id);

            Log::info('Wish item deleted successfully', [
                'wish_id' => $wishitem->id,
                'user_id' => $wishitem->user_id
            ]);

            return response()->json([
                'status' => true,
                'msg' => "Wishitem removed successfully."
            ]);
        } catch (Exception $e) {
            Log::error('Error deleting wish item', [
                'wish_id' => $wishitem->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'msg' => "Error deleting wish item: " . $e->getMessage()
            ]);
        }
    }

    public function saveUserCategory(Request $request)
    {
        // echo "hello";
        // dd($request->all());
        try {

            $request->validate([
                "category" => [
                    "required",
                    "string",
                    "min:3",
                    "max:30",
                    "alpha_dash"
                ],
            ]);

            $blockedWord = Helpers::checkBlockData($request);
            if ($blockedWord !== false) {
                return response()->json([
                    'status' => false,
                    'msg' => "The word or emoji '{$blockedWord}' is not allowed as per our policies.",
                ]);
            }

            $categories = UserCategory::where('user_id', Auth::id())->get();
            foreach ($categories as $value) {
                if (strtolower($request->category) == strtolower($value->category)) {
                    return response()->json([
                        'status' => false,
                        'msg' => "Category already exists."
                    ]);
                }
            }

            UserCategory::create([
                "user_id" => Auth::id(),
                'category' => $request->category ?? null,
            ]);

            // Clear user caches
            $user = User::find(Auth::id());
            $this->userProfileService->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => "Category Saved."
            ]);
        } catch (Exception $e) {
            Log::error('Error saving user category', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'status' => false,
                'msg' => "Error saving category: " . $e->getMessage()
            ]);
        }
    }

    public function discover_all_wishes($order, $type, $price)
    {
        $tag = request()->query('tag') ? str_replace('-', ' ', request()->query('tag')) : false;
        $query = WishItem::whereNull('deleted_at')->where('is_approved', 1)
            ->with(['user' => function($q) {
                $q->select(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'role', 'gender', 'suspended_account']);
            }])
            ->whereHas('user', function ($q) use ($tag) {
            $q->whereNull('deleted_at')
                ->where('stripe_details_submitted', 1)
                ->where('suspended_account', 0);
            if ($tag) {
                $q->whereJsonContains('creator_category', $tag);
            }
        });

        // return $query->get();

        if ($order === 'new') {
            $query->latest();
        } elseif ($order === 'trending' && method_exists(WishItem::class, 'scopeTrending')) {
            $query->trending();
        }

        $priceRanges = [
            '5to10' => [4.99, 9.99],
            '10to30' => [9.99, 29.99],
            '30to50' => [29.99, 49.99],
            '50to100' => [49.99, 99.99],
        ];

        if (isset($priceRanges[$price])) {
            $query->whereBetween('price', $priceRanges[$price]);
        } elseif ($price === '100plus') {
            $query->where('price', '>', 99.99);
        }

        $subscriptionTypes = [
            'subscription' => 1,
            'crowdfund' => 2,
            'single' => 0,
        ];
        if (isset($subscriptionTypes[$type])) {
            $query->where('subscription', $subscriptionTypes[$type]);
        }

        // Pagination
        $wishes = $query->paginate(30);

        $result = [
            'success' => true,
            'wishes' => $wishes,
            'last_page' => $wishes->lastPage(),
            'current_page' => $wishes->currentPage(),
            'total' => $wishes->total(),
            'per_page' => $wishes->perPage(),
        ];
        return response()->json($result);
    }

    public function discover_all_creators($order, $gender)
    {
        $page = request()->get('page', 1);
        $cacheKey = "discover_creators_intros_{$order}_{$gender}_{$page}";

        $intros = \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($order, $gender) {
            $subQuery = UserIntro::selectRaw('MAX(id) as latest_id')
                ->whereNull('deleted_at')
                ->where('approved', 1)
                ->groupBy('user_id');

            $query = UserIntro::joinSub($subQuery, 'latest_intros', function ($join) {
                $join->on('user_intros.id', '=', 'latest_intros.latest_id');
            })
                ->with(['user' => function ($q) use ($gender) {
                    $q->select(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'role', 'gender', 'suspended_account'])
                        ->where('suspended_account', 0)
                        ->whereNotNull('username')
                        ->where('username', '!=', '');
                    if ($gender != 'all') {
                        $q->where('gender', $gender);
                    }
                }])
                ->select('user_intros.*'); // make sure we select proper columns

            // Double-check to ensure we only get intros with valid users
            $query->whereHas('user', function ($q) use ($gender) {
                $q->whereNull('deleted_at')
                    ->where('suspended_account', 0)
                    ->where('username', '!=', '');
                if ($gender != 'all') {
                    $q->where('gender', $gender);
                }
            });

            if ($order === 'new') {
                $query->orderBy('user_intros.created_at', 'desc');
            }

            $paginated = $query->paginate(30);

            // Filter out any intro records where user is still null (safety check)
            $filteredIntros = $paginated->getCollection()->filter(function ($intro) {
                return $intro->user !== null && !empty($intro->user->username);
            })->map(function ($intro) {
                // Map the data to a simple array to prevent heavy User model serialization (appends)
                return [
                    'id' => $intro->id,
                    'uuid' => $intro->uuid,
                    'poster_url' => $intro->poster_url,
                    'perma_link' => $intro->perma_link,
                    'user' => [
                        'id' => $intro->user->id,
                        'name' => $intro->user->name,
                        'username' => $intro->user->username,
                        'role' => $intro->user->role,
                        'profile_status_lock' => $intro->user->profile_status_lock,
                        'avatar_url' => $intro->user->avatar_url,
                    ]
                ];
            })->values();
            
            // To ensure we don't serialize the heavy models, we replace the paginator's collection with the mapped array.
            $paginated->setCollection($filteredIntros);

            return [
                'current_page' => $paginated->currentPage(),
                'data' => $filteredIntros->toArray(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ];
        });

        return response()->json([
            'success'       => true,
            'intro'         => $intros,
            "last_page"     => $intros['last_page'],
            "current_page"  => $intros['current_page'],
            "total"         => $intros['total'],
            "per_page"      => $intros['per_page'],
        ]);
    }

    public function all_creators_categories()
    {
        $categories = User::whereNotNull('creator_category')
            ->whereHas('wishItems', function ($query) {
                $query->where('is_approved', 1);
            })
            ->where('suspended_account', 0)
            ->pluck('creator_category')
            ->map(function ($item) {
                return json_decode($item, true);
            })
            ->flatten()
            ->unique()
            ->values();
        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    public function wishItems(Request $request): RedirectResponse
    {
        UserCategory::create([
            "user_id" => Auth::id(),
            'category' => $request->category ?? null,
        ]);
        return back()->with('success', 'Category Saved.');
    }

    public function categoryItems($category, $user_id)
    {
        $query = WishCategory::orderBy('created_at', 'DESC');
        if ($category != 'all') {
            $query->where('user_category_id', $category);
        }
        $query->whereHas('wish', function ($q) use ($user_id) {
            $q->where('user_id', $user_id);
        })->pluck('wish_item_id');
        $user = User::where('id', $user_id)->where('suspended_account', 0)->first();
        return redirect(route('user.show', ['username', $user->username, 'filter' => true]));
        // return response()->json(["items" => $items])->header('Content-Type', 'application/json');
    }

    public function addToCart($uuid, $device_id, $sub, $amount = null)
    {

        if (Helpers::checkGifterCardVerificationStatus()) {
            return response()->json([
                'success' => false,
                'msg'     => "⚠️ Please complete your card verification payment and wait for admin approval before making further payments."
            ]);
        }

        $currency = request()->cookie('currency')
            ? strtolower(request()->cookie('currency'))
            : 'gbp';

        $amount = round((float) $amount, 2, PHP_ROUND_HALF_UP);
        $wishitem = WishItem::where('uuid', $uuid)->firstOrFail();

        // ✅ NEW: Check creator subscription eligibility first
        $subscriptionCheck = app(\App\Services\CreatorSubscriptionService::class)->validateCreatorSubscription($wishitem->user);

        if (!$subscriptionCheck['eligible']) {
            return response()->json([
                'success' => false,
                'msg' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
            ]);
        }

        // ✅ Prevent user from buying own item
        if (Auth::check() && Auth::id() == $wishitem->user_id) {
            return response()->json([
                "success" => false,
                "msg"     => "You are not able to add your own item to your cart.",
            ]);
        }

        // ✅ Prevent duplicate one-time purchase
        if (Auth::check()) {
            $payment = StripePaymentItems::where('wish_item_id', $wishitem->id)
                ->whereHas('payment', fn($q) => $q->where('user_id', Auth::id()))
                ->first();

            if ($wishitem->subscription == 0 && $wishitem->repeat_purchase == 0 && $payment) {
                return response()->json([
                    "success" => false,
                    "msg"     => "You can pay only once for this wish.",
                ]);
            }
        }

        // ✅ Find existing cart item for this user/device with proper filtering
        $cart = UserCart::where('wish_item_id', $wishitem->id)
            ->where('country', 'global')
            ->where('status', 1) // Only look for active cart items
            ->when(Auth::check(), fn($q) => $q->where('user_id', Auth::id())->whereNull('device_id'))
            ->when(!Auth::check(), fn($q) => $q->where('device_id', $device_id)->whereNull('user_id'))
            ->first();

        if (!Auth::check()) {
            $ownerCurrency = strtoupper($wishitem->user->default_currency ?: 'GBP');
            $vatPercent = (float) ($wishitem->user->vat_amount_percentage ?? 0);

            $supporterPays = function (float $amount) use ($ownerCurrency, $vatPercent): float {
                $amountWithVat = $amount + (($amount * $vatPercent) / 100);
                $breakdown = Helpers::calculateStripeDirectChargeFlow($amountWithVat, $ownerCurrency);
                return (float) ($breakdown['total_supporter_pays'] ?? $amountWithVat);
            };

            $newItemAmount = (float) $wishitem->price;
            if ((int) $wishitem->subscription === 2) {
                $newItemAmount = (float) Helpers::priceFormat($currency, $amount, $ownerCurrency);
            }

            $existingItems = UserCart::where('owner_id', $wishitem->user_id)
                ->where('country', 'global')
                ->where('status', 1)
                ->where('wish_item_id', '!=', $wishitem->id)
                ->where('device_id', $device_id)
                ->whereNull('user_id')
                ->get(['amount', 'quantity']);

            $existingTotal = 0.0;
            foreach ($existingItems as $it) {
                $existingTotal += $supporterPays((float) $it->amount) * (int) ($it->quantity ?? 1);
            }

            $totalAfterAdd = $existingTotal + $supporterPays($newItemAmount);

            $guestRestriction = Helpers::guestCheckoutRestriction($ownerCurrency, $totalAfterAdd);
            if ($guestRestriction) {
                return response()->json([
                    'success' => false,
                    'code' => 'AUTH_REQUIRED',
                    'reason_code' => $guestRestriction['code'],
                    'message' => 'Login required',
                    'msg' => $guestRestriction['message'],
                ]);
            }
        }

        // ✅ Calculate product details (refactored block)
        $calculateProduct = function ($wishitem, $currency, $amount, $accountId = null) {
            $vatPercent = (float) ($wishitem->user->vat_amount_percentage ?? 0);
            $basePrice = (float) $wishitem->price;
            $vatAmount = ($basePrice * $vatPercent) / 100;
            $priceWithVat = $basePrice + $vatAmount;

            $itemCurrency = $wishitem->currency ?: ($wishitem->user->default_currency ?: 'GBP');
            $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $itemCurrency);

            if ($wishitem->subscription == 2) {
                // For crowdfunding, we need to calculate the gross-up total for the requested amount
                $price = Helpers::priceFormat($currency, $amount, $itemCurrency);
                $vatAmountCrowdfund = ($price * $vatPercent) / 100;
                $priceWithVatCrowdfund = $price + $vatAmountCrowdfund;

                // Use new gross-up flow for consistent fee calculation
                $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVatCrowdfund, $itemCurrency);

                $total = $breakdown['total_supporter_pays'];
                $tax = $breakdown['total_fees'];

                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripeProduct = $stripe->products->create([
                    'name'               => 'Exclusive content',
                    'images'             => [$wishitem->perma_link],
                    "default_price_data" => [
                        "currency"           => "gbp",
                        "unit_amount_decimal" => round($total * 100, 0)
                    ],
                    'metadata' => [
                        'wish_name' => $wishitem->wishname,
                        'product_type' => 'wish_crowdfund',
                        'creator_id' => $wishitem->user->id,
                        'wish_id' => $wishitem->id,
                        'creator_net_amount' => $breakdown['net_to_creator'],
                    ]
                ], $accountId ? ['stripe_account' => $accountId] : []);

                return [$price, $tax, $stripeProduct->id];
            } elseif ($wishitem->subscription == 0) {
                return [$wishitem->price, $breakdown['total_fees'], $wishitem->stripe_product_id];
            } else {
                return [$wishitem->price, $breakdown['total_fees'], null];
            }
        };

        [$fullfillAmount, $tax, $priceId] = $calculateProduct(
            $wishitem,
            $currency,
            $amount,
            $wishitem->user->account_id
        );

        if ($cart) {
            // $cart->quantity      = $cart->quantity + 1;
            $cart->quantity      = 1;
            $cart->status        = 1; // Ensure it stays active
            $cart->is_subscribed = ($sub == 'onetime' || $sub == false) ? 0 : 1;
            $cart->amount        = $fullfillAmount;
            $cart->tax           = $tax;
            $cart->priceid       = $priceId;
            $cart->country       = 'global';
            $cart->updated_at    = now();

            $cart->save();
        } else {
            $cartData = [
                "user_id"      => Auth::check() ? Auth::id() : null,
                "device_id"    => !Auth::check() ? $device_id : null,
                "owner_id"     => $wishitem->user_id,
                'wish_item_id' => $wishitem->id,
                'quantity'     => 1,
                'status'       => 1, // CRITICAL: Always set status to 1 (active)
                'amount'       => $fullfillAmount,
                'tax'          => $tax,
                'country'      => 'global', // CRITICAL: Always set country
                'is_subscribed' => ($sub == false || $sub == 'onetime') ? 0 : 1,
                'priceid'      => $priceId,
            ];
            try {
                $cart = UserCart::create($cartData);
            } catch (\Exception $e) {
                Log::error('Cart creation failed', [
                    'error' => $e->getMessage(),
                    'cart_data' => $cartData,
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        }

        // ✅ Verify cart was saved correctly
        $cart->refresh(); // Reload from database to verify
        if ($cart->status !== 1) {
            Log::error('Cart status inconsistency detected', [
                'cart_id' => $cart->id,
                'expected_status' => 1,
                'actual_status' => $cart->status
            ]);
        }

        // ✅ Always return consistent response
        Log::info('Cart item operation completed', [
            'cart_id'     => $cart->id,
            'cart_uuid'   => $cart->uuid,
            'user_id'     => $cart->user_id,
            'device_id'   => $cart->device_id,
            'wish_item_id' => $cart->wish_item_id,
            'final_status' => $cart->status
        ]);

        return response()->json([
            "success"   => true,
            "added"     => true,
            "cart_uuid" => $cart->uuid,
            "msg"       => "Item added to cart.",
        ]);
    }


    /*x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x******x******x*****x******x*****x*****x******x******x******x******x******x*****x
     *
     * Rye create rye product and store in the database
     *
     * @return Response
     */
    public function createRyeProduct(Request $request)
    {
        $request->validate([
            'url' => 'required',
        ]);

        $user = Auth::user();
        // Extract the URL from the request (assuming it's passed as a query parameter)
        $url = $request->input('url');  // You can change this as per your need
        $checkProductId = RyeProduct::where('creator_id', Auth::id())->where('product_id', $url['id'])->exists();
        // dd($url);
        if ($checkProductId) {
            return response()->json(['status' => false, 'message' => 'Product Already Added.']);
        }

        // Create a new product on Stripe
        $productPayload = [
            "name"  =>  $url['title'],
            "images" => [$url['images'][0]['url']],
            "default_price_data"    =>  [
                "currency"  =>  $url['price']['currency'],
                "unit_amount_decimal"   => $url['price']['value'],
            ],
            "url"   => env('APP_URL') . "/gift-item/$url[id]",
        ];

        $product = StripeControl::createProduct($productPayload, $user->account_id);
        $ryeProducts = new RyeProduct();
        $ryeProducts->creator_id = Auth::id();
        $ryeProducts->product_id = $url['id'];
        $ryeProducts->stripe_product_id = $product->id;
        $ryeProducts->details = json_encode($url, true);
        if ($ryeProducts->save()) {
            return response()->json(['status' => true, 'message' => 'Product Added Successfully.']);
        }
    }

    /**
     * rye delete and restore product from database
     *
     */
    public function deleteAndRestoredRyeProduct($uuid)
    {
        // Find the product, including soft-deleted ones
        $ryeProduct = RyeProduct::withTrashed()->where('uuid', $uuid)->where('creator_id', Auth::id())->first();

        if (!$ryeProduct) {
            return response()->json(['status' => false, 'message' => 'Product not found']);
        }

        if ($ryeProduct->trashed()) {
            // If the product is deleted, restore it
            $ryeProduct->restore();
            return response()->json(['status' => true, 'message' => 'Product Enabled successfully']);
        } else {
            // Otherwise, soft delete it
            $ryeProduct->delete();
            return response()->json(['status' => true, 'message' => 'Product Disabled successfully']);
        }
    }

    /**
     *
     * Rye product functionality starts
     *
     * Rye create cart product for rye into our site
     *
     * @return Response
     */
    public function createCart(Request $request)
    {
        try {
            $userId = Auth::id();

            // Prevent user from adding their own gift item
            if ($userId === (int) $request->creator_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'User cannot add their own gift item'
                ], 403);
            }

            // Prepare data
            $cartData = [
                'user_id' => $userId,
                'creator_id' => $request->creator_id,
                'cart_id' => $request->cart_id,
            ];

            // Use firstOrNew to find or create a new instance
            $cart = RyeCart::firstOrNew($cartData);

            // Update cart details only if it's different to avoid unnecessary writes
            $newCartDetails = json_encode($request->data, true);
            if ($cart->exists && $cart->cart_details === $newCartDetails) {
                return response()->json([
                    'status' => true,
                    'message' => 'Cart item is already added'
                ]);
            }

            // Update or create the cart item
            $cart->cart_details = $newCartDetails;
            $cart->save();

            return response()->json([
                'status' => true,
                'message' => $cart->wasRecentlyCreated ? 'Added to Cart' : 'Updated Cart Item'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rye check rye cart exist or not
     *
     * @return Response
     */
    public function checkCartExist($creator_id): JsonResponse
    {
        $userId = Auth::id();

        // Fetch only necessary fields using `pluck()` (more efficient than `select()->first()`)
        $cartId = RyeCart::where([
            'user_id' => $userId,
            'creator_id' => $creator_id
        ])->value('cart_id');

        return response()->json([
            'status' => (bool) $cartId,
            'message' => $cartId ? 'Cart data found' : 'Cart not found',
            'cart_id' => $cartId,
        ]);
    }

    /**
     * Rye get all carts products details of rye
     *
     * @return Response
     */
    public function getCartDetails(): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => false,
                'message' => 'User not authenticated',
                'data' => []
            ], 401);
        }

        $cartDetails = RyeCart::with('creator')->where('user_id', Auth::id())
            ->select(['cart_id', 'creator_id', 'cart_details'])



            ->get()
            ->map(function ($cart) {
                // Decode the JSON data in cart_details
                $cartData = json_decode($cart->cart_details, true);

                // Check if cart_details is null or 'stores' is empty/missing
                if (is_null($cart->cart_details) || empty($cartData['cart']['stores'])) {
                    return null; // Skip this entry
                }

                return $cart;
            })
            ->filter() // Remove null entries from the collection
            ->values() // Reset array keys
            ->toArray(); // Convert to array for optimized response

        return response()->json([
            'status' => !empty($cartDetails), // Returns true if data exists, false otherwise
            'message' => !empty($cartDetails) ? 'Cart data retrieved successfully' : 'No cart data found',
            'data' => !empty($cartDetails) ? $cartDetails : null
        ]);
    }

    /**
     * Rye remove cart from rye cart
     *
     * @return Response
     */
    public function removeCart($cart_id)
    {
        $userId = Auth::id();
        $deleted = RyeCart::where('user_id', $userId)
            ->where('cart_id', $cart_id)
            ->delete(); // Returns the number of deleted rows

        // return Inertia::render('feed/AddGift');
        return response()->json([
            'status' => true,
            'message' => $deleted ? 'Cart item deleted successfully' : 'Cart item not found'
        ]);
    }

    /**
     * Rye create store address for creator on rye
     *
     * @return Response
     */
    private function safeEncrypt(?string $value): ?string
    {
        return $value ? Crypt::encryptString($value) : null;
    }

    public function creatorStoreAddress(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'first_name'     => 'nullable|string|max:255',
                'last_name'      => 'nullable|string|max:255',
                'phone'          => 'nullable|digits_between:8,15',
                'address_1'      => 'nullable|string|max:255',
                'address_2'      => 'nullable|string|max:255',
                'city'           => 'nullable|string|max:255',
                'province_code'  => 'nullable|string|size:3',
                'country_code'   => 'nullable|string|size:2',
                'postal_code'    => 'nullable|digits_between:4,10',
            ]);

            $creatorId = Auth::id();

            // Only encrypt non-empty values
            $encryptIfNotEmpty = function ($value) {
                if (empty($value)) {
                    return null;
                }
                return $this->safeEncrypt($value);
            };

            CreatorShippingAddress::updateOrCreate(
                ['creator_id' => $creatorId],
                [
                    'first_name'    => $encryptIfNotEmpty($validatedData['first_name'] ?? null),
                    'last_name'     => $encryptIfNotEmpty($validatedData['last_name'] ?? null),
                    'phone'         => $encryptIfNotEmpty($validatedData['phone'] ?? null),
                    'address_1'     => $encryptIfNotEmpty($validatedData['address_1'] ?? null),
                    'address_2'     => $encryptIfNotEmpty($validatedData['address_2'] ?? null),
                    'city'          => $encryptIfNotEmpty($validatedData['city'] ?? null),
                    'province_code' => $encryptIfNotEmpty($validatedData['province_code'] ?? null),
                    'country_code'  => $encryptIfNotEmpty($validatedData['country_code'] ?? null),
                    'postal_code'   => $encryptIfNotEmpty($validatedData['postal_code'] ?? null),
                ]
            );

            return response()->json([
                'status'  => true,
                'message' => 'Address stored successfully',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Something went wrong: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rye get creator store address
     *
     * @return Response
     */
    public function getCreatorStoreAddress()
    {
        $creatorId = Auth::id();
        $creatorAddress = CreatorShippingAddress::where('creator_id', $creatorId)->first();

        if (!$creatorAddress) {
            return response()->json([
                'status' => false,
                'message' => 'Creator address not found',
            ], 404);
        }

        // Helper function to safely decrypt values
        $safeDecrypt = function ($value) {
            if (empty($value) || is_null($value)) {
                return '';
            }

            try {
                // Check if the value is already decrypted (not in encrypted format)
                // Encrypted values typically start with "eyJpdiI6" or similar
                if (!str_starts_with($value, 'eyJpdiI6')) {
                    return $value;
                }

                $decrypted = Crypt::decryptString($value);
                return $decrypted ?: '';
            } catch (\Exception $e) {
                Log::error('Decryption failed: ' . $e->getMessage());
                // If decryption fails, it might be a plain text value
                return $value ?: '';
            }
        };

        // Create a new array/object with decrypted values
        $decryptedData = [
            'id' => $creatorAddress->id,
            'creator_id' => $creatorAddress->creator_id,
            'first_name' => $safeDecrypt($creatorAddress->first_name),
            'last_name' => $safeDecrypt($creatorAddress->last_name),
            'phone' => $safeDecrypt($creatorAddress->phone),
            'address_1' => $safeDecrypt($creatorAddress->address_1),
            'address_2' => $safeDecrypt($creatorAddress->address_2),
            'city' => $safeDecrypt($creatorAddress->city),
            'province_code' => $safeDecrypt($creatorAddress->province_code),
            'country_code' => $safeDecrypt($creatorAddress->country_code),
            'postal_code' => $safeDecrypt($creatorAddress->postal_code),
            'created_at' => $creatorAddress->created_at,
            'updated_at' => $creatorAddress->updated_at,
        ];

        return response()->json([
            'status' => true,
            'message' => 'Creator address retrieved successfully',
            'data' => $decryptedData,
        ]);
    }

    /**
     * Rye handle rye product payment and return the payment url
     *
     * @return Response
     */
    public function handleRyeProductPayment(Request $request)
    {
        $this->ensureTurnstileVerified($request);

        $request->validate([
            'digital_waiver' => ['required', 'accepted'],
        ]);

        $user = Auth::user(); // or $requestingUser if handling guests

        if (empty($user->stripe_id)) {
            $stripeCustomer = \Stripe\Customer::create([
                'email' => $user->email,
                'name' => $user->name ?? null,
            ]);

            $user->stripe_id = $stripeCustomer->id;
            if ($user instanceof User) {
                $user->save();
            }
        }

        // $request->validate([
        //     'country' => 'required|string',
        //     'street_address' => 'required|string',
        //     'city' => 'required|string',
        //     'state' => 'required|string',
        //     'postal_code' => 'required|integer|digits_between:4,8',
        // ]);

        try {
            $orderDetails = RyeCart::with('creator', 'user')->where([
                'cart_id' => $request->cart_id,
                'creator_id' => $request->creator_id
            ])->first();

            if (!$orderDetails) {
                return response()->json([
                    'status' => 'falses', // set falses because it is showing error on frontend need to fix later
                    'message' => 'Order details not found.',
                ], 404);
            }

            if (!$orderDetails->creator) {
                return response()->json([
                    'status' => false,
                    'message' => 'Creator account not found or deactivated.'
                ], 404);
            }

            // Check creator subscription eligibility
            $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($orderDetails->creator);

            if (!$subscriptionCheck['eligible']) {
                // Send notification to creator about blocked payment
                $orderDetails->creator->notify(new SubscriptionBlockedNotification($subscriptionCheck, $request->amount ?? 0));

                // Log the blocked payment for subscription issues
                Log::warning('Rye product payment blocked due to subscription issue', [
                    'creator_id' => $orderDetails->creator->id,
                    'creator_username' => $orderDetails->creator->username,
                    'cart_id' => $request->cart_id,
                    'subscription_status' => $subscriptionCheck['status'],
                    'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown'
                ]);

                // Return user-friendly error to fan
                return response()->json([
                    'status' => false,
                    'message' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
                ]);
            }

            // NEW: Check creator activity eligibility
            $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($orderDetails->creator);

            if (!$activityCheck['eligible']) {
                // Send notification to creator about blocked payment
                $orderDetails->creator->notify(new PaymentBlockedNotification($activityCheck, ($request->amount ?? 0) / 100));

                // Log the blocked payment for analytics
                Log::info('Rye product payment blocked due to insufficient creator activity', [
                    'creator_id' => $orderDetails->creator->id,
                    'creator_username' => $orderDetails->creator->username,
                    'cart_id' => $request->cart_id,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0
                ]);

                // Return user-friendly error to fan
                return response()->json([
                    'status' => false,
                    'message' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
                ]);
            }

            // Log successful activity check for analytics
            if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
                Log::info('Rye product payment allowed - creator activity check passed', [
                    'creator_id' => $orderDetails->creator->id,
                    'creator_username' => $orderDetails->creator->username,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0
                ]);
            }

            $chargeCurrency = strtolower($orderDetails->creator->default_currency ?? 'usd');
            $totalAmount = 0;
            $cartData = is_string($orderDetails->cart_details) ? json_decode($orderDetails->cart_details, true) : $orderDetails->cart_details;
            $cartLines = data_get($cartData, 'cart.stores.0.cartLines', []);

            if (empty($cartLines)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Cart is empty.',
                ], 422);
            }

            foreach ($cartLines as $cartLine) {
                $quantity = data_get($cartLine, 'quantity', 1);
                $unitPrice = data_get($cartLine, 'product.price.value', 0); // Price in cents
                $productId = data_get($cartLine, 'product.id', '');

                if (!$productId || $unitPrice <= 0) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Invalid product details in cart.',
                    ], 422);
                }

                $totalAmount += ($unitPrice * $quantity);
            }

            if ($totalAmount <= 0) {
                return response()->json([
                    'status' => false,
                    'message' => 'Total amount must be greater than zero.',
                ], 422);
            }

            if (empty($orderDetails->creator->account_id)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Stripe account details are missing.',
                ], 422);
            }

            // Check if creator has card_payments capability to determine payment flow
            $hasCardPayments = StripeControl::hasCardPaymentsCapability($orderDetails->creator->account_id);

            if (!$hasCardPayments) {
                return response()->json([
                    'status' => false,
                    'message' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ["eligible" => false, "status" => "stripe_disabled"])
                ], 422);
            }

            // Use gross-up flow helper in creator's currency
            $basePriceStore = $totalAmount / 100; // Convert cents to major unit
            $basePrice = Helpers::priceFormat('usd', $basePriceStore, $chargeCurrency);
            $breakdown = Helpers::calculateStripeDirectChargeFlow($basePrice, $chargeCurrency);

            $finalTotalAmount = $breakdown['total_supporter_pays'];
            $applicationFeeAmount = $breakdown['application_fee'];
            $creatorNetAmount = $breakdown['net_to_creator'];

            // Handle zero-decimal currencies
            $multiplier = Helpers::isZeroDecimalCurrency($chargeCurrency) ? 1 : 100;

            // Single line item hiding all fees
            $lineItems = [
                [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $chargeCurrency,
                        'product_data' => [
                            'name' => "Exclusive content",
                        ],
                        'unit_amount' => round($finalTotalAmount * $multiplier),
                    ]
                ]
            ];

            $addressJson = null;

            $ryeProductPayment = new RyeProductPayment();
            $ryeProductPayment->user_id = Auth::id();
            $ryeProductPayment->currency = $chargeCurrency;
            $ryeProductPayment->amount = $finalTotalAmount; // Store total paid by supporter
            $ryeProductPayment->total_paid = $finalTotalAmount;
            $ryeProductPayment->payment_method = 'card';
            $ryeProductPayment->shipping_address = $addressJson;
            $ryeProductPayment->customer_email = $orderDetails->user->email;
            $ryeProductPayment->anonymous = $request->is_anonymous ?? false;
            Helpers::applyDigitalWaiver($ryeProductPayment, (bool) $request->digital_waiver);
            $ryeProductPayment->save();

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

            // Create Stripe checkout session
            $successUrl = route('rye.success.payment', [
                'uuid' => $ryeProductPayment->uuid,
                'orderUuid' => $orderDetails->uuid
            ]);

            // Build payment_intent_data for Direct Charges
            $paymentIntentData = [
                'description' => "Rye Product Payment for {$orderDetails->creator->username} (Total value including all fees)",
                'application_fee_amount' => round($applicationFeeAmount * $multiplier),
                'metadata' => Helpers::buildStripeMetadata('product_purchase', $ryeProductPayment, [
                    'order_id' => $orderDetails->id,
                    'user_id' => $orderDetails->user->id,
                    'creator_id' => $orderDetails->creator->id,
                    'has_card_payments' => (string) $hasCardPayments,
                    'item_amount' => (string) round($basePrice * $multiplier),
                    'creator_net_amount' => (string) $creatorNetAmount,
                    'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                    'total_charge_amount' => (string) $finalTotalAmount,
                ]),
            ];

            Log::info('Using Direct Charges for Rye product payment', [
                'creator_id' => $orderDetails->creator->id,
                'connected_account_id' => $orderDetails->creator->account_id,
                'order_id' => $orderDetails->id,
            ]);

            $sessionCreate = $stripe->checkout->sessions->create([
                'success_url' => $successUrl, // Include correct parameters
                'cancel_url' => route('rye.cancel.payment', [$ryeProductPayment->uuid]),
                'line_items' => $lineItems,
                'mode' => 'payment',
                'payment_method_types' => ['card'],
                'payment_intent_data' => $paymentIntentData,
                'customer_email' => $orderDetails->user->email,
                'metadata' => Helpers::buildStripeMetadata('product_purchase', $ryeProductPayment, [
                    'order_id' => $orderDetails->id,
                    'user_email' => $orderDetails->user->email,
                    'payment_source' => 'website',
                    'has_card_payments' => (string) $hasCardPayments,
                ]),
            ], [
                'stripe_account' => $orderDetails->creator->account_id,
            ]);

            RyeProductPayment::whereUuid($ryeProductPayment->uuid)->update(['payment_metadata' => json_encode($sessionCreate)]);

            return response()->json([
                'status' => true,
                'url' => $sessionCreate->url,
                'orderDetails' => $orderDetails, // Send data directly
                'creator' => $orderDetails->creator,
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API Error', ['error' => $e->getMessage()]);

            return response()->json([
                'status' => false,
                'message' => 'Stripe API error: ' . $e->getMessage(),
            ], 500);
        } catch (Exception $e) {
            Log::error('Payment Processing Error', ['error' => $e->getMessage()]);

            return response()->json([
                'status' => false,
                'message' => 'Something went wrong: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rye handle rye product payment success
     *
     * @return Response
     */
    public function ryeSuccessPayment($uuid)
    {
        $orderDetails = RyeProductPayment::with('user')->where('uuid', $uuid)->first();

        if (!$orderDetails) {
            return response()->json([
                'status' => false,
                'message' => 'Payment details not found.',
            ], 404);
        }

        // Update order status
        $orderDetails->status = 'succeeded';
        $orderDetails->save();

        return Inertia::render('rye/ThankYouRye', [
            'status' => true,
        ]);
    }

    /**
     * Rye handle rye product payment success
     *
     * @return Response
     */
    public function ryeCancelPayment($uuid)
    {
        $orderDetails = RyeProductPayment::with('user')->where('uuid', $uuid)->first();

        if ($orderDetails) {
            $orderDetails->status = "canceled";
            $orderDetails->save();
        }
        // if (!$orderDetails) {
        // return response()->json([
        //     'status' => false,
        //     'message' => 'Payment details not found.',
        // ], 404);
        // }

        // $payment = ShopPayment::where('uuid', $uuid)->first();

        return redirect(route('cart'))->with('error', 'Payment Cancelled.');
    }

    /**
     * rye integrations and functionality ends here
     *
     * Rye handle rye webhook and store the response in the database
     *
     * @return Response
     */
    public function handleWebhook(Request $request)
    {
        // Get webhook event type
        $eventType = $request->input('type');
        $payload = $request->all();

        // **Step 1: Handle Challenge Verification**
        if ($request->has('data.challenge')) {
            return response()->json(['challenge' => $request->input('data.challenge')]);
        }

        // Log webhook for debugging
        // Log::info("Received Rye Webhook: " . $eventType, $payload);

        // Store webhook in database
        // $webhook = RyeWebhook::create([
        //     'event_type' => $eventType,
        //     'payload' => $payload
        // ]);

        // Handle specific event types
        switch ($eventType) {
            case 'PAYMENT_SUCCEEDED':
                return $this->handlePaymentSucceeded($payload);

            case 'PAYMENT_FAILED':
                return $this->handlePaymentFailed($payload);

            case 'PAYMENT_REFUNDED':
                return $this->handlePaymentRefunded($payload);

            case 'ORDER_SUBMISSION_STARTED':
                return $this->handleOrderSubmissionStarted();

            case 'ORDER_SUBMISSION_SUCCEEDED':
                return $this->handleOrderSubmissionSucceeded();

            case 'ORDER_PLACED':
                return $this->handleOrderPlaced($payload);

            case 'ORDER_FAILED':
                return $this->handleOrderFailed();

            case 'ORDER_CANCEL_REQUESTED':
                return $this->handleOrderCancelRequested($payload);

            case 'ORDER_CANCEL_SUCCEEDED':
                return $this->handleOrderCancelSucceeded($payload);

            case 'TRACKING_OBTAINED':
                return $this->handleTrackingObtained($payload);

            case 'RETURN_REQUESTED':
                return $this->handleReturnRequested($payload);

            case 'RETURN_APPROVED':
                return $this->handleReturnApproved($payload);

            case 'RETURN_DECLINED':
                return $this->handleReturnDeclined($payload);

            case 'RETURN_CLOSED':
                return $this->handleReturnClosed($payload);

            case 'RETURN_CANCELLED':
                return $this->handleReturnCancelled($payload);

            case 'SHOPIFY_PRODUCT_UPDATED':
                return $this->handleShopifyProductUpdated($payload);

            default:
                return response()->json(['message' => 'Event not handled'], 200);
        }
    }

    // Handling each webhook event
    protected function handlePaymentSucceeded($payload)
    {
        // Example: Mark order as paid
        // Log::info("Handling PaymentSucceeded", $payload);

        ProductOrderDetail::updateOrCreate(
            ['order_id' => $payload['requestId']], // Search condition
            [
                // 'user_id' => Auth::id() ?? null,
                // 'creater_id' => $payload['order']['creater_id'] ?? null,
                // 'cart_id' => $payload['order']['cart_id'] ?? null,
                'order_id' => $payload['requestId'],
                'details' => $payload ? json_encode($payload, true) : null,
                'payment_status' => 'COMPLETED', // Update payment status
                'session_id' => $payload['order']['session_id'] ?? null,
            ]
        );

        return response()->json(['message' => 'Payment succeeded processed']);
    }

    protected function handlePaymentFailed($payload)
    {
        // Log::info("Handling PaymentFailed", $payload);

        ProductOrderDetail::updateOrCreate(
            ['order_id' => $payload['requestId']], // Search condition
            [
                // 'user_id' => Auth::id() ?? null,
                // 'creater_id' => $payload['order']['creater_id'] ?? null,
                // 'cart_id' => $payload['order']['cart_id'] ?? null,
                'order_id' => $payload['requestId'],
                'details' => $payload ? json_encode($payload, true) : null,
                'payment_status' => 'FAILED', // Update payment status
                'session_id' => $payload['order']['session_id'] ?? null,
            ]
        );

        return response()->json(['message' => 'Payment failed processed']);
    }

    protected function handlePaymentRefunded($payload)
    {
        // Log::info("Handling PaymentRefunded", $payload);
        ProductOrderDetail::updateOrCreate(
            ['order_id' => $payload['requestId']], // Search condition
            [
                // 'user_id' => Auth::id() ?? null,
                // 'creater_id' => $payload['order']['creater_id'] ?? null,
                // 'cart_id' => $payload['order']['cart_id'] ?? null,
                'order_id' => $payload['requestId'],
                'details' => $payload ? json_encode($payload, true) : null,
                'payment_status' => 'REFUNDED', // Update payment status
                'session_id' => $payload['order']['session_id'] ?? null,
            ]
        );

        return response()->json(['message' => 'Payment refunded processed']);
    }

    protected function handleOrderSubmissionStarted()
    {
        // Log::info("Handling OrderSubmissionStarted", $payload);
        return response()->json(['message' => 'Order submission started processed']);
    }

    protected function handleOrderSubmissionSucceeded()
    {
        // Log::info("Handling OrderSubmissionSucceeded", $payload);
        return response()->json(['message' => 'Order submission succeeded processed']);
    }

    protected function handleOrderPlaced($payload)
    {
        // Log::info("Handling OrderPlaced", $payload);

        ProductOrderDetail::updateOrCreate(
            ['order_id' => $payload['requestId']], // Search condition
            [
                'user_id' => Auth::id() ?? null,
                'creater_id' => $payload['order']['creater_id'] ?? null,
                'cart_id' => $payload['order']['cart_id'] ?? null,
                'order_id' => $payload['requestId'],
                'details' => $payload ? json_encode($payload, true) : null,
                'payment_status' => 'ORDER PLACED', // Update payment status
                'session_id' => $payload['order']['session_id'] ?? null,
            ]
        );

        return response()->json(['message' => 'Order placed processed']);
    }

    protected function handleOrderFailed()
    {
        // Log::info("Handling OrderFailed", $payload);
        return response()->json(['message' => 'Order failed processed']);
    }

    protected function handleOrderCancelRequested($payload)
    {
        Log::info("Handling OrderCancelRequested", $payload);
        return response()->json(['message' => 'Order cancel requested processed']);
    }

    protected function handleOrderCancelSucceeded($payload)
    {
        Log::info("Handling OrderCancelSucceeded", $payload);
        return response()->json(['message' => 'Order cancel succeeded processed']);
    }

    protected function handleTrackingObtained($payload)
    {
        Log::info("TrackingObtained Webhook:", $payload);

        ProductOrderDetail::updateOrCreate(
            ['order_id' => $payload['requestId']], // Search condition
            [
                // 'user_id' => Auth::id() ?? null,
                // 'creater_id' => $payload['order']['creater_id'] ?? null,
                // 'cart_id' => $payload['order']['cart_id'] ?? null,
                'order_id' => $payload['requestId'],
                'details' => $payload ? json_encode($payload, true) : null,
                'payment_status' => 'ORDER TRACKED', // Update payment status
                'session_id' => $payload['order']['session_id'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Tracking obtained processed',
            'tracking_number' => $payload['tracking_number'] ?? 'Not Available'
        ]);
    }

    protected function handleReturnRequested($payload)
    {
        Log::info("Handling ReturnRequested", $payload);
        return response()->json(['message' => 'Return requested processed']);
    }

    protected function handleReturnApproved($payload)
    {
        Log::info("Handling ReturnApproved", $payload);
        return response()->json(['message' => 'Return approved processed']);
    }

    protected function handleReturnDeclined($payload)
    {
        Log::info("Handling ReturnDeclined", $payload);
        return response()->json(['message' => 'Return declined processed']);
    }

    protected function handleReturnClosed($payload)
    {
        Log::info("Handling ReturnClosed", $payload);
        return response()->json(['message' => 'Return closed processed']);
    }

    protected function handleReturnCancelled($payload)
    {
        Log::info("Handling ReturnCancelled", $payload);
        return response()->json(['message' => 'Return cancelled processed']);
    }

    protected function handleShopifyProductUpdated($payload)
    {
        Log::info("Handling ShopifyProductUpdated", $payload);
        return response()->json(['message' => 'Shopify product updated processed']);
    }

    /**
     *
     * Rye hit submitCart api and store the response in the database
     *
     * @return Response
     */
    public function storeProductOrderDetails(Request $request)
    {
        try {
            $creatorShipping = CreatorShippingAddress::with('creator')
                ->where('creator_id', $request->creator_id)
                ->first();

            if (!$creatorShipping) {
                return response()->json(['status' => false, 'message' => 'Shipping address not found']);
            }

            $cart_id = $request->cart_id;
            $buyerIdentity = $this->updateCartBuyerIdentity($cart_id, $creatorShipping);
            $responseData = json_decode($buyerIdentity->getContent(), true);

            $shippingId = '0-Default shipping method';
            $store = 'amazon';

            if (!empty($responseData['data']['data']['updateCartBuyerIdentity']['cart']['stores'][0])) {
                $storeData = $responseData['data']['data']['updateCartBuyerIdentity']['cart']['stores'][0];
                $shippingId = $storeData['offer']['shippingMethods'][0]['id'] ?? $shippingId;
                $store = $storeData['store'] ?? $store;
            }

            $response = Http::withHeaders([
                'Authorization' => env('RYE_API_KEY'),
                'Rye-Shopper-IP' => '122.180.247.198',
                'Content-Type' => 'application/json',
            ])->post('https://staging.graphql.api.rye.com/v1/query', [
                'query' => "mutation SubmitCart(\$input: CartSubmitInput!) {
                submitCart(input: \$input) {
                    cart {
                        id
                        stores {
                            status
                            orderId
                            store {
                                ... on ShopifyStore {
                                    store
                                    cartLines { quantity variant { id } }
                                }
                            }
                            errors { code message }
                        }
                    }
                    errors { code message }
                }
            }",
                'variables' => [
                    'input' => [
                        'id' => $cart_id,
                        'token' => env('PAYMENT_TOKEN'),
                        'selectedShippingOptions' => [[
                            'store' => $store,
                            'shippingId' => $shippingId,
                        ]],
                        'billingAddress' => [
                            'firstName' => $creatorShipping->first_name ?? 'John',
                            'lastName' => $creatorShipping->last_name ?? 'Doe',
                            'phone' => (string) ($creatorShipping->phone ?? '4155552671'),
                            'address1' => $creatorShipping->address_1 ?? '123 Main Street',
                            'address2' => $creatorShipping->address_2 ?? 'Apt 4B',
                            'city' => $creatorShipping->city ?? 'New York',
                            'provinceCode' => $creatorShipping->province_code ?? 'NY',
                            'countryCode' => $creatorShipping->country_code ?? 'US',
                            'postalCode' => (string) ($creatorShipping->postal_code ?? '10001'),
                        ],
                        'cartSettings' => ['amazonSettings' => ['hidePriceOnPackage' => true]]
                    ]
                ]
            ]);

            $data = $response->json();

            $storeData = $data['data']['submitCart']['cart']['stores'][0] ?? null;

            if ($storeData && $storeData['status'] === 'COMPLETED') {
                ProductOrderDetail::create([
                    'user_id' => Auth::id(),
                    'creater_id' => $request->creator_id,
                    'cart_id' => $cart_id,
                    'order_id' => $storeData['orderId'] ?? null,
                    // 'details' => json_encode($data),
                    // 'payment_status' => $storeData['status'] ?? 'pending',
                ]);

                RyeCart::where('cart_id', $cart_id)->delete();

                return response()->json(['status' => true, 'message' => 'Order details stored', 'data' => $data]);
            }

            // return response()->json(['status' => false, 'message' => 'Order details not stored']);
        } catch (Exception $e) {
            Log::error('Error in storeProductOrderDetails: ' . $e->getMessage());
            return response()->json(['status' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * rye update buyer identity functionality
     *
     */
    public function updateCartBuyerIdentity($cart_id, $creatorShipping)
    {
        $url = 'https://staging.graphql.api.rye.com/v1/query';
        $authToken = 'Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6'; // Replace with your actual token

        $response = Http::withHeaders([
            'Authorization' => $authToken,
            'Rye-Shopper-IP' => '122.180.247.198',
            'Content-Type' => 'application/json',
        ])->post($url, [
            'query' => 'mutation updateCartBuyerIdentity($input: CartBuyerIdentityUpdateInput!) {
            updateCartBuyerIdentity(input: $input) {
                cart {
                    id
                    stores {
                        ... on AmazonStore {
                            store
                            offer {
                                subtotal { value currency displayValue }
                                margin { value currency displayValue }
                                notAvailableIds
                                shippingMethods { id label taxes { value currency displayValue } total { value currency displayValue } }
                                selectedShippingMethod { id label }
                                errors { code message details { productIds } }
                            }
                            errors { message code details { productIds } }
                            requestId
                            isSubmitted
                        }
                        ... on ShopifyStore {
                            store
                            offer {
                                subtotal { value currency displayValue }
                                margin { value currency displayValue }
                                notAvailableIds
                                shippingMethods { id label price { value currency displayValue } taxes { value currency displayValue } total { value currency displayValue } }
                                selectedShippingMethod { id label }
                                errors { code message details { variantIds } }
                            }
                            errors { message code details { variantIds } }
                            requestId
                            isSubmitted
                            shipsToCountries
                        }
                    }
                }
                errors { message code }
            }
        }',
            'variables' => [
                'input' => [
                    'id' => $cart_id,
                    'buyerIdentity' => [
                        'firstName' => $creatorShipping->first_name ?? 'John',
                        'lastName' => $creatorShipping->last_name ?? 'Doe',
                        'email' => $creatorShipping->creator->email ?? 'john-doe@gmail.com',
                        'phone' => $creatorShipping->phone ?? '+1 234-567-8901',
                        'address1' => $creatorShipping->address_1 ?? '123 Main Street',
                        'address2' => $creatorShipping->address_2 ?? 'Apt 4B',
                        'city' => $creatorShipping->city ?? 'New York',
                        'provinceCode' => $creatorShipping->province_code ?? 'NY',
                        'countryCode' => $creatorShipping->country_code ?? 'US',
                        'postalCode' => $creatorShipping->postal_code ?? '10001', // Set a default postal code
                    ],
                ]
            ]
        ]);

        // Check the response
        if ($response->successful()) {
            // return $response->json();
            return response()->json([
                'status' => true,
                'message' => 'Cart buyer identity updated successfully',
                'data' => $response->json()
            ]);
        } else {
            // return $response->body();
            return response()->json([
                'status' => false,
                'message' => 'Failed to update cart buyer identity',
                'error' => $response->body()
            ], $response->status());
        }
    }
    /**
     * rye product functionality ends
     *
     *x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x*****x******x******x*****x******x*****x*****x******x******x******x******x******x*****/


    public function clearCart($deviceid, $ownerid)
    {
        $query = UserCart::where('country', 'global')->where('owner_id', $ownerid)->where('status', 1);
        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            $query->where('device_id', $deviceid);
        }
        $query->update(['status' => 0]);
        $this->cartItems();
    }

    public function removeSurpriseFromCart($uuid, $device_id = null)
    {
        // Check if this is an AJAX request
        $isAjax = request()->header('X-Requested-With') === 'XMLHttpRequest' ||
            request()->header('Accept') === 'application/json' ||
            request()->wantsJson();

        $query = UserCart::where('country', 'global')->whereUuid($uuid);
        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            if (!$device_id) {
                $device_id = request()->get('device_id') ?? request()->header('X-Device-ID');
            }

            if (!$device_id) {
                if ($isAjax) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Device ID required for guest users'
                    ], 400);
                }
                return redirect()->route('cart')->with('error', 'Unable to remove item from cart. Please try again.');
            }
            $query->where('device_id', $device_id);
        }
        $cart = $query->first();

        if (!$cart) {
            // Handle not found case based on request type
            if ($isAjax) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cart item not found or you do not have permission to remove it'
                ], 404);
            }

            if (request()->header('X-Inertia')) {
                return redirect()->route('cart')->with('error', 'Cart item not found or you do not have permission to remove it.');
            }

            return back()->with('error', 'Cart item not found or you do not have permission to remove it.');
        }

        $cart->status = 0;
        $cart->save();

        // Return appropriate response based on request type
        if ($isAjax) {
            return response()->json([
                'success' => true,
                'message' => 'Item removed from cart'
            ]);
        }

        if (request()->header('X-Inertia')) {
            return redirect()->route('cart')->with('success', 'Item removed from cart');
        }

        return back()->with('success', 'Item removed from cart');
    }

    public function cartItems()
    {
        if (!empty(Auth::id())) {
            $groupedWishes = [];
            $user = User::where('id', Auth::id())
                ->first();
            $cart = [];
            if ($user) {
                $carts = UserCart::whereHas('wish')->where('user_id', $user->id)->where('status', 1)->get();
                $groupedWishes = [];
                foreach ($carts as $wish) {
                    $owner_id = $wish->owner_id;
                    if (!isset($groupedWishes[$owner_id])) {
                        $groupedWishes[$owner_id] = [];
                    }

                    $groupedWishes[$owner_id][] = [
                        'user' => $wish->user->toArray(),
                        'wish' => $wish->wish ? $wish->wish->toArray() : [],
                        'owner' => $wish->owner->toArray(),
                        'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/',
                        'amount' => $wish->amount,
                        'priceid' => $wish->priceid,
                        'uuiddata' => $wish->uuid,
                        'tax' => $wish->tax,
                        'surprisemessage' => $wish->message ?? '',
                        'quantity' => $wish->quantity ?? '',
                        'currency' => $wish->wish->currency ?? ($wish->owner->default_currency ?? 'GBP'),
                    ];
                }
            }
            $key = 0;
            foreach ($groupedWishes as $value) {
                $cart[$key] = [
                    'user' => [
                        'id' => $value[0]['owner']['id'],
                        'name' => $value[0]['owner']['name'],
                        'username' => $value[0]['owner']['username'],
                        'uuid' => $value[0]['owner']['uuid'],
                        'default_currency' => $value[0]['owner']['default_currency'],
                        'currency' => $value[0]['currency'],
                        'vat_amount_percentage' => $value[0]['owner']['vat_amount_percentage'] ?? 0,
                    ],

                ];

                $total = 0;
                $fee = 0;
                foreach ($value as $k => $v) {
                    $price = $v['amount'] ? $v['amount'] : $v['wish']['price'];
                    $tax = $v['tax'] ? $v['tax'] : $v['wish']['tax_amount'];
                    $priceid = $v['priceid'] ? $v['priceid'] : $v['wish']['price_id'];

                    if (!empty($v['wish'])) {
                        $cart[$key]['items'][$k] = [
                            'id' => $v['wish']['id'],
                            'uuid' => $v['uuiddata'],
                            'user_id' => $v['wish']['user_id'],
                            'wishname' => $v['wish']['wishname'],
                            'stripe_product_id' => $v['wish']['stripe_product_id'],
                            'price' => $price,
                            'tax' => $tax,
                            'price_id' => $priceid,
                            'item_url' => $v['wish']['item_url'],
                            'subscription' => $v['wish']['subscription'],
                            'subscription_period' => $v['wish']['subscription_period'],
                            'repeat_purchase' => $v['wish']['repeat_purchase'],
                            'category' => $v['wish']['category'],
                            'url' => $v['url'],
                            'quantity' => $v['quantity'],
                            'currency' => $v['wish']['currency'] ?? ($cart[$key]['user']['default_currency'] ?? 'GBP'),
                        ];
                    } else {
                        $cart[$key]['items'][$k] = [
                            'price' => $price,
                            'tax' => $tax,
                            'wishname' => 'Surprise Gift',
                            'uuid' => $v['uuiddata'],
                            'price_id' => $priceid,
                            'product' => 'surprise',
                            'url' => $v['url'],
                            'surprise_message' => $v['surprisemessage'],
                            'quantity' => $v['quantity'],
                            'currency' => $v['currency'] ?? ($cart[$key]['user']['default_currency'] ?? 'GBP'),
                        ];
                    }

                    $vatPercent = (float) ($cart[$key]['user']['vat_amount_percentage'] ?? 0);
                    $itemCurrency = strtoupper($cart[$key]['items'][$k]['currency'] ?? ($cart[$key]['user']['default_currency'] ?? 'GBP'));
                    if (!empty($v['wish'])) {
                        $amountWithVat = (float) $price + (((float) $price * $vatPercent) / 100);
                        $breakdown = Helpers::calculateStripeDirectChargeFlow($amountWithVat, $itemCurrency);
                        $cart[$key]['items'][$k]['supporter_total'] = (float) ($breakdown['total_supporter_pays'] ?? $amountWithVat);
                    } else {
                        $cart[$key]['items'][$k]['supporter_total'] = (float) round(((float) $price + (float) $tax), 2, PHP_ROUND_HALF_UP);
                    }
                    // if ($v['wish']['subscription'] == 2) {
                    //     $total += $v['amount'];
                    // } else {
                    //     $total += $v['wish']['price'];
                    // }
                    $total += !empty($v['priceid']) ? $v['amount'] : $v['wish']['price'];
                    $fee += !empty($v['priceid']) ? $v['tax'] * $v['quantity'] : ($v['wish']['tax_amount'] * $v['quantity'] ?? 0);
                }
                $cart[$key]['total'] = $total;
                $cart[$key]['fee'] = $fee;

                $key++;
            }
        } else {
            $cart = [];
        }
        return Inertia::render('cart/Cart', [
            "carts" => $cart,
        ]);
    }

    public function anonymousCartItems($deviceId)
    {
        $carts = UserCart::whereHas('wish')->where('device_id', $deviceId)->where('country', 'global')->where('status', 1)->get();
        $groupedWishes = [];
        foreach ($carts as $wish) {
            $owner_id = $wish->owner_id;
            if (!isset($groupedWishes[$owner_id])) {
                $groupedWishes[$owner_id] = [];
            }

            $groupedWishes[$owner_id][] = [
                'user' => $wish->user ? $wish->user->toArray() : [], // Check if user is not null
                'wish' => $wish->wish ? $wish->wish->toArray() : [],
                'owner' => $wish->owner ? $wish->owner->toArray() : [],
                'owner_account_id' => $wish->owner ? $wish->owner->account_id : null,
                'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/',
                'amount' => $wish->amount,
                'priceid' => $wish->priceid,
                'uuiddata' => $wish->uuid,
                'tax' => $wish->tax,
                'surprisemessage' => $wish->message ?? '',
                'quantity' => $wish->quantity ?? '',
            ];
        }
        $cart = [];
        $key = 0;
        foreach ($groupedWishes as $value) {
            $cart[$key] = [
                'user' => [
                    'id' => $value[0]['owner']['id'] ?? null,
                    'name' => $value[0]['owner']['name'] ?? null,
                    'username' => $value[0]['owner']['username'] ?? null,
                    'uuid' => $value[0]['owner']['uuid'] ?? null,
                    'default_currency' => $value[0]['owner']['default_currency'],
                    'vat_amount_percentage' => $value[0]['owner']['vat_amount_percentage'] ?? 0
                ],
                'card_capabilities' => StripeControl::hasCardPaymentsCapability($value[0]['owner_account_id'] ?? null),
            ];

            $total = 0;
            $fee = 0;
            foreach ($value as $k => $v) {
                $price = $v['amount'] ? $v['amount'] : ($v['wish']['price'] ?? null);
                $tax = $v['tax'] ? $v['tax'] : $v['wish']['tax_amount'];
                $priceid = $v['priceid'] ? $v['priceid'] : ($v['wish']['price_id'] ?? null);

                if (!empty($v['wish'])) {
                    $cart[$key]['items'][$k] = [
                        'id' => $v['wish']['id'] ?? null,
                        'uuid' => $v['uuiddata'] ?? null,
                        'user_id' => $v['wish']['user_id'] ?? null,
                        'wishname' => $v['wish']['wishname'] ?? null,
                        'stripe_product_id' => $v['wish']['stripe_product_id'] ?? null,
                        'price' => $price,
                        'tax' => $tax,
                        'price_id' => $priceid,
                        'item_url' => $v['wish']['item_url'] ?? null,
                        'subscription' => $v['wish']['subscription'] ?? null,
                        'subscription_period' => $v['wish']['subscription_period'] ?? null,
                        'repeat_purchase' => $v['wish']['repeat_purchase'] ?? null,
                        'category' => $v['wish']['category'] ?? null,
                        'url' => $v['url'],
                        'quantity' => $v['quantity'] ?? null,
                        'currency' => $v['wish']['currency'] ?? ($cart[$key]['user']['default_currency'] ?? null),
                    ];
                } else {
                    $cart[$key]['items'][$k] = [
                        'price' => $price,
                        'tax' => $tax,
                        'wishname' => 'Surprise Gift',
                        'uuid' => $v['uuiddata'] ?? null,
                        'price_id' => $priceid,
                        'product' => 'surprise',
                        'url' => $v['url'],
                        'surprise_message' => $v['surprisemessage'] ?? null,
                        'quantity' => $v['quantity'] ?? null,
                        'currency' => $cart[$key]['user']['default_currency'] ?? null,
                    ];
                }

                $vatPercent = (float) ($cart[$key]['user']['vat_amount_percentage'] ?? 0);
                $itemCurrency = strtoupper($cart[$key]['items'][$k]['currency'] ?? ($cart[$key]['user']['default_currency'] ?? 'GBP'));
                if (!empty($v['wish'])) {
                    $amountWithVat = (float) $price + (((float) $price * $vatPercent) / 100);
                    $breakdown = Helpers::calculateStripeDirectChargeFlow($amountWithVat, $itemCurrency);
                    $cart[$key]['items'][$k]['supporter_total'] = (float) ($breakdown['total_supporter_pays'] ?? $amountWithVat);
                } else {
                    $cart[$key]['items'][$k]['supporter_total'] = (float) round(((float) $price + (float) $tax), 2, PHP_ROUND_HALF_UP);
                }

                $total += !empty($v['priceid']) ? $v['amount'] : ($v['wish']['price'] ?? 0);
                $fee += !empty($v['priceid']) ? $v['tax'] * $v['quantity'] : ($v['wish']['tax_amount'] * $v['quantity'] ?? 0);
            }
            $cart[$key]['total'] = $total;
            $cart[$key]['fee'] = $fee;

            $key++;
        }
        return response()->json([
            "success" => true,
            "carts" => $cart,
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Get authenticated user's regular cart items as JSON
     * Similar to cartItems() but returns JSON instead of Inertia view
     */
    public function authenticatedCartItems()
    {
        Log::info('AuthenticatedCartItems API called', [
            'is_authenticated' => Auth::check(),
            'user_id' => Auth::id(),
            'timestamp' => now()
        ]);

        if (!Auth::check()) {
            return response()->json([
                "success" => false,
                "message" => "Authentication required",
                "carts" => []
            ], 401);
        }

        $user = User::where('id', Auth::id())
            ->first();

        $cart = [];
        if ($user) {
            // Get authenticated cart items
            $carts = UserCart::whereHas('wish')->where('user_id', $user->id)->where('country', 'global')->where('status', 1)->get();

            // FALLBACK: Also check if there are any orphaned cart items with device_id that should belong to this user
            // This handles cases where the login cart transfer might not have worked
            $deviceIdFromRequest = request()->header('X-Device-ID')
                ?? request()->cookie('device_id')
                ?? request()->input('device_id');

            if (!empty($deviceIdFromRequest)) {
                $orphanedCarts = UserCart::whereHas('wish')
                    ->where('device_id', $deviceIdFromRequest)
                    ->whereNull('user_id')
                    ->where('country', 'global')
                    ->where('status', 1)
                    ->get();

                if ($orphanedCarts->isNotEmpty()) {
                    Log::info('Found orphaned cart items during cart retrieval - performing merge', [
                        'user_id' => $user->id,
                        'device_id' => $deviceIdFromRequest,
                        'orphaned_count' => $orphanedCarts->count()
                    ]);

                    // Merge orphaned cart items
                    foreach ($orphanedCarts as $orphanedItem) {
                        // Check if user already has this item
                        $existingItem = $carts->where('wish_item_id', $orphanedItem->wish_item_id)
                            ->where('owner_id', $orphanedItem->owner_id)
                            ->first();

                        if ($existingItem) {
                            // Merge quantities
                            $existingItem->quantity += $orphanedItem->quantity;
                            $existingItem->save();
                            $orphanedItem->delete();
                        } else {
                            // Transfer to user
                            $orphanedItem->user_id = $user->id;
                            $orphanedItem->device_id = null;
                            $orphanedItem->save();
                            $carts->push($orphanedItem); // Add to collection for processing
                        }
                    }
                }
            }
            Log::info('Authenticated cart query result', [
                'user_id' => $user->id,
                'cart_count' => $carts->count(),
                'cart_ids' => $carts->pluck('id')->toArray(),
                'cart_details' => $carts->map(function ($cart) {
                    return [
                        'id' => $cart->id,
                        'user_id' => $cart->user_id,
                        'device_id' => $cart->device_id,
                        'owner_id' => $cart->owner_id,
                        'wish_item_id' => $cart->wish_item_id,
                        'status' => $cart->status,
                        'country' => $cart->country,
                        'amount' => $cart->amount,
                        'wish_exists' => $cart->wish ? true : false,
                        'wish_id' => $cart->wish ? $cart->wish->id : null
                    ];
                })->toArray()
            ]);

            $groupedWishes = [];
            foreach ($carts as $wish) {
                $owner_id = $wish->owner_id;
                if (!isset($groupedWishes[$owner_id])) {
                    $groupedWishes[$owner_id] = [];
                }

                $groupedWishes[$owner_id][] = [
                    'user' => $wish->user->toArray(),
                    'wish' => $wish->wish ? $wish->wish->toArray() : [],
                    'owner' => $wish->owner->toArray(),
                    'owner_account_id' => $wish->owner->account_id,
                    'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/',
                    'amount' => $wish->amount,
                    'priceid' => $wish->priceid,
                    'uuiddata' => $wish->uuid,
                    'tax' => $wish->tax,
                    'surprisemessage' => $wish->message ?? '',
                    'quantity' => $wish->quantity ?? '',
                ];
            }

            Log::info('Grouped wishes processed', [
                'grouped_count' => count($groupedWishes),
                'owner_ids' => array_keys($groupedWishes)
            ]);

            $key = 0;
            foreach ($groupedWishes as $value) {
                $cart[$key] = [
                    'user' => [
                        'id' => $value[0]['owner']['id'],
                        'name' => $value[0]['owner']['name'],
                        'username' => $value[0]['owner']['username'],
                        'uuid' => $value[0]['owner']['uuid'],
                        'default_currency' => $value[0]['owner']['default_currency'],
                        'vat_amount_percentage' => $value[0]['owner']['vat_amount_percentage'] ?? 0
                    ],
                    'card_capabilities' => StripeControl::hasCardPaymentsCapability($value[0]['owner_account_id'] ?? null),
                ];

                $total = 0;
                $fee = 0;
                foreach ($value as $k => $v) {
                    $price = $v['amount'] ? $v['amount'] : $v['wish']['price'];
                    $tax = $v['tax'] ? $v['tax'] : $v['wish']['tax_amount'];
                    $priceid = $v['priceid'] ? $v['priceid'] : $v['wish']['price_id'];

                    if (!empty($v['wish'])) {
                        $cart[$key]['items'][$k] = [
                            'id' => $v['wish']['id'],
                            'uuid' => $v['uuiddata'],
                            'user_id' => $v['wish']['user_id'],
                            'wishname' => $v['wish']['wishname'],
                            'stripe_product_id' => $v['wish']['stripe_product_id'],
                            'price' => $price,
                            'tax' => $tax,
                            'price_id' => $priceid,
                            'item_url' => $v['wish']['item_url'],
                            'subscription' => $v['wish']['subscription'],
                            'subscription_period' => $v['wish']['subscription_period'],
                            'repeat_purchase' => $v['wish']['repeat_purchase'],
                            'category' => $v['wish']['category'],
                            'url' => $v['url'],
                            'quantity' => $v['quantity'],
                            'currency' => $v['wish']['currency'] ?? ($cart[$key]['user']['default_currency'] ?? null),
                        ];
                    } else {
                        $cart[$key]['items'][$k] = [
                            'price' => $price,
                            'tax' => $tax,
                            'wishname' => 'Surprise Gift',
                            'uuid' => $v['uuiddata'],
                            'price_id' => $priceid,
                            'product' => 'surprise',
                            'url' => $v['url'],
                            'surprise_message' => $v['surprisemessage'],
                            'quantity' => $v['quantity'],
                            'currency' => $cart[$key]['user']['default_currency'] ?? null,
                        ];
                    }

                    $vatPercent = (float) ($cart[$key]['user']['vat_amount_percentage'] ?? 0);
                    $itemCurrency = strtoupper($cart[$key]['items'][$k]['currency'] ?? ($cart[$key]['user']['default_currency'] ?? 'GBP'));
                    if (!empty($v['wish'])) {
                        $amountWithVat = (float) $price + (((float) $price * $vatPercent) / 100);
                        $breakdown = Helpers::calculateStripeDirectChargeFlow($amountWithVat, $itemCurrency);
                        $cart[$key]['items'][$k]['supporter_total'] = (float) ($breakdown['total_supporter_pays'] ?? $amountWithVat);
                    } else {
                        $cart[$key]['items'][$k]['supporter_total'] = (float) round(((float) $price + (float) $tax), 2, PHP_ROUND_HALF_UP);
                    }
                    $total += !empty($v['priceid']) ? $v['amount'] : $v['wish']['price'];
                    $fee += !empty($v['priceid']) ? $v['tax'] * $v['quantity'] : ($v['wish']['tax_amount'] * $v['quantity'] ?? 0);
                }
                $cart[$key]['total'] = $total;
                $cart[$key]['fee'] = $fee;

                $key++;
            }
        }

        Log::info('Final authenticated cart response', [
            'user_id' => Auth::id(),
            'final_cart_count' => count($cart),
            'cart_structure' => array_map(function ($c) {
                return [
                    'user_id' => $c['user']['id'] ?? null,
                    'username' => $c['user']['username'] ?? null,
                    'items_count' => count($c['items'] ?? []),
                    'total' => $c['total'] ?? null,
                    'fee' => $c['fee'] ?? null
                ];
            }, $cart)
        ]);

        return response()->json([
            "success" => true,
            "carts" => $cart,
        ]);
    }

    public function sendSurprise(Request $request)
    {
        $request->validate([
            "message" => ["required", "string"],
            "amount" => ["required"],
        ]);

        $currency = strtolower($request->cookie("currency", "GBP"));

        $owner = User::where('id', $request->owner_id)->first();
        $price = Helpers::priceFormat($currency, $request->amount, $owner->default_currency);
        $min_amount = $owner->min_surprise_amount < 5 ? 5 : $owner->min_surprise_amount;
        $user_amount = Helpers::priceFormat($owner->default_currency, $min_amount, $currency);
        if ($price < $min_amount) {
            return redirect()->back()->with("error", "Enter minimum $user_amount amount.");
        }

        $wordLimit = 100;


        $message = $request->message;
        if ($msgErr = Helpers::validateSupporterMessage($message, $wordLimit)) {
            return redirect()->back()->with("error", $msgErr);
        }

        // Use new gross-up flow for consistent fee calculation
        $vatPercent = (float) ($owner->vat_amount_percentage ?? 0);
        $priceWithVat = $price + (($price * $vatPercent) / 100);
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $owner->default_currency);
        $total = $breakdown['total_supporter_pays'];
        $tax = $breakdown['total_fees'];

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe_client = $stripe->products->create([
            'name' => 'Surprise Gift',
            'images' => ['https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/'],
            "default_price_data" => ["currency" => $owner->default_currency, "unit_amount_decimal" => round($total * 100, 0)],
        ], [
            'stripe_account' => $owner->account_id,
        ]);

        if (!Auth::check()) {
            UserCart::create([
                'device_id' => $request->device_id,
                'owner_id' => $request->owner_id ?? null,
                'amount' => $price,
                'tax' => $tax,
                'priceid' => $stripe_client->id,
                'message' => $request->message,
                'quantity' => 1,
                'status' => 1,
                'country' => 'global', // CRITICAL: Always set country
            ]);
            return back()->with('success', 'Surprise Gift item has been added to the cart.');
        } else {
            UserCart::create([
                'user_id' => Auth::id(),
                'owner_id' => $request->owner_id ?? null,
                'amount' => $price,
                'tax' => $tax,
                'priceid' => $stripe_client->id,
                'message' => $request->message,
                'quantity' => 1,
                'status' => 1,
                'country' => 'global', // CRITICAL: Always set country
            ]);
            return back()->with('success', 'Surprise Gift item has been added to the cart.');
        }
    }

    public function noOfCartItems()
    {
        $items = UserCart::whereHas('wish')->where('user_id', Auth::id())->where('country', 'global')->where('status', 1)->count();
        return response()->json([
            "success" => true,
            "counts" => $items,
        ]);
    }

    public function updateCartQuantity($uuid, $quantity)
    {
        try {
            $cart = UserCart::whereUuid($uuid)->first();
            if (!empty($cart)) {
                $quantity = max(1, (int) $quantity);

                if (!Auth::check() && !empty($cart->device_id) && empty($cart->user_id) && !empty($cart->owner_id)) {
                    $owner = User::find($cart->owner_id);
                    if ($owner) {
                        $ownerCurrency = strtoupper($owner->default_currency ?: 'GBP');
                        $vatPercent = (float) ($owner->vat_amount_percentage ?? 0);

                        $supporterPays = function (float $amount) use ($ownerCurrency, $vatPercent): float {
                            $amountWithVat = $amount + (($amount * $vatPercent) / 100);
                            $breakdown = Helpers::calculateStripeDirectChargeFlow($amountWithVat, $ownerCurrency);
                            return (float) ($breakdown['total_supporter_pays'] ?? $amountWithVat);
                        };

                        $existingItems = UserCart::where('owner_id', $cart->owner_id)
                            ->where('country', 'global')
                            ->where('status', 1)
                            ->where('device_id', $cart->device_id)
                            ->whereNull('user_id')
                            ->where('id', '!=', $cart->id)
                            ->get(['amount', 'quantity']);

                        $existingTotal = 0.0;
                        foreach ($existingItems as $it) {
                            $existingTotal += $supporterPays((float) $it->amount) * (int) ($it->quantity ?? 1);
                        }

                        $totalAfterUpdate = $existingTotal + ($supporterPays((float) $cart->amount) * $quantity);
                        $guestRestriction = Helpers::guestCheckoutRestriction($ownerCurrency, $totalAfterUpdate);
                        if ($guestRestriction) {
                            return response()->json([
                                'success' => false,
                                'code' => 'AUTH_REQUIRED',
                                'reason_code' => $guestRestriction['code'],
                                'message' => 'Login required',
                                'msg' => $guestRestriction['message'],
                            ]);
                        }
                    }
                }

                $cart->quantity = $quantity;
                $cart->save();
                // return back()->with('success', 'Quantity updated successfully.');
                return response()->json([
                    "success" => true,
                    "message" => 'Quantity updated successfully',
                ]);
            } else {
                // return back()->with('error', 'Failed  to update quantity.');
                return response()->json([
                    "success" => false,
                    "message" => 'Unable to update quantity',
                ]);
            }
        } catch (\Throwable) {
            //throw $th;
        }
    }

    public function wish_counter($deviceid)
    {
        if (!Auth::check()) {
            $items = UserCart::whereHas('wish')->where('device_id', $deviceid ?? null)->where('country', 'global')->where('status', 1)->count();
            return response()->json([
                "success" => true,
                "counter" => $items,
            ]);
            // ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            //   ->header('Pragma', 'no-cache')
            //   ->header('Expires', '0');
        } else {
            $user = Auth::user();
            $items = UserCart::whereHas('wish')->where('user_id', $user->id ?? null)->where('country', 'global')->where('status', 1)->count();
            return response()->json([
                "success" => true,
                "counter" => $items,
            ]);
            // ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            //   ->header('Pragma', 'no-cache')
            //   ->header('Expires', '0');
        }
    }

    public function sayThanks(Request $request, $payment_id)
    {
        $media = $request->message_media;
        $payment = StripePaymentItems::where("id", $payment_id)->first();
        // $payment->message = $request->messages;
        $payment->thankyou_message = $request->messages;
        $payment->is_read_user = 0;
        $payment->message_media = $media['uuid'] ?? null;
        $payment->media_type = $media['contentInfo']['mime']['type'] ?? null;
        $payment->thank_you_at = Carbon::now();
        $payment->save();
        // ThankyouMailToUser::dispatch($payment);

        SendThankYouMailAdmin::dispatch($payment);
        return response()->json([
            "success" => true,
            "message" => 'Message sent !!',
        ]);
    }

    public function readStatus($payment_id, $type)
    {
        $payment = StripePaymentItems::where("id", $payment_id)->first();
        if ($type == 'owner') {
            $payment->is_read_owner = 1;
        } elseif ($type == 'user') {
            $payment->is_read_user = 1;
        }
        $payment->save();
        return Inertia::render('tracker/Wishtracker');
    }

    public function creatorSubscriptions()
    {
        $subs = Subscription::where('owner_id', Auth::id())->orderBy('updated_at', 'DESC')->get();
        $data = [];
        foreach ($subs as $value) {
            $data[] = [
                'user' => [
                    'name' => $value->user->name,
                    'username' => $value->user->username,
                    'avatar_url' => $value->user->avatar_url,
                    'cover_url' => $value->user->cover_url,
                    'email' => $value->user->email,
                ],
                'wish' => [
                    'wishname' => $value->wish->wishname,
                    'price' => $value->wish->price,
                    'tax_amount' => $value->wish->tax_amount,
                    'item_url' => $value->wish->item_url,
                    'perma_link' => $value->wish->perma_link,
                ],
                'uuid' => $value->uuid,
                'start_at' => $value->start_at,
                'end_at' => $value->end_at,
                'status' => $value->status,
            ];
        }
        return Inertia::render('tracker/Wishtracker');
    }

    public function userSubscribed()
    {
        $subs = Subscription::where('user_id', Auth::id())->get();
        $data = [];
        foreach ($subs as $value) {
            $data[] = [
                'owner' => [
                    'name' => $value->owner->name,
                    'username' => $value->owner->username,
                    'avatar_url' => $value->owner->avatar_url,
                    'cover_url' => $value->owner->cover_url,
                    'email' => $value->owner->email,
                ],
                'wish' => [
                    'wishname' => $value->wish->wishname,
                    'price' => $value->wish->price,
                    'tax_amount' => $value->wish->tax_amount,
                    'item_url' => $value->wish->item_url,
                    'perma_link' => $value->wish->perma_link,
                ],
                'uuid' => $value->uuid,
                'start_at' => $value->start_at,
                'end_at' => $value->end_at,
                'status' => $value->status,
            ];
        }
        return Inertia::render('tracker/Wishtracker');
    }

    public function cancelSubscription($subscription_id)
    {
        $item = WishItemSubscription::where('id', $subscription_id)->first();
        $item->status = 0;
        $item->save();
        return Inertia::render('tracker/Wishtracker');
    }

    public function pinItem($wish_id)
    {
        $item = WishItem::where('id', $wish_id)->first();

        if ($item->user_id == Auth::id()) {
            WishItem::where('user_id', Auth::id())->update(['is_pin' => 0]);

            $item->is_pin = 1;
            $item->save();

            return response()->json([
                'status' => true,
                'msg' => 'Item is pinned'
            ]);
        } else {
            return response()->json([
                'status' => false,
                'msg' => 'You can pin only your wishlist!'
            ]);
        }
    }

    /**
     * Add a new tip jar goal
     *
     * @param Request $request
     * @return mixed
     */
    public function addTipGoal(Request $request)
    {
        $request->validate(
            [
                "name" => [
                    "required",
                    "string",
                ],
                "target" => [
                    "required",
                    "numeric",
                ],
                "default_price" => [
                    "nullable"
                ],
                "duration" => [
                    'required',
                    'numeric'
                ],
            ]
        );

        $user = User::where('id', Auth::id())->first();

        $target = $request->target;

        $goal = TipGoal::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'target' => $target,
            // 'default_price' => ceil($price),
            'description' => $request->description ?? null,
            'currency' => $user->default_currency,
        ]);

        $goal->refresh();

        if ($goal->status == 1) {
            $goal->completed_at = Carbon::now()->addDays($goal->days);
            $goal->save();
        }

        // $productPayload = [
        //     "name"  =>  $goal->name,
        //     "images" => ["https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/"],
        //     "default_price_data"    =>  [
        //         "currency"  =>  $user->default_currency,
        //         "unit_amount_decimal"   => $createpriceid * 100,
        //     ],
        //     "url"   => env('APP_URL') . '/' . $user->username . "?goal=$goal->uuid/"
        // ];
        // try {
        //     $product = StripeControl::createProduct($productPayload);
        //     $goal->product_id = $product->id;
        //     $goal->price_id = $product->default_price;
        //     $goal->save();
        // } catch (Exception $e) {
        //     $goal->delete();
        //     return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
        // }

        return back()->with('success', 'Tip Goal added successfully!');
    }

    /**
     * Change wishes listing order
     *
     * @param Request $request
     * @return mixed
     */
    public function moveWishes(Request $request)
    {
        $request->validate([
            'shuffled_items' => [
                'required',
            ]
        ]);

        foreach ($request->shuffled_items as $key => $value) {
            WishItem::where('id', $value)->update(['sort' => $key]);
        }

        return response()->json([
            'status' => true,
            'msg' => "Shuffled Successfully!"
        ]);
    }



    /**
     * Mark as completed the tip jar goal
     *
     * @param $uuid uuid of tip jar
     * @return mixed
     */
    public function markJarComplete($uuid)
    {

        $goal = TipGoal::where('uuid', $uuid)->where('completed', 0)->first();

        $goal->completed = 1;
        $goal->completed_at = Carbon::now();
        $goal->save();

        return back()->with('success', 'Goal marked as completed.');
    }

    /**
     * All tip jar goals of a creator
     *
     * @return mixed
     */
    public function allGoalsCreators()
    {

        $goals = TipGoal::where('user_id', Auth::id())->get();

        return response()->json([
            'status' => true,
            'goals' => $goals
        ]);
    }

    /**
     * User tips payment show data
     *
     * @return Response
     */
    public function userTips()
    {
        $userId = Auth::id();

        $userTips = TipGoalsPayment::with(['user', 'creator'])
            ->where(function ($query) use ($userId) {
                $query->where('creator_id', $userId)
                    ->orWhere('user_id', $userId);
            })
            ->whereIn('status', ['paid', 'cancelled'])
            ->latest()
            ->get();

        // Optionally add 'owner' property
        $userTips->each(function ($tip) {
            $tip->owner = $tip->creator;
        });

        return response()->json([
            'status' => true,
            'tips' => $userTips,
        ]);
    }


    /**
     * Enable disable the auto tweet
     *
     * @return mixed
     */
    public function enableAutoTweet()
    {

        $user = User::where('id', Auth::id())->first();

        if ($user->auto_tweet == 1) {
            $user->auto_tweet = 0;
        } else {
            $user->auto_tweet = 1;
        }

        if ($user) {
            $user->save();

            if ($user->auto_tweet == 1) {
                return back()->with('success', "Auto tweet for gift is Enabled.");
            } else {
                return back()->with('success', "Auto tweet for gift is Disabled.");
            }
        } else {
            return back()->with('error', "User not found.");
        }
    }

    /**
     * Share the purchasing on twitter
     *
     * @return mixed
     */
    public function shareOnTwitter($uuid, $type)
    {
        $user = Auth::user();
        if ($user->auto_tweet == 0) {
            return response()->json([
                'status' => false,
                'msg' => "Please first enable the auto tweets."
            ]);
        }

        if ($type == 'wish-add') {
            $pay = StripePaymentItems::whereUuid($uuid)->first();
            if (empty($pay->wish_item_id)) {
                SurpriseTweet::dispatch($pay);
            } elseif ($pay->wish->subscription == 2) {
                CrowdfundTweet::dispatch($pay);
            } else {
                CheckoutTweet::dispatch($pay);
            }
        } elseif ($type == 'subscription') {
            $pay = WishItemSubscription::whereUuid($uuid)->first();
            SubscribeAutoTweet::dispatch($pay);
        } elseif ($type == 'tip-jar') {
            $pay = TipGoalsPayment::whereUuid($uuid)->first();
            TipJarTweet::dispatch($pay);
        }
        return response()->json([
            'status' => true,
            'msg' => "Gift items has been shared on twitter."
        ]);
    }

    public function editWishCategory(Request $request, $id)
    {
        $category = UserCategory::where('id', $id)->first();

        $category->category = $request->name;
        $category->save();

        return response()->json([
            'status' => true,
            'msg' => "Category Updated"
        ]);
    }

    public function deleteCategory($id)
    {
        $wish_cat = WishCategory::where('user_category_id', $id)->get();

        foreach ($wish_cat as $value) {
            $value->user_category_id = NULL;
            $value->save();
        }

        UserCategory::where('id', $id)->delete();

        return response()->json([
            'status' => true,
            'msg' => "Category Deleted."
        ]);
    }

    /**
     * Bill Payment Data Show
     *
     * @return Response
     */
    public function billTracker()
    {
        $user = Auth::user();

        // Fetch bill payments with conditional user data
        $bill_payments = BillPayment::whereHas('bill', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)
            ->whereIn('status', ['paid', 'cancelled'])
            ->with('bill', 'user') // Load bill and user relationships
            ->latest()
            ->get();

        // Map the results to include user data or fallback to guest email
        $bill_payments->map(function ($payment) {
            $payment->user_data = $payment->user
                ? [
                    'name' => $payment->user->name,
                    'avatar' => $payment->user->avatar_url,
                    'uuid' => $payment->user->uuid,
                ]
                : [
                    'name' => $payment->guest_name ?? 'Anonymous',
                    'avatar' => null, // Set default avatar or null for guests
                    'email' => $payment->guest_email ?? 'N/A',
                ];
            return $payment;
        });

        return response()->json([
            'status' => true,
            'bill_payments' => $bill_payments
        ]);
    }

    /**
     * Membership Payment Data Show
     *
     * @return Response
     */
    public function membershipTracker()
    {
        $user = Auth::user();
        $membership_payments = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)
            ->whereIn('status', ['paid', 'cancelled'])
            ->with('membership')
            ->latest()
            ->get();

        $membership_payments->map(function ($q) {
            if ($q->user) {
                $q->user_data = [
                    'name' => $q->user->name,
                    'avatar' => $q->user->avatar_url,
                    'uuid' => $q->user->uuid
                ];
            }
            return $q;
        });

        return response()->json([
            'status' => true,
            'membership_payments' => $membership_payments
        ]);
    }

    /**
     * Shop Payment Data Show
     *
     * @return Response
     */
    public function shopTracker()
    {
        $user = auth()->user();

        // Build the base query
        $paymentsQuery = ShopPayment::with(['shop', 'user'])
            ->where(function ($query) use ($user) {
                $query->whereHas('shop', function ($shopQuery) use ($user) {
                    $shopQuery->where('user_id', $user->id);
                })
                    ->orWhere('user_id', $user->id);
            })
            ->whereIn('payment_status', ['paid', 'cancelled'])
            ->orderByDesc('id');

        // Execute
        $shopPayments = $paymentsQuery->get();

        // Attach a simplified user_data payload to each payment
        $shopPayments->transform(function ($payment) {
            $payment->user_data = [
                'name'   => $payment->user->name ?? 'A Creator',
                'avatar' => $payment->user->avatar_url ?? null,
                'uuid'   => $payment->user->uuid ?? null,
            ];
            return $payment;
        });

        return response()->json([
            'status'        => true,
            'shop_payments' => $shopPayments,
        ]);
    }
}
