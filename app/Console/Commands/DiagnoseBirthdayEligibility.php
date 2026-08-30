<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Support\CatalogueRegistry;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Why is this creator not in Birthday Discovery?
 *
 * 🚨 WRITTEN BECAUSE "NOTHING HAPPENED" IS NOT A DIAGNOSIS. Birthday Discovery
 * puts EIGHT independent gates between a creator having a birthday and anybody
 * hearing about it — opt-in, two derived date columns, six shared eligibility
 * clauses and a live-listing check — and every one of them fails the same way:
 * the creator simply is not in the result. `birthday:remind` can only report
 * "0 eligible creator(s)", which is true and tells nobody which gate to fix.
 *
 * ⚠️ READ-ONLY. No writes, no mail, no claims, no cache warming. It is safe to
 * run against production, which is the whole point — the gates that matter are
 * the ones holding real creators back, and none of them reproduce locally.
 *
 * ⚠️ IT DOES NOT REIMPLEMENT ELIGIBILITY. Every clause here is read from the
 * same place the real query reads it (`DiscoveryEligibility`'s columns and
 * `CatalogueRegistry::TYPES`), and the final line calls
 * `BirthdayDiscoveryService::creatorsWithBirthdayOn()` itself — so if this
 * command and the feature ever disagree, the feature is right and this is the
 * thing that is broken. A diagnostic that can drift from what it diagnoses is
 * worse than none.
 *
 * 🚨 THE BIRTH YEAR IS NEVER PRINTED. `date_of_birth` is reported only as
 * present/absent, never as a value — the same promise the rest of this feature
 * keeps, and a console log on a shared machine is not a safe place to break it.
 */
class DiagnoseBirthdayEligibility extends Command
{
    protected $signature = 'birthday:diagnose {username : The creator\'s @username}';

    protected $description = 'Report, gate by gate, why a creator does or does not appear in Birthday Discovery (read-only)';

    public function handle(): int
    {
        $user = User::where('username', $this->argument('username'))->first();

        if (! $user) {
            $this->error('No user with that username.');

            return self::FAILURE;
        }

        $this->line('');
        $this->info("Creator #{$user->id} @{$user->username}");
        $this->line('');

        $fails = [];

        // ── The birthday columns themselves ────────────────────────────────
        if (! Schema::hasColumn('users', 'birthday_discovery_opt_in')) {
            $this->error('  The birthday columns do not exist on this database. Migration 2026_08_21_200000 has not run.');

            return self::FAILURE;
        }

        // ⚠️ Present/absent only. The year is never printed.
        $this->gate($fails, 'date_of_birth on file', filled($user->date_of_birth),
            'Nothing to derive the day and month from. The creator sets this on their profile.');

        $this->gate($fails, 'birthday_day derived', filled($user->birthday_day),
            'DOB is on file but the day column is empty — ProfileController derives it on save, so a row predating that never got one.');

        $this->gate($fails, 'birthday_month derived', filled($user->birthday_month),
            'As above.');

        $this->gate($fails, 'opted in to Birthday Discovery', (int) $user->birthday_discovery_opt_in === 1,
            'THE CREATOR\'S OWN SWITCH, and it defaults OFF — a birthday on file is not consent. Creator Studio → account page.');

        // ── The six shared eligibility clauses (DiscoveryEligibility::scope) ─
        $this->gate($fails, 'is a creator (role 1)', (int) $user->role === 1, 'Fan accounts are never listed.');
        $this->gate($fails, 'not suspended', (int) ($user->suspended_account ?? 0) === 0, 'Suspended accounts are excluded everywhere.');
        $this->gate($fails, 'profile approved (profile_status_lock = 2)', (int) $user->profile_status_lock === 2,
            'The profile has not passed review. 1 = submitted and waiting, 0 = never submitted.');
        $this->gate($fails, 'avatar present and approved', filled($user->avatar) && (int) $user->avatar_approved === 1,
            'A card needs a picture that has been through moderation.');
        $this->gate($fails, 'has a name and a username', filled($user->name) && filled($user->username), '');

        if (Schema::hasColumn('users', 'exclude_from_discovery')) {
            $this->gate($fails, 'not excluded from discovery', ! (int) ($user->exclude_from_discovery ?? 0),
                'An admin has switched this creator out of every discovery surface.');
        }

        // ── Something to sell ──────────────────────────────────────────────
        $live = $this->liveListingCount($user);
        $this->gate($fails, "has at least one live listing (found {$live})", $live > 0,
            'A card that leads to an empty shelf is a dead end, so a creator with nothing live is not listed.');

        // ── The real query, as the ground truth ────────────────────────────
        $this->line('');

        $verdict = $this->appearsInTheRealQuery($user);

        if ($verdict === null) {
            $this->warn('  Birthday is not 7, 1 or 0 days away, so no REMINDER stage matches today. Nothing above is necessarily wrong.');
        } elseif ($verdict) {
            $this->info('  ✅ The real query DOES return this creator. They are in Birthday Discovery.');
        } else {
            $this->error('  ❌ The real query does NOT return this creator.');
        }

        $this->line('');

        if ($fails !== []) {
            $this->error('Fix these, in this order:');
            foreach ($fails as $i => $f) {
                $this->line('  '.($i + 1).'. '.$f);
            }
            $this->line('');
        }

        /*
         * 🚨 THE WEEK IS THE MOST MISREAD PART OF THIS FEATURE, so it is reported
         * explicitly rather than left to be worked out.
         *
         * `/discover/birthdays` shows the CURRENT Monday-to-Sunday week only. A
         * creator whose birthday is four days away can therefore be completely
         * eligible and still absent — because those four days land in NEXT week.
         * Both `birthday:remind` and `birthday:weekly` report that as a bare "0",
         * which reads as "nobody qualifies" and sends whoever is looking off to
         * hunt for a broken gate that is not broken.
         */
        $this->line('');
        $this->reportWeek($user);

        // ── The two things that are not about this creator at all ──────────
        $this->comment('Even with every gate above green:');
        $this->line(sprintf(
            '  · The weekly campaign needs %d eligible creators with a birthday that week (collection_min_creators); below that it sends nothing and /discover/birthdays greys itself out.',
            (int) config('discovery.birthday.collection_min_creators', 3)
        ));
        $this->line(sprintf(
            '  · Sending flags: reminders=%s, weekly=%s.',
            var_export((bool) config('discovery.birthday.birthday_reminders'), true),
            var_export((bool) config('discovery.birthday.birthdays_this_week'), true)
        ));
        $this->line('  · Nothing is delivered without `queue:work` running — the fan-out is queued per recipient.');
        $this->line('');

        return self::SUCCESS;
    }

    /**
     * Which week does this creator's birthday fall in, and when does the
     * collection page start showing them?
     */
    private function reportWeek(User $user): void
    {
        if (! filled($user->birthday_day) || ! filled($user->birthday_month)) {
            return;
        }

        $thisWeekStart = BirthdayDiscoveryService::weekStart(Carbon::now());
        $thisWeekEnd = $thisWeekStart->copy()->addDays(6);

        // The next occurrence of their day/month, from today forward.
        $next = Carbon::create(
            (int) Carbon::now()->year,
            (int) $user->birthday_month,
            (int) $user->birthday_day
        )->startOfDay();

        if ($next->lt(Carbon::now()->startOfDay())) {
            $next->addYear();
        }

        $birthdayWeekStart = BirthdayDiscoveryService::weekStart($next);

        $this->comment('The week:');
        $this->line(sprintf('  · Today is %s. The page is showing %s – %s.',
            Carbon::now()->format('D j M'),
            $thisWeekStart->format('j M'),
            $thisWeekEnd->format('j M')
        ));
        $this->line(sprintf('  · Their next birthday is %s, which is in the week of %s.',
            $next->format('D j M'),
            $birthdayWeekStart->format('j M')
        ));

        if ($birthdayWeekStart->equalTo($thisWeekStart)) {
            $this->line('  · That IS this week, so the week is not what is keeping them off the page.');
        } else {
            $this->warn(sprintf(
                '  · 🚨 THAT IS NOT THIS WEEK. They cannot appear until %s, however green every gate above is.',
                $birthdayWeekStart->format('D j M')
            ));
        }
    }

    /** @param  array<int, string>  $fails */
    private function gate(array &$fails, string $label, bool $ok, string $why): void
    {
        $this->line(sprintf('  %s  %s', $ok ? '<info>PASS</info>' : '<error>FAIL</error>', $label));

        if (! $ok && $why !== '') {
            $fails[] = $label.' — '.$why;
        }
    }

    /**
     * ⚠️ Driven by `CatalogueRegistry::TYPES`, exactly as `liveItemCounts()` is,
     * so a seventh sellable type never needs an edit here and the two cannot
     * disagree about what "live" means.
     */
    private function liveListingCount(User $user): int
    {
        $total = 0;

        foreach (CatalogueRegistry::TYPES as $type => $cfg) {
            $query = $cfg['model']::query()->where($cfg['owner'], $user->id);

            if ($cfg['approval']) {
                $query->where($cfg['approval'], 1);
            }

            if ($type === 'piggy_pot') {
                $query->where('status', 'active');
            }

            $total += $query->count();
        }

        return $total;
    }

    /**
     * The ground truth: ask the service itself, for whichever of the three
     * stages this creator's birthday falls on. Returns null when none of them
     * is today — that is not a failure, just the wrong day to be asking.
     */
    private function appearsInTheRealQuery(User $user): ?bool
    {
        if (! filled($user->birthday_day) || ! filled($user->birthday_month)) {
            return false;
        }

        $service = app(BirthdayDiscoveryService::class);

        foreach (BirthdayDiscoveryService::STAGES as $stage) {
            $target = Carbon::now()->startOfDay()->addDays($stage);

            if ((int) $target->day !== (int) $user->birthday_day
                || (int) $target->month !== (int) $user->birthday_month) {
                continue;
            }

            return array_key_exists($user->id, $service->creatorsWithBirthdayOn($target));
        }

        return null;
    }
}
