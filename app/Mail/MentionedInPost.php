<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * "X mentioned you in a post."
 *
 * Constructor args are primitives only — the mailable is rebuilt from a
 * serialized queue payload by NotificationDispatcher.
 */
class MentionedInPost extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $creatorName,
        public string $creatorUsername,
        public string $postTitle,
        public string $postUrl,
        public string $excerpt = '',
    ) {}

    public function build()
    {
        return $this->subject($this->creatorName.' mentioned you in a post')
            ->view('email.mentioned-in-post', [
                'creatorName' => $this->creatorName,
                'creatorUsername' => $this->creatorUsername,
                'postTitle' => $this->postTitle,
                'postUrl' => $this->postUrl,
                'excerpt' => $this->excerpt,
            ]);
    }
}
