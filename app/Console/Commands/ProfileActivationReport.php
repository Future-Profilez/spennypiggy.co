<?php

namespace App\Console\Commands;

use App\Models\SocialLinks;
use App\Models\User;
use App\Support\ProfileAutoApproval;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;

/**
 * Which creators are still sitting at "not live", and what is holding each one?
 *
 * 🚨 READ ONLY, BY DESIGN — AND BY CLIENT DIRECTION (10 Sep 2026). The first cut of this
 * was a sweep that would have ACTIVATED every legacy creator whose assets passed the
 * checks. The client's rule is that approval fires when the creator themselves saves
 * something: *"auto approve tabhi kar do jab kuchh dale"*. So a creator who uploaded a
 * photo in June and never came back is NOT switched on behind their back; they go live
 * the next time they touch their profile, through the same path as everybody else.
 *
 * What this DOES do is answer "how big is that backlog and why" — which the review
 * console can no longer show, because nothing is in its queue.
 *
 * ⚠️ The bio and handle verdicts here are the real ones. The PHOTO cannot be judged
 * from a command — it needs the Rekognition round trip — so a photo is reported as
 * "unscanned" rather than guessed at.
 */
class ProfileActivationReport extends Command
{
    protected $signature = 'profiles:activation-report {--limit=500}';

    protected $description = 'List creators not yet live and what is holding each one (read only)';

    public function handle(): int
    {
        $rows = [];
        $tally = ['would_activate' => 0, 'bio' => 0, 'socials' => 0, 'photo' => 0, 'missing' => 0, 'rejected' => 0];

        User::query()
            ->where('role', 1)
            ->where(function ($q) {
                $q->whereNull('profile_status_lock')->orWhere('profile_status_lock', '!=', 2);
            })
            ->where(function ($q) {
                $q->whereNull('suspended_account')->orWhere('suspended_account', 0);
            })
            ->whereNull('deleted_at')
            ->limit((int) $this->option('limit'))
            ->orderBy('id')
            ->each(function (User $u) use (&$rows, &$tally) {
                $holds = [];

                if (blank($u->avatar) || blank($u->bio)) {
                    $holds[] = 'missing asset';
                    $tally['missing']++;
                } elseif ((int) $u->avatar_approved !== 1) {
                    $holds[] = 'photo unscanned/held';
                    $tally['photo']++;
                }

                if (filled($u->bio) && ProfileAutoApproval::judgeBio($u->bio) !== null) {
                    $holds[] = 'bio would be refused';
                    $tally['bio']++;
                }

                $links = SocialLinks::where('user_id', $u->id)->whereNull('deleted_at')->first();

                if (! $links) {
                    if (! in_array('missing asset', $holds, true)) {
                        $holds[] = 'missing asset';
                        $tally['missing']++;
                    }
                } elseif (ProfileAutoApproval::judgeSocials(Arr::only($links->getAttributes(), SocialLinks::ACCEPTED_PLATFORMS), $u->id) !== null) {
                    $holds[] = 'handle would be refused';
                    $tally['socials']++;
                }

                if (filled($u->profile_reject_reason)) {
                    $holds[] = 'admin rejection on file';
                    $tally['rejected']++;
                }

                if ($holds === [] && (int) $u->avatar_approved === 1) {
                    $holds[] = 'nothing — activates on next save';
                    $tally['would_activate']++;
                }

                $rows[] = [$u->id, $u->username ?: '—', (int) $u->profile_status_lock, implode(', ', $holds)];
            });

        $this->table(['ID', 'Username', 'Lock', 'Holding'], $rows);
        $this->newLine();
        $this->line(sprintf(
            '<options=bold>%d not live.</> %d would activate on their next save · %d missing an asset · %d photo unscanned/held · %d bio would be refused · %d handle would be refused · %d carry an admin rejection.',
            count($rows), $tally['would_activate'], $tally['missing'], $tally['photo'], $tally['bio'], $tally['socials'], $tally['rejected']
        ));
        $this->warn('Read only. Nothing was changed — approval fires on the creator\'s own save, never from here.');

        return self::SUCCESS;
    }
}
