<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Auth;

/**
 * Shared behaviour for every sellable item that carries the unified reward
 * contract (reward_title / reward_type / reward_body / reward_description).
 *
 * Two rules live here so no model can forget them:
 *
 * 1. `reward_body` holds the paid deliverable when the reward is a message or
 *    a link. Serialising it on a public listing hands the content to anyone who
 *    can see the card, so it stays hidden and entitled surfaces opt back in
 *    with revealReward(). (Shop already applies the same rule to reward_file.)
 *
 * 2. A listing must never render an empty reward headline. Legacy rows were
 *    backfilled by migration; this accessor covers anything the backfill
 *    missed and any row created before the editor made the field required.
 */
trait HasRewardContract
{
    /** Columns every item table gained with the reward contract. */
    public static array $rewardContractColumns = [
        'reward_title',
        'reward_type',
        'reward_body',
        'reward_description',
    ];

    public const DEFAULT_REWARD_TITLE = 'Exclusive reward';

    /**
     * The creator always sees their own reward body — without this the edit
     * form loads with an empty message/link box and silently wipes the content
     * on save, because $hidden keeps it out of the serialised item.
     *
     * Buyers are handled separately (RewardService + the entitlement check on
     * the thank-you page); this only ever reveals a row to the person who owns
     * it.
     */
    public static function bootHasRewardContract(): void
    {
        static::retrieved(function ($model) {
            if (Auth::check() && $model->rewardOwnerId() === (int) Auth::id()) {
                $model->makeVisible(['reward_body']);
            }
        });
    }

    /** Most item tables key the creator as user_id; tasks use creator_id. */
    public function rewardOwnerId(): ?int
    {
        foreach (['user_id', 'creator_id'] as $column) {
            $value = $this->getAttribute($column);

            if ($value !== null) {
                return (int) $value;
            }
        }

        return null;
    }

    /**
     * Make the paid reward body serialisable. Call ONLY where the viewer is
     * entitled to it: the owning creator, or a buyer with a paid row.
     */
    public function revealReward(): static
    {
        return $this->makeVisible(['reward_body']);
    }

    public function getRewardTitleAttribute($value): string
    {
        $value = is_string($value) ? trim($value) : '';

        return $value !== '' ? $value : self::DEFAULT_REWARD_TITLE;
    }
}
