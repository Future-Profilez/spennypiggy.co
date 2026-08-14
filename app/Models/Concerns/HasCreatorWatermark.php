<?php

namespace App\Models\Concerns;

/**
 * Resolves the owning creator's watermark uuid for an item model.
 *
 * 🚨 Reads the relation ONLY when it is already loaded. These accessors run
 * inside `perma_link`/`image_url`, which are appended attributes serialised for
 * every row of every feed, profile and discover payload on the site — a
 * relation lookup here would be one query per card. A surface that has not
 * eager-loaded the owner simply serves the image unwatermarked, which is the
 * same fail-open answer the rest of this feature gives.
 *
 * The consequence is real and intended: to watermark a surface, eager-load its
 * owner and include `watermark_uuid` in whatever column list that surface
 * selects. An unselected column is null, and null means no watermark.
 */
trait HasCreatorWatermark
{
    /**
     * Set directly by a caller that already holds the owner and does NOT want
     * the relation loaded.
     *
     * 🚨 This exists because eager-loading `user` purely for the watermark is a
     * trap: once the relation is loaded it is also SERIALISED, and `User` has
     * ~15 appended accessors, several of which query per row. On a paginated
     * post feed that is the documented 206-query blow-up. A profile page
     * already holds its owner, so it can hand the uuid over for free.
     */
    public ?string $creatorWatermarkOverride = null;

    public function creatorWatermarkUuid(string $relation = 'user'): ?string
    {
        if (is_string($this->creatorWatermarkOverride) && $this->creatorWatermarkOverride !== '') {
            return $this->creatorWatermarkOverride;
        }

        if (! $this->relationLoaded($relation)) {
            return null;
        }

        $owner = $this->getRelation($relation);

        if (! $owner) {
            return null;
        }

        $uuid = $owner->watermark_uuid ?? null;

        return is_string($uuid) && $uuid !== '' ? $uuid : null;
    }
}
