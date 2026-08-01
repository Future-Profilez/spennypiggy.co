{{--
    "Keep it coming" — the creator's membership, offered to someone who has just bought
    from them once.

    Follows the same pattern as email.reward-block: the partial resolves its own content, so
    a template only has to say who the creator is. Renders NOTHING when there is no offer,
    which is the normal case — the service stays silent for a creator with no published
    membership, for a buyer who is already subscribed, and after a membership purchase.

    Usage (buyer receipts only, never the creator's copy):
        @include('email.membership-offer', ['creatorUsername' => $creatorUsername])
        @include('email.membership-offer', ['creator' => $creator, 'buyer' => $supporter])

    ⚠️ Pass `buyer` OR `buyerEmail` — without either, the "already a member" check cannot run
    and an existing member gets invited to join something they already pay for. Several receipt
    templates carry no buyer model, only a deliverable, which is why the email form exists.
--}}
@php
    $offerCreator = $creator ?? null;

    if (! $offerCreator && ! empty($creatorUsername)) {
        $offerCreator = \App\Models\User::where('username', $creatorUsername)->first();
    }

    $buyerModel = $buyer ?? null;
    $buyerEmailAddress = $buyerEmail ?? null;

    $offer = $offerCreator
        ? app(\App\Services\MembershipUpsellService::class)
            ->for($offerCreator, $buyerModel, $buyerEmailAddress)
        : null;

    $offerPrice = $offer
        ? rtrim(rtrim(number_format((float) $offer['price'], 2), '0'), '.')
        : null;

    $dismissUrl = $offer && $offerCreator
        ? \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'membership-offer.dismiss-link',
            now()->addDays(\App\Services\MembershipUpsellService::DISMISSAL_DAYS),
            [
                'creator_id' => $offerCreator->id,
                'user_id' => $buyerModel?->id,
                'email' => $buyerEmailAddress ?: $buyerModel?->email,
            ]
        )
        : null;
@endphp

@if ($offer)
    <tr>
        <td align="center" style="padding:8px 28px 24px 28px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;border:3px solid #000000;border-radius:20px;background:#FFF6EC;">
                <tr>
                    <td style="padding:20px;">
                        <p style="margin:0 0 6px 0;font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#FF007F;">
                            Keep it coming
                        </p>

                        <p style="margin:0 0 6px 0;font-family:'Outfit',Arial,sans-serif;font-size:18px;font-weight:800;color:#1A1A1A;line-height:1.3;">
                            Become a member of {{ $offerCreator->name ?: $offerCreator->username }}
                        </p>

                        <p style="margin:0 0 16px 0;font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;line-height:1.5;">
                            {{ $offer['description'] ?: ($offer['title'] ?: 'Get their members-only content every month.') }}
                        </p>

                        <a href="{{ $offer['checkout_url'] }}" target="_blank"
                           style="display:inline-block;background:#FF007F;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:14px;border:3px solid #000000;">
                            Join for {{ $offer['symbol'] }}{{ $offerPrice }}/mo
                        </a>

                        {{-- Stated plainly. A recurring charge someone feels eased into is a
                             chargeback, not a member. --}}
                        <p style="margin:12px 0 0 0;font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A8A8A;">
                            Cancel any time.
                            @if ($dismissUrl)
                                &bull; <a href="{{ $dismissUrl }}" target="_blank" style="color:#FF007F;text-decoration:underline;">No thanks</a>
                            @endif
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endif
