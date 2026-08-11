<?php

namespace App\Console\Commands;

use App\Models\Post;
use App\Support\GeneratedText;
use Illuminate\Console\Command;

/**
 * Repairs auto-generated thank-you posts whose emoji was lost on the way into
 * the database and left a bare `?` at the front of the title.
 *
 * ⚠️ Run by hand, not scheduled. The write path is guarded now
 * (`App\Support\GeneratedText`), so this exists only to clean up what was
 * published before that — and a sweep that keeps running over a table it can
 * never find anything in is just cost.
 *
 * Only `support_thanks` posts are touched: those are written BY the platform.
 * A creator's own post is their words, and a `?` in one is far more likely to be
 * a question than an encoding failure — editing it would be the platform
 * rewriting someone's post.
 */
class RepairGeneratedPostTitles extends Command
{
    protected $signature = 'posts:repair-generated-titles
        {--dry-run : Report only, change nothing}';

    protected $description = 'Strip orphaned "?" left by lost emoji in auto-generated post titles';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $posts = Post::withScheduled()
            ->where('type', 'support_thanks')
            // A leading `?` or replacement character, which is what a dropped
            // emoji leaves behind. Anchored: only the decorative position.
            ->where(function ($q) {
                $q->where('title', 'like', '?%')
                    ->orWhere('title', 'like', '�%');
            })
            ->get();

        if ($posts->isEmpty()) {
            $this->info('No generated titles need repair.');

            return self::SUCCESS;
        }

        $fixed = 0;

        foreach ($posts as $post) {
            $repaired = GeneratedText::title($post->title, 'Thank you');

            if ($repaired === $post->title) {
                continue;
            }

            $this->line(sprintf('%s "%s" → "%s"', $dryRun ? 'Would fix' : 'Fixing', $post->title, $repaired));

            if (! $dryRun) {
                // saveQuietly: this is a typographic repair, not an edit. A
                // normal save would touch `updated_at`, which the profile cache
                // version is derived from, and re-run the model's slug hooks.
                $post->forceFill(['title' => $repaired])->saveQuietly();
            }

            $fixed++;
        }

        $this->info(($dryRun ? 'Would fix ' : 'Fixed ').$fixed.' title(s).');

        return self::SUCCESS;
    }
}
