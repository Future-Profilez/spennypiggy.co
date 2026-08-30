<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WishItem;
use App\Services\Discovery\BirthdayDiscoveryService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 A DIAGNOSTIC THAT CAN DISAGREE WITH WHAT IT DIAGNOSES IS WORSE THAN NONE —
 * it sends whoever trusts it to fix the wrong thing. So the assertion that
 * matters here is not "does it print PASS", it is "does its verdict match the
 * real service's answer for the same creator".
 */
class BirthdayDiagnoseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Carbon::setTestNow(Carbon::parse('2026-03-12 09:30:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function creator(array $force = []): User
    {
        $user = User::factory()->create(['role' => 1]);

        $user->forceFill(array_merge([
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
            'date_of_birth' => '1994-03-12',
            'birthday_day' => 12,
            'birthday_month' => 3,
            'birthday_discovery_opt_in' => 1,
        ], $force))->save();

        WishItem::factory()->create(['user_id' => $user->id, 'is_approved' => 1]);

        return $user->refresh();
    }

    public function test_it_reports_a_fully_eligible_creator_as_appearing(): void
    {
        $user = $this->creator();

        $this->artisan('birthday:diagnose', ['username' => $user->username])
            ->expectsOutputToContain('The real query DOES return this creator')
            ->assertExitCode(0);
    }

    /**
     * The one that actually bites in production: the switch defaults OFF, so a
     * creator with a birthday on file and everything else right is still absent.
     */
    public function test_it_names_the_opt_in_when_that_is_what_is_missing(): void
    {
        $user = $this->creator(['birthday_discovery_opt_in' => 0]);

        $this->artisan('birthday:diagnose', ['username' => $user->username])
            ->expectsOutputToContain('opted in to Birthday Discovery')
            ->expectsOutputToContain('The real query does NOT return this creator')
            ->assertExitCode(0);
    }

    public function test_it_names_an_unapproved_profile(): void
    {
        $user = $this->creator(['profile_status_lock' => 1]);

        $this->artisan('birthday:diagnose', ['username' => $user->username])
            ->expectsOutputToContain('profile approved')
            ->expectsOutputToContain('The real query does NOT return this creator')
            ->assertExitCode(0);
    }

    /**
     * 🚨 THE LOAD-BEARING ONE. For every combination below, the command's verdict
     * and the service's own answer must be the same value — that is what stops
     * this drifting into a second, wrong copy of the eligibility rules.
     */
    public function test_its_verdict_always_matches_the_real_service(): void
    {
        $service = app(BirthdayDiscoveryService::class);
        $target = Carbon::parse('2026-03-12');

        $cases = [
            'eligible' => [],
            'opted out' => ['birthday_discovery_opt_in' => 0],
            'suspended' => ['suspended_account' => 1],
            'unapproved profile' => ['profile_status_lock' => 1],
            'no approved avatar' => ['avatar_approved' => 0],
            'no birthday day' => ['birthday_day' => null],
        ];

        foreach ($cases as $label => $force) {
            $user = $this->creator($force);

            Cache::flush();
            $inService = array_key_exists($user->id, $service->creatorsWithBirthdayOn($target));

            /*
             * ⚠️ ASSERTED THROUGH `expectsOutputToContain`, not by reading the
             * output back. Both `Artisan::output()` and a `BufferedOutput` passed
             * to `Artisan::call` come back EMPTY here — verified — so a test that
             * parses the text compares against nothing and reads the absence of a
             * string as a confident "not listed". Branching on the service's own
             * answer asserts exactly the thing that matters: that the two agree.
             */
            $this->artisan('birthday:diagnose', ['username' => $user->username])
                ->expectsOutputToContain(
                    $inService
                        ? 'The real query DOES return this creator'
                        : 'The real query does NOT return this creator'
                )
                ->assertExitCode(0);
        }
    }

    /** ⚠️ The birth YEAR must never reach a console log. */
    public function test_it_never_prints_the_birth_year(): void
    {
        $user = $this->creator();

        // Same constraint as above: the output cannot be read back, so this
        // asserts the year is absent by asking the command to prove it is not
        // there — `doesntExpectOutputToContain` fails if the string appears.
        $this->artisan('birthday:diagnose', ['username' => $user->username])
            ->doesntExpectOutputToContain('1994')
            ->assertExitCode(0);
    }

    public function test_an_unknown_username_fails_cleanly(): void
    {
        $this->artisan('birthday:diagnose', ['username' => 'nobody-here'])
            ->assertExitCode(1);
    }

    /**
     * 🚨 THE CASE THAT ACTUALLY CAME UP ON PRODUCTION (30 Aug 2026). A creator
     * with a birthday four days away, every gate green, absent from the page —
     * because today was SUNDAY, the last day of the week the page was showing,
     * and four days away landed in the next one. Both commands reported a bare
     * "0", which reads as "nobody qualifies" and sends whoever is looking off to
     * hunt for a gate that is not broken.
     */
    public function test_it_says_so_when_the_birthday_falls_in_a_later_week(): void
    {
        // Sunday — the last day of the 24–30 Aug week.
        Carbon::setTestNow(Carbon::parse('2026-08-30 09:30:00'));

        // Four days away: Thursday 3 Sep, which is the NEXT week.
        $user = $this->creator(['birthday_month' => 9, 'birthday_day' => 3]);

        $this->artisan('birthday:diagnose', ['username' => $user->username])
            ->expectsOutputToContain('THAT IS NOT THIS WEEK')
            ->assertExitCode(0);
    }

    /** …and stays quiet about the week when the week is not the problem. */
    public function test_it_does_not_blame_the_week_when_the_birthday_is_in_it(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-26 09:30:00'));

        // Friday 28 Aug — same 24–30 Aug week.
        $user = $this->creator(['birthday_month' => 8, 'birthday_day' => 28]);

        $this->artisan('birthday:diagnose', ['username' => $user->username])
            ->expectsOutputToContain('That IS this week')
            ->assertExitCode(0);
    }
}
