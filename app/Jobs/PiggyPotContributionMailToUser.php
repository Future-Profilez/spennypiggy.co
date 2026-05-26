<?php

namespace App\Jobs;

use App\Helpers;
use App\Mail\PiggyPotContributionReceiptMail;
use App\Mail\PiggyPotContributionReceivedMail;
use App\Models\PiggyPotContribution;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class PiggyPotContributionMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $contributionId;
    public bool $sendCreator;
    public bool $sendSupporter;

    public function __construct(int $contributionId, bool $sendCreator = true, bool $sendSupporter = true)
    {
        $this->contributionId = $contributionId;
        $this->sendCreator = $sendCreator;
        $this->sendSupporter = $sendSupporter;
    }

    public function handle(): void
    {
        $pay = PiggyPotContribution::with(['creator', 'piggyPot', 'user'])->find($this->contributionId);
        if (!$pay) {
            return;
        }

        $symbol = Helpers::getCurrency($pay->currency ?? 'GBP');

        if ($this->sendCreator) {
            $creatorEmail = $pay->creator?->email;
            if ($creatorEmail && ($pay->creator?->notification_send ?? 1) == 1) {
                Mail::to($creatorEmail)->send(new PiggyPotContributionReceivedMail($pay, $symbol));
            }
        }

        if ($this->sendSupporter) {
            $supporterEmail = $pay->user?->email ?: $pay->guest_email;
            if (!$supporterEmail) {
                return;
            }

            if ($pay->user && ($pay->user->notification_send ?? 1) != 1) {
                return;
            }

            $thankYouParams = [
                'username' => $pay->creator?->username,
                'type' => 'piggy_pot',
                'item_name' => $pay->piggyPot?->title ?? 'Piggy Pot',
                'amount' => $pay->total_paid,
                'currency' => $pay->currency,
            ];

            if (!empty($pay->piggyPot?->content_file)) {
                $contentUrl = $pay->piggyPot->content_file;
                if (!str_starts_with($contentUrl, 'http://') && !str_starts_with($contentUrl, 'https://')) {
                    $contentUrl = 'https://ucarecdn.com/' . trim($contentUrl, '/') . '/';
                }
                $thankYouParams['wish_content'] = [
                    'type' => null,
                    'name' => $pay->piggyPot?->content_description ?: 'Exclusive Reward',
                    'url' => $contentUrl,
                ];
            }

            $thankYouUrl = route('thank-you', $thankYouParams);

            Mail::to($supporterEmail)->send(new PiggyPotContributionReceiptMail($pay, $symbol, $thankYouUrl));
        }
    }
}
