<?php

namespace App\Jobs;

use App\EmailService;
use App\Jobs\Concerns\RetriesCriticalWork;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckProfilePhotosAdult implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    public $user;

    /**
     * Create a new job instance.
     */
    public function __construct($user)
    {
        $this->user = $user;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $restWords = ['Adult', '18+', 'Pornographic', 'xxx', 'nsfw', 'NSFW', 'XXX', 'Blood', 'Brutality', 'Explicit', 'Mature', 'Weapons', 'Aggression', 'Combat', 'Sexual', 'Porn', 'Fucking', 'Graphic'];

        if (! empty($this->user->avatar) && $this->isAdult($this->user->avatar, $restWords)) {
            EmailService::sendAvatarRestrictionMail($this->user);
            $this->user->avatar = null;
            $this->user->save();
        }

        if (! empty($this->user->cover) && $this->isAdult($this->user->cover, $restWords)) {
            EmailService::sendCoverRestrictionMail($this->user);
            $this->user->cover = null;
            $this->user->save();
        }
    }

    /**
     * Kick off Rekognition moderation for an Uploadcare file and poll (with delay) until
     * labels are available. Rekognition is async — reading immediately (the old behaviour)
     * always missed the result and left the photo live. Returns true if a restricted
     * label is found.
     */
    private function isAdult(string $target, array $restWords): bool
    {
        $authHeader = 'Uploadcare.Simple '.config('services.uploadcare.public').':'.config('services.uploadcare.secret');

        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => $authHeader,
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $target,
        ]);

        $tags = null;
        for ($attempt = 0; $attempt < 5; $attempt++) {
            sleep(3);

            $response = Http::withHeaders([
                'Accept' => 'application/vnd.uploadcare-v0.7+json',
                'Authorization' => $authHeader,
            ])->get('https://api.uploadcare.com/files/'.$target.'/?include=appdata');

            if (! $response->successful()) {
                Log::error('Uploadcare API failed for profile photo check', [
                    'user_id' => $this->user->id,
                    'status' => $response->status(),
                ]);

                continue;
            }

            $labels = $response->json('appdata.aws_rekognition_detect_moderation_labels.data.ModerationLabels');
            if (is_array($labels)) {
                $tags = $labels;
                break;
            }
        }

        if (! is_array($tags)) {
            Log::warning('ModerationLabels unavailable after polling for profile photo', [
                'user_id' => $this->user->id,
            ]);

            return false;
        }

        foreach ($tags as $tag) {
            $label = $tag['Name'] ?? '';
            foreach ($restWords as $word) {
                if (stripos($label, $word) !== false) {
                    return true;
                }
            }
        }

        return false;
    }
}
