<?php

namespace App\Console\Commands;

use App\Mail\ProfileReleased;
use App\Models\SocialLinks;
use App\Models\User;
use App\Support\ProfileAutoApproval;
use App\Support\ProfileReleaseTiers;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Let the historically-rejected creators back in — the ones a machine can judge.
 *
 * 🚨 CLIENT D6, and the ORDER of that instruction is part of it: *"Send production counts
 * before the release runs and notify released creators by email."* So this command is a
 * REPORT by default and only releases with `--apply`. The counts it prints with no flags
 * are the ones that go to the client.
 *
 * 🚨 WHO IS RELEASED IS `ProfileReleaseTiers`' DECISION, NOT THIS FILE'S. Read that class
 * before changing anything here — the three tiers are the client's words, and the default
 * for an unrecognised reason is `manual`, never `auto`.
 *
 * ⚠️ Why this exists at all: the review queue that used to release these creators is gone
 * (11 Sep 2026). Without this they stay drafting for ever, holding a profile nobody will
 * ever look at, with no way for them to tell that waiting is pointless.
 */
class ReleaseHistoricProfiles extends Command
{
    protected $signature = 'profiles:release-historic
        {--apply : Actually release. Without this the command only reports.}
        {--max=0 : Stop after this many releases (0 = no limit).}
        {--no-mail : Release without emailing the creators.}';

    protected $description = 'Report, and optionally release, creators held by a historic rejection';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $max = (int) $this->option('max');
        $mail = ! (bool) $this->option('no-mail');

        /*
         * ⚠️ EVERY creator sitting at lock 0, not just the ones carrying a reason.
         * D6's first category is "submitted/undecided" — a creator who was never judged
         * at all — and those rows have a NULL reason, so a `whereNotNull` here would
         * silently skip the largest group the instruction names.
         */
        $candidates = User::query()
            ->where('role', 1)
            ->where('profile_status_lock', 0)
            ->where(function ($q) {
                /*
                 * 🚨 EITHER a recorded rejection OR a finished profile — not both.
                 * Requiring a complete profile alone silently dropped every creator who
                 * WAS judged and turned down but never came back to fill the rest in:
                 * they are the clearest case D6 is about, and they would have sat in no
                 * bucket at all, invisible in the counts sent to the client.
                 */
                $q->where(function ($w) {
                    $w->whereNotNull('profile_reject_reason')
                        ->where('profile_reject_reason', '!=', '');
                })->orWhere(function ($w) {
                    $w->whereNotNull('avatar')->whereNotNull('bio');
                });
            })
            ->orderBy('id')
            ->get();

        $buckets = [
            ProfileReleaseTiers::TIER_AUTO => [],
            ProfileReleaseTiers::TIER_MANUAL => [],
            ProfileReleaseTiers::TIER_NEVER => [],
        ];

        foreach ($candidates as $creator) {
            $verdict = ProfileReleaseTiers::classify($creator);
            $buckets[$verdict['tier']][] = [$creator, $verdict['why']];
        }

        $this->info('Creators held at lock 0 with a rejection or a finished profile: '.$candidates->count());
        $this->newLine();

        foreach ($buckets as $tier => $rows) {
            $this->line(strtoupper($tier).' — '.count($rows));

            foreach ($rows as [$creator, $why]) {
                $this->line(sprintf(
                    '  %-20s %s',
                    $creator->username,
                    $why.self::reasonSuffix($creator)
                ));
            }

            $this->newLine();
        }

        if (! $apply) {
            $this->comment('Report only. These are the counts to send the client (D6). Re-run with --apply to release the AUTO group.');

            return self::SUCCESS;
        }

        $released = 0;

        foreach ($buckets[ProfileReleaseTiers::TIER_AUTO] as [$creator, $why]) {
            if ($max > 0 && $released >= $max) {
                $this->comment("Stopped at --max={$max}.");
                break;
            }

            if ($this->release($creator, $mail)) {
                $released++;
            }
        }

        $this->info("Released: {$released}");
        $this->comment('MANUAL group untouched — a person decides those.');

        return self::SUCCESS;
    }

    /**
     * Put one creator's profile back into the ordinary auto-approval path.
     *
     * 🚨 IT DOES NOT FORCE THE PROFILE LIVE. It clears the historic rejection and then asks
     * `ProfileAutoApproval` the same question a save would — so a creator whose bio would
     * fail today's wording rules stays drafting rather than being published by a sweep on
     * the strength of a rejection that was about something else entirely.
     */
    private function release(User $creator, bool $mail): bool
    {
        try {
            DB::transaction(function () use ($creator) {
                /*
                 * ⚠️ `DB::table`, never `save()`. `users.updated_at` keys the public
                 * profile cache and orders the admin creator list, so a bulk release
                 * would reshuffle both and expire every cache in one command.
                 */
                DB::table('users')->where('id', $creator->id)->update([
                    'profile_reject_reason' => null,
                ]);

                // A rejected asset flag is what `holding()` reads. Clearing it back to 0
                // (not 1) is the point: nothing is approved here, it is re-judged.
                foreach (['avatar_approved', 'bio_approved'] as $column) {
                    if ((int) ($creator->{$column} ?? 0) === 2) {
                        DB::table('users')->where('id', $creator->id)->update([$column => 0]);
                    }
                }

                DB::table('social_links')
                    ->where('user_id', $creator->id)
                    ->where('status', SocialLinks::STATUS_REJECTED)
                    ->update(['status' => 0]);
            });

            $fresh = $creator->fresh();

            // The same decision a save makes. It can legitimately decline.
            ProfileAutoApproval::markApproved($fresh, 'avatar');
            ProfileAutoApproval::markApproved($fresh, 'bio');
            $live = ProfileAutoApproval::activateIfComplete($fresh->fresh());

            if ($mail) {
                $this->notify($fresh, $live);
            }

            $this->line('  released '.$creator->username.($live ? ' (live)' : ' (still drafting)'));

            return true;
        } catch (\Throwable $e) {
            /*
             * ⚠️ One creator failing must not end the run — the others are independent,
             * and a half-finished release is re-runnable because every step is idempotent.
             */
            Log::error('profiles:release-historic failed for a creator', [
                'user' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            $this->error('  FAILED '.$creator->username.' — '.$e->getMessage());

            return false;
        }
    }

    /**
     * Tell the creator, because D6 says to.
     *
     * ⚠️ Never throws: a creator whose profile is live and who was not emailed is a far
     * better outcome than a run that stops halfway through a release.
     */
    private function notify(User $creator, bool $live): void
    {
        try {
            if (empty($creator->email)) {
                return;
            }

            Mail::to($creator->email)->queue(new ProfileReleased($creator, $live));
        } catch (\Throwable $e) {
            Log::warning('profiles:release-historic could not email a released creator', [
                'user' => $creator->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private static function reasonSuffix(User $creator): string
    {
        $reason = trim((string) ($creator->profile_reject_reason ?? ''));

        return $reason === '' ? '' : '  — "'.mb_strimwidth($reason, 0, 60, '…').'"';
    }
}
