<?php

namespace Tests\Feature;

use App\Mail\BirthdayReminder;
use App\Mail\BirthdaysThisWeek;
use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\WishItem;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Services\Discovery\CreatorRecommendationService;
use App\Support\DiscoverySources;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Discovery Phase 4 — Birthday Discovery.
 *
 * The three things pinned hardest here are the three that fail SILENTLY:
 *
 *   1. 🚨 THE BIRTH YEAR. `users.date_of_birth` is NOT in `User::$hidden`, so the
 *      only thing keeping a year out of a public card and out of an e-mail sent
 *      to strangers is that the service never selects it and `card()` whitelists
 *      its keys. Both are asserted against a creator whose real birth year is on
 *      file — an actual year in the actual data, not a hypothetical.
 *   2. ONE COPY PER PERSON for the Monday campaign. Supporting eight of the
 *      week's creators must still produce exactly one e-mail, which is a property
 *      of the dedup key (the ISO week, and nothing else) rather than of the loop.
 *   3. The eligibility clause list is DUPLICATED between this feature and
 *      `CreatorRecommendationService`, on purpose. Duplication that nothing
 *      compares is duplication that drifts, so every clause is asserted against
 *      BOTH services in one test.
 *
 * ⚠️ NO NETWORK. `Mail::fake()` everywhere a command runs; mailables are
 * rendered in-process with `->render()`, which sends nothing. See
 * `EmailDomainPolicyTest` for why a test that depends on a third party's DNS or
 * mail server is a test that fails for reasons unrelated to the code.
 */
class BirthdayDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    /** A real birth year, on file, for every creator this test builds. */
    private const BIRTH_YEAR = '1990';

    private const DOB = '1990-03-12';

    protected function setUp(): void
    {
        parent::setUp();

        // The week's featured list and Phase 3's pool are both platform-wide
        // caches; a leftover from the previous test makes every assertion below
        // meaningless.
        Cache::flush();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    // ───────────────────────────────────────────────────────────────── helpers

    private function service(): BirthdayDiscoveryService
    {
        Cache::flush();

        return app(BirthdayDiscoveryService::class);
    }

    /**
     * A creator who satisfies every eligibility rule AND has a birthday on file
     * — including a real `date_of_birth`, which is the hazard this suite exists
     * to pin.
     *
     * ⚠️ `array_merge`, never `+`: PHP's union operator keeps the LEFT value for
     * a duplicate key, so overrides applied with `+` are silently discarded and
     * an "ineligible" fixture comes out perfectly eligible.
     */
    private function birthdayCreator(int $month = 3, int $day = 12, array $force = []): User
    {
        $user = User::factory()->create(['role' => 1]);

        $user->forceFill(array_merge([
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
            'date_of_birth' => self::DOB,
            'birthday_day' => $day,
            'birthday_month' => $month,
            'birthday_discovery_opt_in' => 1,
        ], $force))->save();

        WishItem::factory()->create(['user_id' => $user->id, 'is_approved' => 1]);

        return $user->refresh();
    }

    /** A creator eligible for Phase 3 but with NO birthday — used as the viewed profile. */
    private function plainCreator(array $force = []): User
    {
        $user = User::factory()->create(['role' => 1]);

        $user->forceFill(array_merge([
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
        ], $force))->save();

        WishItem::factory()->create(['user_id' => $user->id, 'is_approved' => 1]);

        return $user->refresh();
    }

    private function supporterOf(User $creator, ?User $supporter = null): User
    {
        $supporter = $supporter ?: User::factory()->create(['role' => 0]);

        FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'type' => 'income',
            'gross_amount' => 20,
            'net_amount' => 20,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => Carbon::now(),
        ]);

        return $supporter;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. The birth year
    // ══════════════════════════════════════════════════════════════════════

    /**
     * 🚨 The whole promise, asserted against rendered HTML rather than against
     * the payload — the payload is only half the path.
     */
    public function test_the_birth_year_appears_nowhere_in_a_rendered_reminder_email(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));

        $creator = $this->birthdayCreator();
        $supporter = $this->supporterOf($creator);

        $card = $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'))[$creator->id];

        // Belt and braces: even a caller who hands in a year-bearing card must
        // not be able to render one.
        $card['date_of_birth'] = self::DOB;

        foreach (BirthdayDiscoveryService::STAGES as $stage) {
            $html = (new BirthdayReminder($supporter->id, $stage, $card))->render();

            $this->assertStringNotContainsString(self::BIRTH_YEAR, $html, "stage {$stage} leaked the birth year");
            $this->assertStringNotContainsString(self::DOB, $html);
            // The day and month ARE the point of the e-mail, so their absence
            // would make the assertion above pass for the wrong reason.
            $this->assertStringContainsString('12 March', $html);
        }
    }

    public function test_the_birth_year_appears_nowhere_in_a_rendered_weekly_campaign_email(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));

        $creators = collect(range(0, 2))->map(fn ($i) => $this->birthdayCreator(3, 10 + $i));
        $recipient = User::factory()->create(['role' => 0]);

        $cards = array_values($this->service()->featuredForWeek(
            BirthdayDiscoveryService::weekStart(Carbon::parse('2026-03-09'))
        ));

        $this->assertCount(3, $cards);

        $cards = array_map(function (array $card) {
            $card['date_of_birth'] = self::DOB;

            return $card;
        }, $cards);

        $html = (new BirthdaysThisWeek($recipient->id, $cards, '9 Mar – 15 Mar'))->render();

        $this->assertStringNotContainsString(self::BIRTH_YEAR, $html);
        $this->assertStringNotContainsString(self::DOB, $html);
        $this->assertStringContainsString($creators->first()->username, $html);
    }

    /**
     * The whitelist itself. A column added to the select — or an accessor added
     * to the model — must not be able to reach a card.
     */
    public function test_a_card_carries_an_exact_whitelist_and_no_year(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:00:00'));

        $creator = $this->birthdayCreator();

        $card = $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'))[$creator->id];

        $this->assertSame([
            'id', 'name', 'username', 'avatar_url', 'cover_url', 'line',
            'birthday_label', 'birthday_day', 'birthday_month',
        ], array_keys($card));

        $this->assertArrayNotHasKey('date_of_birth', $card);
        $this->assertSame('12 March', $card['birthday_label']);

        foreach ($card as $value) {
            if (is_scalar($value)) {
                $this->assertStringNotContainsString(self::BIRTH_YEAR, (string) $value);
            }
        }
    }

    /**
     * 🚨 STRUCTURAL: the year is never even IN SCOPE to be leaked.
     *
     * `users.date_of_birth` is not in `User::$hidden`, so a select that pulled
     * the whole row would put a year on a hydrated model that a future `card()`
     * edit could spread. Asserted against the executed SQL rather than by
     * reading the source, because a `select('*')` added later would still pass a
     * source-level check on `card()`.
     */
    public function test_no_query_this_feature_runs_ever_selects_date_of_birth(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:00:00'));

        $this->birthdayCreator();

        $service = $this->service();

        DB::enableQueryLog();
        DB::flushQueryLog();

        $service->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'));
        $service->creatorsWithBirthdayInWeek(BirthdayDiscoveryService::weekStart(Carbon::parse('2026-03-12')));

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertNotEmpty($queries);

        foreach ($queries as $query) {
            $this->assertStringNotContainsString('date_of_birth', $query['query']);
        }
    }

    /** There is no code path that can render a year, because there is no date object. */
    public function test_the_birthday_label_is_day_and_month_only(): void
    {
        $this->assertSame('12 March', BirthdayDiscoveryService::birthdayLabel(12, 3));
        $this->assertSame('1 January', BirthdayDiscoveryService::birthdayLabel(1, 1));
        $this->assertSame('29 February', BirthdayDiscoveryService::birthdayLabel(29, 2));

        // Nonsense in, nothing out — never a half-formed date.
        $this->assertNull(BirthdayDiscoveryService::birthdayLabel(0, 3));
        $this->assertNull(BirthdayDiscoveryService::birthdayLabel(12, 13));
        $this->assertNull(BirthdayDiscoveryService::birthdayLabel(null, null));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. One copy per person
    // ══════════════════════════════════════════════════════════════════════

    /**
     * 🚨 THE GUARANTEE. Eight of this week's creators, one supporter who has
     * paid all eight — one e-mail, and its claim row names the WEEK and nothing
     * else.
     */
    public function test_the_weekly_campaign_sends_one_copy_per_person_however_many_creators_they_support(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));
        config(['discovery.birthday.birthdays_this_week' => true]);
        Mail::fake();

        $supporter = User::factory()->create(['role' => 0]);

        for ($i = 0; $i < 8; $i++) {
            $creator = $this->birthdayCreator(3, 9 + $i);
            $this->supporterOf($creator, $supporter);
        }

        $this->artisan('birthday:weekly')->assertExitCode(0);

        $this->assertCount(
            1,
            Mail::sent(BirthdaysThisWeek::class)->filter(fn ($mail) => $mail->hasTo($supporter->email)),
            'a supporter of eight of the week\'s creators received more than one copy'
        );

        // The claim key is the ISO week and NOTHING ELSE — no creator id.
        $rows = EngagementNotification::where('user_id', $supporter->id)
            ->where('type', EngagementNotification::TYPE_BIRTHDAYS_THIS_WEEK)
            ->get();

        $this->assertCount(1, $rows);
        $this->assertSame('2026-W11', $rows->first()->dedup_key);
        $this->assertStringNotContainsString('|', $rows->first()->dedup_key);
    }

    /** A re-run inside the same week sends nothing more — the claim is what enforces it. */
    public function test_a_second_run_of_the_weekly_campaign_sends_nothing_more(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));
        config(['discovery.birthday.birthdays_this_week' => true]);
        Mail::fake();

        collect(range(0, 2))->each(fn ($i) => $this->birthdayCreator(3, 10 + $i));
        User::factory()->create(['role' => 0]);

        $this->artisan('birthday:weekly')->assertExitCode(0);
        $firstRun = Mail::sent(BirthdaysThisWeek::class)->count();
        $this->assertGreaterThan(0, $firstRun);

        $claims = EngagementNotification::where('type', EngagementNotification::TYPE_BIRTHDAYS_THIS_WEEK)->count();

        $this->artisan('birthday:weekly')->assertExitCode(0);

        $this->assertSame($firstRun, Mail::sent(BirthdaysThisWeek::class)->count());
        $this->assertSame($claims, EngagementNotification::where('type', EngagementNotification::TYPE_BIRTHDAYS_THIS_WEEK)->count());
    }

    /**
     * The contrast that makes the rule legible: the per-creator REMINDER is
     * deliberately one per creator, and its key carries the creator, the stage
     * and the BIRTHDAY DATE.
     *
     * 🚨 The date, not the year (26 Aug 2026). `birthday_day`/`birthday_month` are
     * derived from `date_of_birth`, so a creator correcting a mistyped date found
     * the corrected one already claimed by the wrong one's reminders — and every
     * supporter of that creator heard nothing for the rest of the year. A creator
     * has one birthday a year, so an unchanged date keys identically and the dedup
     * asserted at the foot of this test is unchanged.
     */
    public function test_a_reminder_is_per_creator_and_deduped_per_creator_stage_and_date(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
        config(['discovery.birthday.birthday_reminders' => true]);
        Mail::fake();

        $supporter = User::factory()->create(['role' => 0]);

        $creatorA = $this->birthdayCreator(3, 12);
        $creatorB = $this->birthdayCreator(3, 12);
        $this->supporterOf($creatorA, $supporter);
        $this->supporterOf($creatorB, $supporter);

        $this->artisan('birthday:remind --stage=0')->assertExitCode(0);

        $this->assertCount(
            2,
            Mail::sent(BirthdayReminder::class)->filter(fn ($mail) => $mail->hasTo($supporter->email))
        );

        $keys = EngagementNotification::where('user_id', $supporter->id)
            ->where('type', EngagementNotification::TYPE_BIRTHDAY_REMINDER)
            ->pluck('dedup_key')
            ->sort()
            ->values()
            ->all();

        $this->assertSame([
            $creatorA->id.'|0|2026-03-12',
            $creatorB->id.'|0|2026-03-12',
        ], $keys);

        // Re-run: claimed, so nothing more.
        $this->artisan('birthday:remind --stage=0')->assertExitCode(0);
        $this->assertCount(2, Mail::sent(BirthdayReminder::class));
    }

    /**
     * The same rule on the per-creator path: a suspended account is not mailed.
     * A suspended supporter DOES sit in `financial_transactions` — they paid
     * before they were suspended — so this one is reachable in normal data.
     */
    public function test_a_suspended_supporter_is_not_reminded(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
        config(['discovery.birthday.birthday_reminders' => true]);
        Mail::fake();

        $creator = $this->birthdayCreator();
        $suspended = $this->supporterOf($creator);
        $suspended->forceFill(['suspended_account' => 1])->save();

        $this->artisan('birthday:remind --stage=0')->assertExitCode(0);

        Mail::assertNothingSent();
        $this->assertSame(0, EngagementNotification::where('user_id', $suspended->id)->count());
    }

    /** A creator is never reminded about their own birthday. */
    public function test_a_creator_is_not_reminded_about_their_own_birthday(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
        config(['discovery.birthday.birthday_reminders' => true]);
        Mail::fake();

        $creator = $this->birthdayCreator();
        // A self-purchase row is the only way this could happen; the guard is
        // explicit in the command, so pin it.
        $this->supporterOf($creator, $creator);

        $this->artisan('birthday:remind --stage=0')->assertExitCode(0);

        Mail::assertNotSent(BirthdayReminder::class);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. Eligibility mirrors CreatorRecommendationService
    // ══════════════════════════════════════════════════════════════════════

    /**
     * 🚨 THE CLAUSE LIST IS DUPLICATED, SO IT IS COMPARED.
     *
     * `BirthdayDiscoveryService::eligibleCreators()` restates
     * `CreatorRecommendationService::eligibleCreators()` clause for clause,
     * deliberately (Phase 3's service is owned elsewhere and must not be
     * edited). Duplication that nothing compares drifts in silence, and the
     * direction it drifts here is "a suspended creator ends up in an e-mail".
     *
     * Every shared clause is applied to one candidate and asserted against BOTH
     * services in the same assertion.
     *
     * @dataProvider sharedEligibilityClauses
     */
    public function test_both_discovery_services_agree_on_who_is_eligible(array $force): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:00:00'));

        $viewed = $this->plainCreator();

        // Baseline: eligible everywhere.
        $candidate = $this->birthdayCreator();

        $this->assertArrayHasKey(
            $candidate->id,
            $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12')),
            'baseline candidate was not eligible for Phase 4'
        );
        $this->assertContains(
            $candidate->username,
            array_column($this->recommendations($viewed), 'username'),
            'baseline candidate was not eligible for Phase 3'
        );

        // Now break exactly one clause.
        $candidate->forceFill($force)->save();

        $this->assertArrayNotHasKey(
            $candidate->id,
            $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12')),
            'Phase 4 still included a creator Phase 3 excludes'
        );
        $this->assertNotContains(
            $candidate->username,
            array_column($this->recommendations($viewed), 'username'),
            'Phase 3 still included a creator Phase 4 excludes'
        );
    }

    public static function sharedEligibilityClauses(): array
    {
        return [
            'suspended' => [['suspended_account' => 1]],
            'profile not public' => [['profile_status_lock' => 1]],
            'avatar not approved' => [['avatar_approved' => 0]],
            'no avatar' => [['avatar' => null]],
            'no username' => [['username' => '']],
            'no name' => [['name' => '']],
            'excluded from discovery by an admin' => [['exclude_from_discovery' => 1]],
            'not a creator' => [['role' => 0]],
        ];
    }

    /**
     * The two clauses that are Phase 4's ALONE — opt-in and a birthday on file.
     * Phase 3 has no opinion on either, so they are asserted only here.
     */
    public function test_the_opt_in_is_required_and_is_off_by_default(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:00:00'));

        $optedOut = $this->birthdayCreator(3, 12, ['birthday_discovery_opt_in' => 0]);

        $this->assertSame([], $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12')));

        // A birthday on file is not consent; only the switch is.
        $optedOut->forceFill(['birthday_discovery_opt_in' => 1])->save();

        $this->assertArrayHasKey(
            $optedOut->id,
            $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'))
        );
    }

    public function test_a_creator_with_nothing_live_to_buy_is_never_featured(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:00:00'));

        $creator = $this->birthdayCreator();
        WishItem::where('user_id', $creator->id)->delete();

        $this->assertSame([], $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12')));

        WishItem::factory()->create(['user_id' => $creator->id, 'is_approved' => 1]);

        $this->assertArrayHasKey(
            $creator->id,
            $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'))
        );
    }

    /** @return array<int, array<string, mixed>> */
    private function recommendations(User $viewed): array
    {
        Cache::flush();

        return app(CreatorRecommendationService::class)->forProfile($viewed->refresh());
    }

    // ══════════════════════════════════════════════════════════════════════
    // Sending is ON by default; the env var is the kill switch
    // ══════════════════════════════════════════════════════════════════════

    /**
     * 🚨 REVERSED 26 Aug 2026 (client decision). Both flags shipped defaulting
     * FALSE and this test pinned that; they now default TRUE, so the feature is on
     * in every environment that does not explicitly turn it off and there is no env
     * var to remember.
     *
     * ⚠️ `phpunit.xml` sets neither, so the suite runs against the real default —
     * which is why the two kill-switch tests below now set the config THEMSELVES
     * rather than leaning on it. A test that proves "sends nothing when off" by
     * relying on the default proves nothing the day the default moves.
     */
    public function test_both_sending_flags_default_to_true(): void
    {
        $this->assertTrue((bool) config('discovery.birthday.birthday_reminders'));
        $this->assertTrue((bool) config('discovery.birthday.birthdays_this_week'));
        $this->assertTrue(BirthdayDiscoveryService::remindersEnabled());
        $this->assertTrue(BirthdayDiscoveryService::weeklyCampaignEnabled());
    }

    /**
     * 🚨 THE KILL SWITCH ONLY EXISTS IF THE CONFIG READS `env()`.
     *
     * The two tests below set the config at RUNTIME, so they prove the commands
     * honour it — and prove nothing about whether the env var ever reaches it.
     * Verified: replacing `env('DISCOVERY_BIRTHDAY_REMINDERS', true)` with a bare
     * `true` leaves both of them passing while the switch is gone. Now that ON is
     * the default, that env read is the ONLY way to stop a live fan-out without a
     * deploy, so it is pinned against the config source itself.
     */
    public function test_both_flags_are_still_overridable_by_env(): void
    {
        $source = file_get_contents(config_path('discovery.php'));

        $this->assertStringContainsString("env('DISCOVERY_BIRTHDAY_REMINDERS'", $source);
        $this->assertStringContainsString("env('DISCOVERY_BIRTHDAYS_THIS_WEEK'", $source);
    }

    /**
     * The kill switch. `DISCOVERY_BIRTHDAY_REMINDERS=false` is now the only way to
     * stop this without a deploy, so it matters more than it did when off was the
     * default — and it is set explicitly here for exactly that reason.
     */
    public function test_the_reminder_command_sends_nothing_while_the_flag_is_off(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
        config(['discovery.birthday.birthday_reminders' => false]);
        Mail::fake();

        $creator = $this->birthdayCreator();
        $this->supporterOf($creator);

        $this->artisan('birthday:remind')->assertExitCode(0);

        Mail::assertNothingSent();
        // 🚨 And it claims NO dedup row — a flag-off run that claimed would
        // suppress the first real send the day the flag is turned on.
        $this->assertSame(0, EngagementNotification::where('type', EngagementNotification::TYPE_BIRTHDAY_REMINDER)->count());
    }

    /** The same kill switch on the larger fan-out. Set explicitly, not defaulted. */
    public function test_the_weekly_command_sends_nothing_while_the_flag_is_off(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));
        config(['discovery.birthday.birthdays_this_week' => false]);
        Mail::fake();

        collect(range(0, 2))->each(fn ($i) => $this->birthdayCreator(3, 10 + $i));
        User::factory()->create(['role' => 0]);

        $this->artisan('birthday:weekly')->assertExitCode(0);

        Mail::assertNothingSent();
        $this->assertSame(0, EngagementNotification::where('type', EngagementNotification::TYPE_BIRTHDAYS_THIS_WEEK)->count());
    }

    /** `--dry-run` never sends and never claims, with the flag ON. */
    public function test_a_dry_run_sends_nothing_even_with_the_flag_on(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
        config([
            'discovery.birthday.birthday_reminders' => true,
            'discovery.birthday.birthdays_this_week' => true,
        ]);
        Mail::fake();

        $creator = $this->birthdayCreator();
        $this->supporterOf($creator);
        $this->birthdayCreator(3, 13);
        $this->birthdayCreator(3, 14);

        $this->artisan('birthday:remind --dry-run')->assertExitCode(0);
        $this->artisan('birthday:weekly --dry-run')->assertExitCode(0);

        Mail::assertNothingSent();
        $this->assertSame(0, EngagementNotification::count());
    }

    /**
     * The campaign waits for the same minimum the collection page waits for —
     * an e-mail whose CTA lands on a "coming soon" page is worse than no e-mail.
     */
    public function test_the_weekly_campaign_waits_for_the_collection_minimum(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));
        config(['discovery.birthday.birthdays_this_week' => true]);
        Mail::fake();

        $this->birthdayCreator(3, 10);
        $this->birthdayCreator(3, 11);
        User::factory()->create(['role' => 0]);

        $this->artisan('birthday:weekly')->assertExitCode(0);

        Mail::assertNothingSent();
    }

    // ══════════════════════════════════════════════════════════════════════
    // Attribution + unsubscribe
    // ══════════════════════════════════════════════════════════════════════

    /**
     * 🚨 A surface that is not tagged is invisible for ever — there is no
     * backfill for a click nobody marked. Asserted against the RENDERED HTML,
     * because the public-property trap (`Mailable::buildViewData()` merging a
     * public property OVER a `Content(with: …)` key) discards the tagged array
     * silently and the e-mail still looks perfect.
     */
    public function test_the_reminder_email_renders_a_tagged_profile_url(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));

        $creator = $this->birthdayCreator();
        $supporter = $this->supporterOf($creator);

        $card = $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'))[$creator->id];
        $html = (new BirthdayReminder($supporter->id, 0, $card))->render();

        $this->assertStringContainsString(DiscoverySources::PARAM.'=birthday-reminder', $html);
        $this->assertStringContainsString($creator->username.'?'.DiscoverySources::PARAM.'=birthday-reminder', $html);
        $this->assertSame('birthday-reminder', BirthdayReminder::source());
    }

    public function test_the_weekly_email_renders_tagged_profile_urls_for_every_card(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));

        $creators = collect(range(0, 2))->map(fn ($i) => $this->birthdayCreator(3, 10 + $i));
        $recipient = User::factory()->create(['role' => 0]);

        $cards = array_values($this->service()->featuredForWeek(
            BirthdayDiscoveryService::weekStart(Carbon::parse('2026-03-09'))
        ));

        $html = (new BirthdaysThisWeek($recipient->id, $cards, '9 Mar – 15 Mar'))->render();

        foreach ($creators as $creator) {
            $this->assertStringContainsString(
                $creator->username.'?'.DiscoverySources::PARAM.'=birthdays-this-week',
                $html
            );
        }

        $this->assertSame('birthdays-this-week', BirthdaysThisWeek::source());
    }

    /** Both keys are reserved, SP-generated, and declared live. */
    public function test_both_birthday_sources_are_reserved_sp_generated_and_live(): void
    {
        foreach (['birthday-reminder', 'birthdays-this-week'] as $key) {
            $this->assertArrayHasKey($key, DiscoverySources::KEYS);
            $this->assertContains($key, DiscoverySources::LIVE_KEYS);
            $this->assertTrue(DiscoverySources::isSpGenerated($key));
            $this->assertSame($key, DiscoverySources::normalise($key));
        }
    }

    /** 🚨 Unsubscribe works on day one, on every birthday e-mail. */
    public function test_every_birthday_email_renders_a_working_unsubscribe_link(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));

        $creator = $this->birthdayCreator();
        $supporter = $this->supporterOf($creator);

        $card = $this->service()->creatorsWithBirthdayOn(Carbon::parse('2026-03-12'))[$creator->id];

        foreach (BirthdayDiscoveryService::STAGES as $stage) {
            $html = (new BirthdayReminder($supporter->id, $stage, $card))->render();

            $this->assertStringContainsString('/unsubscribe/', $html);
            // Signed URL — a bare link anyone could forge is not an opt-out.
            $this->assertStringContainsString('signature=', $html);
            /*
             * Category-specific, and as NARROW as this e-mail can offer: it
             * turns off `birthday_emails_enabled` and nothing else. It used to
             * point at `creator_updates_enabled`, which meant stopping birthday
             * mail also stopped every other piece of news about every creator
             * this person supports. ⚠️ The reminder still REQUIRES
             * `creator_updates_enabled` to send (see the test below) — the new
             * column is an additional gate, not a replacement.
             */
            $this->assertStringContainsString('birthday_emails_enabled', html_entity_decode($html));
        }

        $weekly = (new BirthdaysThisWeek($supporter->id, [$card], '9 Mar – 15 Mar'))->render();

        $this->assertStringContainsString('/unsubscribe/', $weekly);
        $this->assertStringContainsString('signature=', $weekly);
        // The weekly campaign's footer used to be the BLANKET marketing opt-out,
        // so the only way to stop a birthday round-up was to stop every
        // promotion. It is the birthday category now.
        $this->assertStringContainsString('birthday_emails_enabled', html_entity_decode($weekly));
    }

    /** Consent is honoured: creator updates off → no reminder. */
    public function test_a_supporter_who_turned_off_creator_updates_is_not_reminded(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
        config(['discovery.birthday.birthday_reminders' => true]);
        Mail::fake();

        $creator = $this->birthdayCreator();
        $supporter = $this->supporterOf($creator);
        $supporter->forceFill(['creator_updates_enabled' => 0])->save();

        $this->artisan('birthday:remind --stage=0')->assertExitCode(0);

        Mail::assertNothingSent();
    }

    /**
     * 🚨 FOUND BY THIS TEST: the Monday campaign is the platform's LARGEST
     * fan-out — every account with an e-mail address — and it had no
     * `suspended_account` filter, so a suspended account received a marketing
     * round-up. The comparable platform-wide send,
     * `AnnounceSubscriptionPolicy`, excludes them in both its send query and its
     * remaining-count query; this one did not, and nothing errors when it
     * happens. The per-creator reminder was never exposed to it (a suspended
     * account is not in anybody's supporter list by accident, but more to the
     * point it is not selected by this query at all).
     */
    public function test_the_weekly_campaign_does_not_mail_a_suspended_account(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));
        config(['discovery.birthday.birthdays_this_week' => true]);
        Mail::fake();

        collect(range(0, 2))->each(fn ($i) => $this->birthdayCreator(3, 10 + $i));

        $suspended = User::factory()->create(['role' => 0]);
        $suspended->forceFill(['suspended_account' => 1])->save();

        $active = User::factory()->create(['role' => 0]);

        $this->artisan('birthday:weekly')->assertExitCode(0);

        $this->assertCount(
            0,
            Mail::sent(BirthdaysThisWeek::class)->filter(fn ($mail) => $mail->hasTo($suspended->email)),
            'a suspended account received the marketing campaign'
        );
        $this->assertCount(
            1,
            Mail::sent(BirthdaysThisWeek::class)->filter(fn ($mail) => $mail->hasTo($active->email))
        );
        $this->assertSame(
            0,
            EngagementNotification::where('user_id', $suspended->id)->count(),
            'a suspended account was claimed, which would suppress a legitimate send if they are reinstated'
        );
    }

    // ═════════════════════════════════════════════════════════════════════
    // The featured ten — stable within a week, rotating between weeks
    // ══════════════════════════════════════════════════════════════════════

    public function test_the_featured_selection_is_capped_and_stable_within_a_week(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:00:00'));

        collect(range(0, 13))->each(fn ($i) => $this->birthdayCreator(3, 9 + ($i % 7)));

        $weekStart = BirthdayDiscoveryService::weekStart(Carbon::parse('2026-03-09'));

        $first = array_column(array_values($this->service()->featuredForWeek($weekStart)), 'username');
        // Flushed between calls, so this proves the ORDER is deterministic
        // rather than merely cached.
        $second = array_column(array_values($this->service()->featuredForWeek($weekStart)), 'username');

        $this->assertCount(10, $first);
        $this->assertSame($first, $second);
    }

    /**
     * Between weeks it rotates. Same eligible set both times (the same calendar
     * day, two different years), so the ONLY input that changed is the seed.
     */
    public function test_the_featured_selection_rotates_between_weeks(): void
    {
        collect(range(0, 11))->each(fn () => $this->birthdayCreator(3, 12));

        // 12 Mar 2026 is in ISO week 2026-W11; 12 Mar 2027 is in 2027-W10.
        $weekA = BirthdayDiscoveryService::weekStart(Carbon::parse('2026-03-12'));
        $weekB = BirthdayDiscoveryService::weekStart(Carbon::parse('2027-03-12'));

        $this->assertNotSame($weekA->format('o-W'), $weekB->format('o-W'));

        $a = array_column(array_values($this->service()->featuredForWeek($weekA)), 'username');
        $b = array_column(array_values($this->service()->featuredForWeek($weekB)), 'username');

        $this->assertCount(10, $a);
        $this->assertCount(10, $b);
        $this->assertNotSame($a, $b, 'the weekly rotation produced an identical arrangement');
        // Same pool, so it is a rotation and not a different eligibility answer.
        $this->assertSame(10, count(array_intersect($a, $b)) + count(array_diff($a, $b)));
    }

    /** A week starts on Monday regardless of the app locale. */
    public function test_a_week_always_starts_on_monday(): void
    {
        foreach (['2026-03-09', '2026-03-12', '2026-03-15'] as $day) {
            $start = BirthdayDiscoveryService::weekStart(Carbon::parse($day));

            $this->assertSame('2026-03-09', $start->toDateString(), "week start wrong for {$day}");
            $this->assertTrue($start->isMonday());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // The collection page
    // ══════════════════════════════════════════════════════════════════════

    /** Below the minimum the page answers, greyed — it never 404s. */
    public function test_the_collection_page_renders_its_coming_soon_state_below_the_minimum(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:00:00'));

        $this->birthdayCreator(3, 10);

        $this->get('/discover/birthdays')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('discover/Birthdays')
                ->where('ready', false)
                ->where('creators', [])
                ->where('needed', 2)
            );
    }

    public function test_the_collection_page_renders_tagged_cards_with_no_year(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:00:00'));

        collect(range(0, 2))->each(fn ($i) => $this->birthdayCreator(3, 10 + $i));

        $response = $this->get('/discover/birthdays')->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->component('discover/Birthdays')
            ->where('ready', true)
            ->where('source', 'birthdays-this-week')
            ->has('creators', 3, fn ($card) => $card
                ->has('url')
                ->has('birthday_label')
                ->missing('date_of_birth')
                ->etc()
            )
        );

        // 🚨 The whole props payload, as it reaches the browser.
        $this->assertStringNotContainsString(self::BIRTH_YEAR, $response->getContent());
        $this->assertStringContainsString(DiscoverySources::PARAM.'=birthdays-this-week', $response->getContent());
    }
}
