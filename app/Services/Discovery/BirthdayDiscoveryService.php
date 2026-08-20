<?php

namespace App\Services\Discovery;

use App\Models\FinancialTransaction;
use App\Models\User;
use App\Support\CatalogueRegistry;
use App\Support\DiscoverySources;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 4 — Birthday Discovery.
 *
 * The ONE place that answers "whose birthday is it, who may be shown, and what
 * may be shown about them". Three surfaces read it — the daily reminder sweep,
 * the Monday campaign and the Discover collection page — so they can never
 * disagree about who is eligible or about what a card carries.
 * Reference: Developer Master Plan, 19 Aug 2026, §C Phase 4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 THE BIRTH YEAR IS NEVER DISPLAYED PUBLICLY ANYWHERE.
 * ═══════════════════════════════════════════════════════════════════════════
 * The plan states that prohibition three times, so it is enforced structurally
 * rather than by remembering:
 *
 *   1. Every query in this class selects `birthday_day` / `birthday_month` and
 *      **NEVER `date_of_birth`**. The year is not in scope to be leaked.
 *   2. `card()` whitelists seven keys BY NAME rather than spreading a row —
 *      exactly as `CreatorRecommendationService::card()` does — so a column
 *      added to the select cannot reach a card by accident.
 *   3. `birthdayLabel()` builds its string from day + month only, through a
 *      fixed month table. There is no code path here that can render a year.
 *
 * 🚨 NOTHING READS AN AMOUNT EITHER. Creator earnings are never shown, and
 * "who gets featured" is deliberately NOT ranked on money, supporters or any
 * commercial signal — see `featuredForWeek()`.
 */
class BirthdayDiscoveryService
{
    /** Reminder stages, in days before the birthday. 0 = on the day. */
    public const STAGES = [7, 1, 0];

    /**
     * Ceiling on the eligible-creator query.
     *
     * Mirrors `CreatorRecommendationService::POOL_LIMIT` in spirit: a birthday
     * week is a naturally small set, and this only exists so a pathological
     * data state cannot pull the whole users table into memory.
     */
    private const QUERY_LIMIT = 500;

    /** Cache TTL for the week's featured list, in seconds. */
    private const WEEK_TTL = 900;

    /**
     * Month names for the public label.
     *
     * ⚠️ Deliberately a fixed table rather than `Carbon::create($year, $month, $day)`
     * — constructing a date to format it needs a YEAR, and the one thing this
     * feature may never handle is a year. Nothing here can be mis-set to
     * `->format('d F Y')` because there is no date object to format.
     */
    private const MONTHS = [
        1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
        5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
        9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
    ];

    // ───────────────────────────────────────────────────────────────────────
    // Flags
    // ───────────────────────────────────────────────────────────────────────

    /** 🚨 Ships FALSE. `config/discovery.php` → `birthday.birthday_reminders`. */
    public static function remindersEnabled(): bool
    {
        return (bool) config('discovery.birthday.birthday_reminders', false);
    }

    /** 🚨 Ships FALSE. `config/discovery.php` → `birthday.birthdays_this_week`. */
    public static function weeklyCampaignEnabled(): bool
    {
        return (bool) config('discovery.birthday.birthdays_this_week', false);
    }

    // ───────────────────────────────────────────────────────────────────────
    // Public reads
    // ───────────────────────────────────────────────────────────────────────

    /**
     * Eligible, opted-in creators whose birthday falls on this calendar day.
     *
     * ⚠️ 29 February is greeted on 28 February in a non-leap year, matching
     * `MilestonesNotify`. Without it a leap-year creator is skipped for three
     * years at a time — and unlike a bell notification, a birthday campaign
     * their supporters were promised simply never arrives.
     *
     * @return array<int, array<string, mixed>> cards, keyed by creator id
     */
    public function creatorsWithBirthdayOn(Carbon $date): array
    {
        $pairs = [[(int) $date->month, (int) $date->day]];

        if ((int) $date->month === 2 && (int) $date->day === 28 && ! $date->isLeapYear()) {
            $pairs[] = [2, 29];
        }

        return $this->cardsForDayPairs($pairs);
    }

    /**
     * Every eligible, opted-in creator with a birthday in the seven days from
     * `$weekStart` inclusive — the set the collection page and the Monday
     * campaign both draw from, BEFORE rotation trims it to ten.
     *
     * @return array<int, array<string, mixed>>
     */
    public function creatorsWithBirthdayInWeek(Carbon $weekStart): array
    {
        $pairs = [];
        $cursor = $weekStart->copy()->startOfDay();

        for ($i = 0; $i < 7; $i++) {
            $pairs[] = [(int) $cursor->month, (int) $cursor->day];

            // A 29 Feb creator is included in the week containing 28 Feb when
            // the year has no 29th, for the same reason as above.
            if ((int) $cursor->month === 2 && (int) $cursor->day === 28 && ! $cursor->isLeapYear()) {
                $pairs[] = [2, 29];
            }

            $cursor->addDay();
        }

        return $this->cardsForDayPairs($pairs);
    }

    /**
     * The up-to-ten creators featured for the week containing `$weekStart`.
     *
     * 🚨 EXPLICITLY NOT THE BIGGEST EARNERS — the brief names that exclusion
     * directly, and it is the whole point of the placement: a birthday is a
     * reason to introduce a supporter to somebody they have not met, so ranking
     * it commercially turns a discovery surface into a leaderboard the same ten
     * creators would win every week.
     *
     * The order is a SEEDED SHUFFLE. The seed is the ISO year-and-week, so:
     *   • within a week the list is STABLE — the Monday email and the collection
     *     page show the same creators in the same order, and a supporter who
     *     clicks through from the email lands on the page they were shown;
     *   • between weeks it ROTATES — a different arrangement, and (when more
     *     than ten are eligible) a different ten, with no state to keep and
     *     nothing to reset;
     *   • it reads NO commercial signal at all. There is no amount, no supporter
     *     count and no rank anywhere in the sort.
     *
     * ⚠️ Seeded through `mt_srand`, whose global state is saved and restored
     * around the shuffle. Leaving it seeded would make every later `mt_rand()`
     * in the same process deterministic — including, on a queue worker, calls
     * in wholly unrelated jobs.
     *
     * @return array<int, array<string, mixed>>
     */
    public function featuredForWeek(Carbon $weekStart): array
    {
        $key = 'discovery_birthdays_week_v1_'.$weekStart->format('o-W');

        return Cache::remember($key, self::WEEK_TTL, function () use ($weekStart) {
            $cards = array_values($this->creatorsWithBirthdayInWeek($weekStart));

            if ($cards === []) {
                return [];
            }

            $seed = (int) $weekStart->format('oW');

            $previous = mt_rand();
            mt_srand($seed);
            shuffle($cards);
            mt_srand($previous);

            return array_slice($cards, 0, $this->maxFeatured());
        });
    }

    /** The brief's ten. */
    public function maxFeatured(): int
    {
        return max(1, (int) config('discovery.birthday.max_featured', 10));
    }

    /**
     * How many eligible creators the collection page needs before it stops
     * showing its greyed "Coming soon" state.
     */
    public function collectionMinCreators(): int
    {
        return max(0, (int) config('discovery.birthday.collection_min_creators', 3));
    }

    /**
     * Monday of the week containing `$date`.
     *
     * The campaign and the collection page must agree on where a week starts,
     * and `startOfWeek()` honours the app locale — a locale change would
     * silently move the boundary and desynchronise the two surfaces.
     */
    public static function weekStart(Carbon $date): Carbon
    {
        return $date->copy()->startOfDay()->startOfWeek(Carbon::MONDAY);
    }

    // ───────────────────────────────────────────────────────────────────────
    // Supporters
    // ───────────────────────────────────────────────────────────────────────

    /**
     * The creator's EXISTING supporters — people who have actually paid them.
     *
     * Read off `financial_transactions`, the canonical ledger, rather than the
     * nine payment tables: `LedgerRules` exists because those tables each had
     * their own idea of what counts, and "who supports this creator" must not
     * become a tenth answer.
     *
     * ⚠️ Followers are deliberately NOT included. The brief says *existing
     * supporters*, and a follow is not a purchase — mailing every follower of
     * every opted-in creator turns a warm reminder into a broadcast.
     *
     * ⚠️ Guest purchases have no `supporter_id` and are skipped. A guest never
     * agreed to a mailing list; their only consent was to one transaction.
     *
     * @return array<int, int> supporter user ids
     */
    public function supporterIdsFor(int $creatorId): array
    {
        return FinancialTransaction::query()
            ->where('user_id', $creatorId)
            ->where('type', 'income')
            ->whereNotNull('supporter_id')
            ->where('supporter_id', '!=', $creatorId)
            ->distinct()
            ->limit((int) config('discovery.birthday.max_reminder_recipients', 5000))
            ->pluck('supporter_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    // ───────────────────────────────────────────────────────────────────────
    // Labels
    // ───────────────────────────────────────────────────────────────────────

    /**
     * "12 March" — day and month, never a year.
     *
     * @see self::MONTHS for why this is not built from a date object.
     */
    public static function birthdayLabel(?int $day, ?int $month): ?string
    {
        $day = (int) $day;
        $month = (int) $month;

        if ($day < 1 || $day > 31 || ! isset(self::MONTHS[$month])) {
            return null;
        }

        return $day.' '.self::MONTHS[$month];
    }

    // ───────────────────────────────────────────────────────────────────────
    // Internals
    // ───────────────────────────────────────────────────────────────────────

    /**
     * Build cards for a set of [month, day] pairs.
     *
     * @param  array<int, array{0:int,1:int}>  $pairs
     * @return array<int, array<string, mixed>> keyed by creator id
     */
    private function cardsForDayPairs(array $pairs): array
    {
        if ($pairs === []) {
            return [];
        }

        $rows = $this->eligibleCreators($pairs);

        if ($rows->isEmpty()) {
            return [];
        }

        /*
         * 🚨 "At least one thing live to buy or join" is a HARD gate, exactly as
         * it is in Phase 3. A birthday email that lands a supporter on a profile
         * with nothing on it is worse than no email — it spends the one moment
         * the brief calls "a natural moment for supporters to spend" on a dead
         * end, in the creator's name.
         */
        $liveItems = $this->liveItemCounts($rows->pluck('id')->all());

        $cards = [];

        foreach ($rows as $u) {
            if ((int) ($liveItems[$u->id] ?? 0) < 1) {
                continue;
            }

            $cards[(int) $u->id] = $this->card($u);
        }

        return $cards;
    }

    /**
     * Good standing, publicly visible, opted in, and not switched off by an admin.
     *
     * 🚨 The standing definition MIRRORS `CreatorRecommendationService::eligibleCreators()`
     * clause for clause — role, not suspended, `profile_status_lock = 2`,
     * approved avatar, a username and a name, and `exclude_from_discovery` off.
     * It is duplicated rather than shared **because that service is owned
     * elsewhere and must not be edited**; the duplication is deliberate and is
     * pinned by test. If that definition changes, this one changes with it.
     *
     * ⚠️ `exclude_from_discovery` and the two birthday columns are read through
     * `Schema::hasColumn`, the defensive pattern both `DiscoveryService` and
     * `CreatorRecommendationService` already use: both apps share one database,
     * and a column that has not landed yet must degrade rather than throw on a
     * public page.
     *
     * ⚠️ `date_of_birth` IS NOT SELECTED. See the class note.
     *
     * @param  array<int, array{0:int,1:int}>  $pairs
     */
    private function eligibleCreators(array $pairs)
    {
        // No birthday columns yet (shared DB, migration not run) → nobody is
        // eligible. Silently empty is the right failure: it shows the collection
        // page's coming-soon state and sends no mail.
        if (! Schema::hasColumn('users', 'birthday_day')
            || ! Schema::hasColumn('users', 'birthday_month')
            || ! Schema::hasColumn('users', 'birthday_discovery_opt_in')) {
            return collect();
        }

        $query = User::query()
            ->where('role', 1)
            ->where('birthday_discovery_opt_in', 1)
            ->whereNotNull('birthday_day')
            ->whereNotNull('birthday_month')
            ->where(function ($q) use ($pairs) {
                foreach ($pairs as [$month, $day]) {
                    $q->orWhere(function ($inner) use ($month, $day) {
                        $inner->where('birthday_month', $month)->where('birthday_day', $day);
                    });
                }
            })
            ->where('suspended_account', 0)
            // 2 = profile reviewed and public. A locked or pending profile is
            // not something to send a supporter to.
            ->where('profile_status_lock', 2)
            ->where('avatar_approved', 1)
            ->whereNotNull('avatar')
            ->whereNotNull('username')
            ->where('username', '!=', '')
            ->whereNotNull('name')
            ->where('name', '!=', '');

        if (Schema::hasColumn('users', 'exclude_from_discovery')) {
            $query->where(function ($q) {
                $q->where('exclude_from_discovery', 0)->orWhereNull('exclude_from_discovery');
            });
        }

        return $query->orderBy('id')
            ->limit(self::QUERY_LIMIT)
            ->get([
                'id', 'name', 'username', 'role', 'created_at',
                'avatar', 'avatar_approved', 'avatar_cdn_modifier',
                'cover', 'cover_approved', 'cover_cdn_modifier',
                'bio', 'bio_approved', 'profile_status_lock',
                'birthday_day', 'birthday_month',
                // 🚨 `date_of_birth` is absent from this list on purpose.
            ]);
    }

    /**
     * 🚨 AN EXPLICIT WHITELIST, NEVER A SPREAD.
     *
     * Seven keys by name. A column added to the select above — or an accessor
     * appended to the model — cannot reach an e-mail or a public page by being
     * added somewhere else, which is the only reliable way to keep a promise
     * this specific about one field.
     *
     * The five things the brief names for a card are all here: image, display
     * name, @username, short line, View profile (the tagged `url`). Plus the
     * birthday label, which is day-and-month only.
     *
     * @return array<string, mixed>
     */
    private function card($u): array
    {
        return [
            'id' => (int) $u->id,
            'name' => $u->name,
            'username' => $u->username,
            'avatar_url' => $u->avatar_url,
            // Read through the approval flag rather than the accessor's
            // judgement: `profileMediaVisible()` is viewer-dependent and returns
            // true for the OWNER of an unapproved asset, and this array is
            // cached and mailed to other people.
            'cover_url' => (int) $u->cover_approved === 1 ? ($u->cover_url ?: null) : null,
            'line' => $this->line($u),
            // 🚨 Day and month. There is no year in this payload.
            'birthday_label' => self::birthdayLabel($u->birthday_day, $u->birthday_month),
            'birthday_day' => (int) $u->birthday_day,
            'birthday_month' => (int) $u->birthday_month,
        ];
    }

    /**
     * The short line under the name.
     *
     * ⚠️ CONTENT-FIRST, AND NO NUMBERS — same rule as Phase 3. The creator's own
     * APPROVED bio first, a neutral line otherwise. An unapproved bio has not
     * passed review and this surface publishes it in an e-mail to strangers.
     */
    private function line($u): string
    {
        if (filled($u->bio) && (int) $u->bio_approved === 1) {
            $bio = trim(preg_replace('/\s+/', ' ', strip_tags((string) $u->bio)));

            if ($bio !== '') {
                return mb_strimwidth($bio, 0, 96, '…');
            }
        }

        return 'Creating on Spenny Piggy';
    }

    /**
     * "Has something live to buy or join", counted once per sellable type.
     *
     * Driven by `CatalogueRegistry::TYPES` for the same reason Phase 3 is: the
     * six modules disagree about what "live" means, and a seventh sellable type
     * must not need an edit here.
     *
     * @param  array<int, int>  $ids
     * @return array<int, int>
     */
    private function liveItemCounts(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        $counts = [];

        foreach (CatalogueRegistry::TYPES as $type => $cfg) {
            $model = $cfg['model'];
            $owner = $cfg['owner'];
            $table = $cfg['table'];

            $query = $model::query()->whereIn($owner, $ids);

            if ($cfg['approval']) {
                $query->where($cfg['approval'], 1);
            }

            // A pot has no boolean approval column; `moderation_hold` is its held state.
            if ($type === 'piggy_pot') {
                $query->where('status', 'active');
            }

            if ($cfg['suspend']) {
                $query->where(function ($q) use ($cfg) {
                    $q->where($cfg['suspend'], 0)->orWhereNull($cfg['suspend']);
                });
            }

            /*
             * ⚠️ `whereNotIn` on a NULLable column drops the NULL rows too — SQL
             * says NULL NOT IN (…) is NULL, not true. Most rows have no status
             * at all, so the naive form reports the whole platform as having
             * nothing live.
             */
            if ($cfg['active'] && Schema::hasColumn($table, $cfg['active'])) {
                $query->where(function ($q) use ($cfg) {
                    $q->whereNull($cfg['active'])
                        ->orWhereNotIn($cfg['active'], ['paused', 'archived', 'inactive', 'draft', 'deleted']);
                });
            }

            // A scheduled listing is not on sale yet.
            if (Schema::hasColumn($table, 'publish_at')) {
                $query->where(function ($q) {
                    $q->whereNull('publish_at')->orWhere('publish_at', '<=', Carbon::now());
                });
            }

            $rows = $query->selectRaw($owner.' as owner_id, COUNT(*) as total')
                ->groupBy($owner)
                ->pluck('total', 'owner_id');

            foreach ($rows as $ownerId => $total) {
                $counts[(int) $ownerId] = ($counts[(int) $ownerId] ?? 0) + (int) $total;
            }
        }

        return $counts;
    }

    /**
     * A Discovery-tagged profile URL for a card.
     *
     * 🚨 Built server-side through `DiscoverySources::profileUrl()` — never
     * hand-assembled in a Blade view. A surface that is not tagged is invisible
     * for ever: attribution is recorded at the moment of the visit and there is
     * no backfill, and an unrecognised key is dropped in SILENCE, which looks
     * exactly like a tagged link that works.
     *
     * @param  array<int, array<string, mixed>>  $cards
     * @return array<int, array<string, mixed>>
     */
    public static function tag(array $cards, string $source): array
    {
        return array_map(function (array $card) use ($source): array {
            $card['url'] = ! empty($card['username'])
                ? DiscoverySources::profileUrl($card['username'], $source)
                : null;

            return $card;
        }, $cards);
    }
}
