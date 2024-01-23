<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class CheckProfilePhotosAdult implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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
        $rest_words = ['Adult', '18+', 'Pornographic', 'xxx', 'nsfw','NSFW','XXX', 'Blood', 'Brutality', 'Explicit', 'Mature', 'Weapons', 'Aggression', 'Combat', 'Sexual', 'Porn', 'Fucking','Graphic'];


        //For avatar adult check.
        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $this->user->avatar,
        ]);


        $response = Http::withHeaders([
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->get("https://api.uploadcare.com/files/". $this->user->avatar ."/?include=appdata");

        $data = $response->json();
        $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];

        foreach ($tags as $key => $tag) {
            $name = explode(" ", $tag['Name']);

            $common = array_intersect($rest_words, $name);

            if (count($common) > 0) {
                EmailService::sendAvatarRestrictionMail($this->user);
                $this->user->avatar = null;
                $this->user->save();
                break;
            }
        }


        //For cover adult check.
        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $this->user->cover,
        ]);


        $response = Http::withHeaders([
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->get("https://api.uploadcare.com/files/". $this->user->cover ."/?include=appdata");

        $data = $response->json();
        $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];

        foreach ($tags as $key => $tag) {
            $name = explode(" ", $tag['Name']);

            $common = array_intersect($rest_words, $name);

            if (count($common) > 0) {
                EmailService::sendCoverRestrictionMail($this->user);
                $this->user->cover = null;
                $this->user->save();
                break;
            }
        }
    }
}
