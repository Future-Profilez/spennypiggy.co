<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\WishCategory;
use App\Models\WishItem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckAdultContent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $wish;
    /**
     * Create a new job instance.
     */
    public function __construct($wish)
    {
        $this->wish = $wish;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $rest_words = ['Adult', '18+', 'Pornographic', 'xxx', 'nsfw','NSFW','XXX', 'Blood', 'Brutality', 'Explicit', 'Mature', 'Weapons', 'Aggression', 'Combat', 'Sexual', 'Porn', 'Fucking','Graphic'];

        $authHeader = 'Uploadcare.Simple ' . config('services.uploadcare.public') . ':' . config('services.uploadcare.secret');

        // Kick off async Rekognition moderation.
        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => $authHeader,
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $this->wish->thumbnail,
        ]);

        // Rekognition is async — poll (with delay) until labels are available. Reading
        // immediately (the old behaviour) always missed the result and left the wish live.
        $tags = null;
        for ($attempt = 0; $attempt < 5; $attempt++) {
            sleep(3);

            $response = Http::withHeaders([
                'Accept' => 'application/vnd.uploadcare-v0.7+json',
                'Authorization' => $authHeader,
            ])->get("https://api.uploadcare.com/files/". $this->wish->thumbnail ."/?include=appdata");

            if (!$response->successful()) {
                Log::error('Uploadcare API failed for wish thumbnail check', [
                    'wish_id' => $this->wish->id,
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

        if (!is_array($tags)) {
            Log::warning('ModerationLabels unavailable after polling for wish thumbnail', [
                'wish_id' => $this->wish->id,
            ]);
            return;
        }

        // Match case-insensitively against the full label (labels can be multi-word,
        // e.g. "Explicit Nudity"), not a word-split intersection that misses substrings.
        foreach ($tags as $tag) {
            $label = $tag['Name'] ?? '';
            foreach ($rest_words as $word) {
                if (stripos($label, $word) !== false) {
                    EmailService::sendRestrictionMail($this->wish);
                    WishCategory::where('wish_item_id',$this->wish->id)->delete();
                    WishItem::where('id',$this->wish->id)->delete();
                    return;
                }
            }
        }
    }
}
