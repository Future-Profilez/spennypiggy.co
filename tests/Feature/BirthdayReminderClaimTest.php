<?php

namespace Tests\Feature;

use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Two faults in how a birthday send CLAIMS its dedup row. Both are silent, and
 * both make the feature stop working for a person while every log stays clean.
 *
 *  1. The reminder keyed on the YEAR, so a creator correcting a mistyped birthday
 *     found the corrected date already claimed by the wrong one — no supporter of
 *     that creator heard anything for the rest of the year.
 *
 *  2. A send that THREW kept its claim, recording a delivery that never happened.
 *     For the weekly campaign that breaks the recovery its own docblock promises:
 *     a later run in the same week is supposed to pick up whoever is left.
 */
class BirthdayReminderClaimTest extends TestCase
{
    use RefreshDatabase;

    private const DOB = '1994-03-12';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'discovery.birthday.birthday_reminders' => true,
            'discovery.birthday.birthdays_this_week' => true,
        ]);

        Cache::flush();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function birthdayCreator(int $month, int $day): User
    {
        $user = User::factory()->create(['role' => 1]);

        $user->forceFill([
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
            'date_of_birth' => self::DOB,
            'birthday_day' => $day,
            'birthday_month' => $month,
            'birthday_discovery_opt_in' => 1,
        ])->save();

        WishItem::factory()->create(['user_id' => $user->id, 'is_approved' => 1]);

        return $user->refresh();
    }

    private function supporterOf(User $creator): User
    {
        $supporter = User::factory()->create(['role' => 0]);

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

    /**
     * 🚨 The correction case. `birthday_day`/`birthday_month` are DERIVED from
     * `date_of_birth`, so a creator fixing a date they mistyped at signup is an
     * ordinary flow — not an edge case.
     */
    public function test_a_creator_who_corrects_their_birthday_still_gets_reminders_that_year(): void
    {
        // Their birthday is on file as 12 March. Seven days out, the stage-7 note goes.
        Carbon::setTestNow(Carbon::parse('2026-03-05 09:30:00'));

        $creator = $this->birthdayCreator(3, 12);
        $supporter = $this->supporterOf($creator);

        Mail::fake();
        $this->artisan('birthday:remind', ['--stage' => 7])->assertSuccessful();

        $this->assertSame(
            1,
            EngagementNotification::where('user_id', $supporter->id)
                ->where('type', EngagementNotification::TYPE_BIRTHDAY_REMINDER)
                ->count(),
            'the first reminder did not send at all'
        );

        // They then correct it to 20 June — same calendar year.
        $creator->forceFill([
            'date_of_birth' => '1994-06-20',
            'birthday_day' => 20,
            'birthday_month' => 6,
        ])->save();

        Cache::flush();
        Carbon::setTestNow(Carbon::parse('2026-06-13 09:30:00'));

        Mail::fake();
        $this->artisan('birthday:remind', ['--stage' => 7])->assertSuccessful();

        // With the YEAR in the key this is still 1: the corrected date was already
        // claimed by the wrong one, and every supporter heard nothing.
        $this->assertSame(
            2,
            EngagementNotification::where('user_id', $supporter->id)
                ->where('type', EngagementNotification::TYPE_BIRTHDAY_REMINDER)
                ->count(),
            'the corrected birthday was suppressed by the claim the wrong date took'
        );
    }

    /** An unchanged date must still send exactly once — the dedup is not loosened. */
    public function test_a_rerun_on_the_same_day_still_sends_only_once(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-05 09:30:00'));

        $creator = $this->birthdayCreator(3, 12);
        $supporter = $this->supporterOf($creator);

        Mail::fake();
        $this->artisan('birthday:remind', ['--stage' => 7])->assertSuccessful();

        Cache::flush();
        $this->artisan('birthday:remind', ['--stage' => 7])->assertSuccessful();

        $this->assertSame(
            1,
            EngagementNotification::where('user_id', $supporter->id)
                ->where('type', EngagementNotification::TYPE_BIRTHDAY_REMINDER)
                ->count()
        );
    }

    /**
     * 🚨 A claim is a promise the mail went out. When the send throws, an operator
     * re-running the command the same day — which is exactly what somebody does
     * after seeing a mail outage in these logs — must actually reach the person.
     */
    public function test_a_failed_send_gives_its_claim_back_so_a_rerun_can_reach_them(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-05 09:30:00'));

        $creator = $this->birthdayCreator(3, 12);
        $supporter = $this->supporterOf($creator);

        // A mail transport that throws is the real shape of the failure the catch
        // block exists for.
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));

        $this->artisan('birthday:remind', ['--stage' => 7])->assertSuccessful();

        $this->assertSame(
            0,
            EngagementNotification::where('user_id', $supporter->id)
                ->where('type', EngagementNotification::TYPE_BIRTHDAY_REMINDER)
                ->count(),
            'a send that threw left a claim recording a delivery that never happened'
        );
    }

    /**
     * The weekly campaign's own docblock promises that a later run in the same
     * week CONTINUES the send — skipping the claimed and picking up who is left.
     * A claim burnt by a failed send is indistinguishable from a delivered one,
     * so without the release Tuesday's run walks straight past exactly the people
     * Monday's run failed to reach.
     */
    public function test_the_weekly_campaign_gives_a_failed_claim_back(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-09 09:45:00'));

        /*
         * ⚠️ THREE creators, because the campaign refuses to send below
         * `collection_min_creators` — its CTA must never land on a page that has
         * greyed itself out. With one creator the command selects nobody and a
         * test asserting "no claim" passes without exercising anything.
         */
        $creator = $this->birthdayCreator(3, 10);
        $this->birthdayCreator(3, 11);
        $this->birthdayCreator(3, 12);

        $supporter = $this->supporterOf($creator);

        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));

        $this->artisan('birthday:weekly')->assertSuccessful();

        $this->assertSame(
            0,
            EngagementNotification::where('user_id', $supporter->id)
                ->where('type', EngagementNotification::TYPE_BIRTHDAYS_THIS_WEEK)
                ->count(),
            'a send that threw kept its claim, so no later run in the week can reach them'
        );
    }
}
