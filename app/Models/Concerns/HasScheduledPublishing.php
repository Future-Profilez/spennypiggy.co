<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * A listing with a future `publish_at` is not on sale yet.
 *
 * 🚨 **This is a GLOBAL SCOPE on purpose, and it is the load-bearing decision.** A
 * listing's visibility is decided in roughly fifteen places — `UserProfileService`'s six
 * methods, `DiscoveryService`'s ten map closures, two sitemaps, the item pages, and the
 * seven checkout gates. Adding the predicate to each would mean finding every one of
 * them, and being wrong once is **silent** — and the silent failure here is *someone buys
 * something that is not on sale yet*, which is money moving for a product the creator has
 * not launched.
 *
 * Deliberately NOT viewer-aware, for the same reason `Post`'s scope is not: a scope that
 * let the owner through would also let the sitemap and the checkout through on any query
 * that happens to run inside an authenticated request. Surfaces that must see a scheduled
 * listing — the creator's own catalogue, the module manage screens, edit, delete, and the
 * publisher — opt out explicitly with `withScheduled()`.
 *
 * ⚠️ Visibility is decided by TIME, not by the publisher command. The scope compares
 * `publish_at` to the clock on every query, so a listing goes live at its appointed minute
 * whether or not `listings:publish-scheduled` ever runs. A dead queue worker must not mean
 * a creator's launch silently fails; the command owns only the once-per-listing work
 * (clearing the guest profile cache, telling the creator) and claims it with
 * `schedule_released_at`.
 *
 * ⚠️ Approval is unchanged and still applies. A scheduled listing that reaches its time
 * without being approved does not go live — it goes live when an admin approves it, like
 * any other listing.
 */
trait HasScheduledPublishing
{
    public static function bootHasScheduledPublishing(): void
    {
        static::addGlobalScope('published', function (Builder $query) {
            $table = $query->getModel()->getTable();

            $query->where(function (Builder $inner) use ($table) {
                $inner->whereNull($table.'.publish_at')
                    ->orWhere($table.'.publish_at', '<=', now());
            });
        });
    }

    /** Include listings whose publish time has not arrived yet. */
    public function scopeWithScheduled(Builder $query): Builder
    {
        return $query->withoutGlobalScope('published');
    }

    /** Only listings still waiting on their publish time. */
    public function scopeOnlyScheduled(Builder $query): Builder
    {
        return $query->withoutGlobalScope('published')
            ->whereNotNull($query->getModel()->getTable().'.publish_at')
            ->where($query->getModel()->getTable().'.publish_at', '>', now());
    }

    /**
     * Is this listing still waiting to go live?
     *
     * Appended so a card can label itself without every caller re-deriving the comparison
     * — and getting the timezone wrong in one of them.
     */
    public function getIsScheduledAttribute(): bool
    {
        return $this->publish_at !== null && $this->publish_at->isFuture();
    }
}
