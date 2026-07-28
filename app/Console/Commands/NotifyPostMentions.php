<?php

namespace App\Console\Commands;

use App\Mail\MentionedInPost;
use App\Models\PostMention;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Tells creators they were mentioned — but only once the post is live.
 *
 * A post is created unapproved, so notifying at save time would send someone to
 * a 404 (or to a post nobody but its author can see). This command runs after
 * approval instead, which also means the admin app needs no change: it flips
 * `approved`, and this picks the mention up on its next run.
 */
class NotifyPostMentions extends Command
{
    protected $signature = 'mentions:notify {--dry-run : Report what would be sent without sending}';

    protected $description = 'Notify creators mentioned in posts that have been approved';

    /** Safety valve — a backlog should drain over several runs, not in one burst. */
    private const BATCH = 200;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $mentions = PostMention::query()
            ->whereNull('notified_at')
            ->whereHas('post', fn ($q) => $q->where('approved', 1))
            ->with(['post.user:id,name,username', 'user:id,name,username,email,push_notifications_enabled,reactivation_emails_enabled'])
            ->limit(self::BATCH)
            ->get();

        if ($mentions->isEmpty()) {
            $this->info('No pending mentions.');

            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($mentions as $mention) {
            $post = $mention->post;
            $author = $post?->user;
            $target = $mention->user;

            // The author being missing means suspended or deleted — there is
            // nothing honest to say, so drop the mention rather than send
            // "someone mentioned you".
            if (! $post || ! $author || ! $target) {
                if (! $dryRun) {
                    $mention->delete();
                }

                continue;
            }

            $url = rtrim(config('app.url'), '/').'/'.$author->username.'/post/'.$post->slug;
            $title = trim((string) $post->title);
            $excerpt = Str::limit(trim(strip_tags((string) $post->content)), 140);

            if ($dryRun) {
                $this->line("would notify @{$target->username} about {$url}");
                $sent++;

                continue;
            }

            // The claim is the dedup: two workers racing cannot both win, and a
            // re-run after a crash mid-batch cannot double-send.
            if (NotificationDispatcher::claim($target->id, 'post_mention', 'post:'.$post->id)) {
                NotificationDispatcher::queue(
                    $target,
                    'post_mention',
                    [
                        'title' => $author->name.' mentioned you',
                        'body' => $title !== '' ? $title : 'You were tagged in a new post.',
                        'url' => $url,
                        'module' => 'post_mention',
                        'target_id' => $post->id,
                        'from_user_id' => $author->id,
                        'mailable' => MentionedInPost::class,
                        'mailable_args' => [
                            'creatorName' => $author->name,
                            'creatorUsername' => $author->username,
                            'postTitle' => $title,
                            'postUrl' => $url,
                            'excerpt' => $excerpt,
                        ],
                    ],
                    NotificationDispatcher::ALL_CHANNELS,
                    // NOT marketing. Being tagged by another creator is a direct
                    // interaction, like a comment on your post — and it has no
                    // opt-out of its own, so routing it through the marketing
                    // gate meant anyone who had unsubscribed from promotions was
                    // never told they had been mentioned at all. Verified in the
                    // log: "Skipping marketing email for user 80 (marketing
                    // emails disabled)".
                    false,
                );
                $sent++;
            }

            $mention->forceFill(['notified_at' => now()])->save();
        }

        $this->info(($dryRun ? 'Would notify ' : 'Notified ').$sent.' creator(s).');

        return self::SUCCESS;
    }
}
