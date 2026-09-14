<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * 🚨 A LISTING THAT FAILED AT STRIPE WAS INVISIBLE TO EVERYONE BUT THE CREATOR.
 *
 * Shop, wish, bill and membership all write their row FIRST — the Stripe product
 * payload needs the row's own uuid and image url — and call Stripe afterwards.
 * On failure each caught the exception, soft-deleted the row it had just written
 * and answered the browser with the raw Stripe message. Nothing else happened:
 *
 *   - `report()` was never called, so Sentry saw nothing;
 *   - `StripeControl::createProduct()` logs its ApiErrorException at INFO, and the
 *     `sentry` log channel carries error and above, so that line went nowhere either;
 *   - the row was gone, so no queue, no admin screen and no report could show it.
 *
 * The creator was therefore the ONLY party who knew they could not publish, and
 * the platform's own record of the attempt was the phantom `listing_created` row
 * the activity projector had already swept. Measured live (12 Sep 2026): five
 * "published a shop listing" entries in the admin feed for a creator whose shop
 * was empty, and a support ticket asking why publishing did not work.
 *
 * 🚨 THE STRIPE MESSAGE IS NOT SHOWN TO THE CREATOR. It is written for an
 * integrator ("No such price", "parameter_invalid_empty") and tells the person
 * reading it nothing they can act on; the house rule elsewhere in this app is
 * that Stripe's own text never reaches a creator. They get a plain sentence and a
 * REFERENCE, which is the same string Sentry is tagged with — so a screenshot of
 * the toast is enough to find the exact failure.
 */
final class ListingRollback
{
    /**
     * Undo a listing whose Stripe product could not be created, and make sure
     * somebody other than the creator finds out.
     *
     * @param  Model|null  $item  The row already written for this listing.
     * @param  array  $context  Anything that identifies the attempt. NEVER a secret.
     * @param  bool  $rollback  False on an EDIT — the listing already existed and
     *                          its orders point at it, so a transient Stripe error
     *                          must not destroy it. The reporting half still runs.
     * @return string The creator-facing message, reference included.
     */
    public static function stripeFailed(?Model $item, Throwable $e, array $context = [], bool $rollback = true): string
    {
        $reference = strtoupper(Str::random(8));

        $context = array_merge($context, [
            'reference' => $reference,
            'model' => $item ? $item::class : null,
            'id' => $item?->getKey(),
            'creator_id' => $item?->getAttribute('user_id') ?? $item?->getAttribute('creator_id'),
        ]);

        /*
         * Logged at ERROR and reported separately, deliberately.
         *
         * The log line carries the context an operator needs and rides the
         * `sentry` channel; `report()` carries the stack trace and groups the
         * failures together. Neither is a substitute for the other, and this
         * path had NEITHER.
         */
        Log::error('Listing rolled back — Stripe would not create the product: '.$e->getMessage(), $context);
        report($e);

        try {
            if ($rollback) {
                $item?->delete();
            }
        } catch (Throwable $inner) {
            /*
             * 🚨 A FAILED ROLLBACK IS WORSE THAN THE ORIGINAL FAILURE and must be
             * loud: the row survives with no Stripe product, so the listing is on
             * the creator's page and cannot be bought. It is never swallowed.
             */
            Log::error('Listing rollback FAILED — a listing with no Stripe product is live: '.$inner->getMessage(), $context);
            report($inner);
        }

        if (! $rollback) {
            return 'We could not update this listing — the payment account would not accept the change. '
                ."Your existing listing is untouched. If it keeps failing, contact support and quote {$reference}.";
        }

        return 'We could not publish this listing — the payment account would not accept it. '
            ."Nothing was saved, so it is safe to try again. If it keeps failing, contact support and quote {$reference}.";
    }
}
