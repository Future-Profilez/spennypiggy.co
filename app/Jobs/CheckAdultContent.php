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
        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $this->wish->thumbnail,
        ]);


        $response = Http::withHeaders([
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->get("https://api.uploadcare.com/files/". $this->wish->thumbnail ."/?include=appdata");

        $data = $response->json();
        $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];

        $rest = false;

        foreach ($tags as $key => $tag) {
            $name = explode(" ", $tag['Name']);

            $common = array_intersect($rest_words, $name);

            if (count($common) > 0) {
                EmailService::sendRestrictionMail($this->wish);
                WishCategory::where('wish_item_id',$this->wish->id)->delete();
                WishItem::where('id',$this->wish->id)->delete();
                break;
            }
        }
    }
}
