{{--
    Shared "what the supporter got" block for purchase confirmation emails.

    Pass ONE of:
      $rewardItem  — the Eloquent item model (WishItem, Shop, Task, PiggyPot,
                     TipGoal, Bills, Membership). RewardService::for() reads the
                     reward columns directly (it bypasses $hidden), so the paid
                     message/link body is available here even though it is hidden
                     from public JSON.
      $reward      — a pre-built RewardService::for() array.

    Optional:
      $rewardShowFile   — default false. The legacy templates already render the
                          file deliverable + its download link, so this block
                          only adds the pieces they miss (title, description, and
                          message/link content). Pass true where this block IS
                          the only reward surface (e.g. the piggy-pot receipt,
                          which replaced its own reward markup with this).
      $rewardShowWaiver — default true. Shows the no-refund / digital-content
                          notice for message/link content (templates gate their
                          own notice on a file deliverable, so message/link
                          rewards would otherwise carry no notice).

    Buyer-facing: reward_body (the paid message/link) IS shown — the email goes
    to the person who paid for it.
--}}
@php
    $reward = $reward ?? (isset($rewardItem) && $rewardItem ? \App\Services\RewardService::for($rewardItem) : null);
    $rewardShowFile = $rewardShowFile ?? false;
    $rewardShowWaiver = $rewardShowWaiver ?? true;

    $rewardType = $reward['type'] ?? null;
    $rewardTitle = $reward['title'] ?? null;
    $rewardDescription = $reward['description'] ?? null;
    $rewardText = $reward['text'] ?? null;
    $rewardLink = $reward['link'] ?? null;
    $rewardMediaUrl = $reward['media']['url'] ?? null;
    $rewardMediaName = $reward['media']['name'] ?? null;

    // What this block actually renders as unlockable content.
    $rewardShowsMessage = $rewardType === 'message' && ! empty($rewardText);
    $rewardShowsLink = $rewardType === 'link' && ! empty($rewardLink);
    $rewardShowsFile = $rewardShowFile && ! empty($rewardMediaUrl);
    $rewardShowsContent = $rewardShowsMessage || $rewardShowsLink || $rewardShowsFile;
@endphp

@if($reward && ($rewardShowsContent || ! empty($rewardTitle)))
<tr>
    <td style="padding:0 0 18px 0;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
            bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
            <tr>
                <td style="padding:20px 22px;">
                    <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:13px;color:#FF007F;text-transform:uppercase;text-align:center;padding:0 0 4px 0;">
                        🎁 What you got
                    </div>

                    @if(!empty($rewardTitle))
                        <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#1A1A1A;text-align:center;padding:6px 0 2px 0;">
                            {{ $rewardTitle }}
                        </div>
                    @endif
                    @if(!empty($rewardDescription))
                        <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;text-align:center;padding:0 0 12px 0;">
                            {{ $rewardDescription }}
                        </div>
                    @endif

                    @if($rewardShowWaiver && ($rewardShowsMessage || $rewardShowsLink))
                        @include('email.digital-content-notice')
                    @endif

                    @if($rewardShowsContent)
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin:12px 0 0 0;">
                        <tr>
                            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;border-left:4px solid #8C52FF;padding:14px 16px;text-align:center;">
                                @if($rewardShowsMessage)
                                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;white-space:pre-wrap;text-align:left;">{{ $rewardText }}</div>
                                @elseif($rewardShowsLink)
                                    <a href="{{ $rewardLink }}" style="display:inline-block;padding:10px 24px;background-color:#8C52FF;color:#ffffff;text-decoration:none;border-radius:50px;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;" target="_blank">Open your content →</a>
                                @elseif($rewardShowsFile)
                                    @if(!empty($rewardMediaName))
                                        <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;padding:0 0 10px 0;">{{ $rewardMediaName }}</div>
                                    @endif
                                    <a href="{{ $rewardMediaUrl }}" style="display:inline-block;padding:10px 24px;background-color:#8C52FF;color:#ffffff;text-decoration:none;border-radius:50px;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;" target="_blank">🎁 Access your content</a>
                                @endif
                            </td>
                        </tr>
                    </table>
                    @endif

                    @if($reward['post_access'] ?? false)
                        <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;text-align:center;padding:12px 0 0 0;">
                            🔓 {{ $reward['post_access_label'] ?? 'Members-only posts' }} unlocked while your subscription is active
                        </div>
                    @endif
                </td>
            </tr>
        </table>
    </td>
</tr>
@endif
