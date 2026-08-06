@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Thanks emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🙏
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{--
                        ⚠️ Content-first: this reads as a PURCHASE, never a gift, wish
                        granted, treat or donation. A receipt is the most Stripe-facing
                        surface the platform sends — see CLAUDE.md "Stripe content-first
                        compliance" before rewording anything here.
                    --}}
                    Thank you for your purchase from<br>{{ isset($data->owner) && isset($data->owner->name) ? $data->owner->name : 'this creator' }}
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    {{--
                        🚨 The amount is resolved in CheckoutToUser::buyerCharge(), NOT here.
                        This block used to pick it from a fallback chain
                        (total_paid → amount_subtotal → amount → amount_total) and was wrong
                        for every shape: `stripe_payment_details` has no `total_paid` column
                        so it always printed `amount_subtotal` — the CREATOR's net, not what
                        the buyer paid — and `stripe_payment_items.total_paid` is never
                        written, so an item printed 0.00. It also looked the currency up by
                        SYMBOL, and `$` matches 8 currencies, so a USD receipt was silently
                        converted to BMD. Do not reintroduce amount logic in this template.
                    --}}
                    Your purchase of <strong style="color:#8C52FF;">{{ $buyerCurrencySymbol }}{{ number_format(max(0, (float) $buyerPaid), $buyerCurrencyDigits) }}</strong> is confirmed ✨
                </td>
            </tr>

            {{-- Receipt details card --}}
            <tr>
                <td style="padding:0 0 16px 0;">
                    @php
                        $orderId = $data->session_id ?? ($data->payment->session_id ?? null);
                        $receiptId = $data->uuid ?? ($data->payment->uuid ?? null);
                        $paymentIntentId = $data->stripe_payment_intent_id ?? ($data->payment->stripe_payment_intent_id ?? null);
                        $internalPaymentId = $data->id ?? null;
                    @endphp
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:13px;color:#1A1A1A;padding:0 0 10px 0;">
                                    🧾 Receipt Details
                                </div>
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Seller (Creator)</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;">{{ isset($data->owner) && isset($data->owner->name) ? $data->owner->name : 'Creator' }}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Order ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $orderId ?: 'N/A' }}</td>
                                    </tr>
                                    @if(!empty($receiptId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Receipt ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $receiptId }}</td>
                                    </tr>
                                    @endif
                                    @if(!empty($paymentIntentId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Payment Intent</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $paymentIntentId }}</td>
                                    </tr>
                                    @endif
                                    @if(!empty($internalPaymentId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Internal ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $internalPaymentId }}</td>
                                    </tr>
                                    @endif
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Compliance note --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:12px;color:#999999;
                           line-height:18px;padding:0 0 20px 0;text-align:center;">
                    Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.
                    <br />
                    Spenny Piggy is the technology platform; the Creator is the seller (Merchant of Record).
                </td>
            </tr>

            {{-- Contact / Refund buttons --}}
            <tr>
                <td align="center" style="padding:0 0 10px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ $contactUrl ?? ($supportUrl ?? url('/history')) }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Contact Creator →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding:0 0 22px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#4a5568"
                                style="background-color:#4a5568;border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ $refundUrl ?? ($supportUrl ?? url('/history')) }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Request Refund
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            @php
                // Get content deliverables and certificates for this payment
                $contentDeliverables = [];
                $certificateDeliverables = [];
                try {
                    // First check if consolidated deliverables are passed directly (new approach)
                    if (isset($data->consolidated_email) && $data->consolidated_email && isset($data->deliverables)) {
                        $allDeliverables = collect($data->deliverables);
                        $contentDeliverables = $allDeliverables->filter(function($d) {
                            return !empty($d->deliverable_url) && $d->deliverable_type !== 'email';
                        });
                        $certificateDeliverables = $allDeliverables->filter(function($d) {
                            return !empty($d->certificate_url);
                        });
                        \Log::info('Email template: Using consolidated deliverables', [
                            'content_count' => $contentDeliverables->count(),
                            'certificate_count' => $certificateDeliverables->count()
                        ]);
                    } else {
                        // Fallback to database query (legacy approach)
                        if (isset($data->id)) {
                            $contentDeliverables = \App\Models\Deliverable::where('session_id', $data->session_id ?? null)
                                ->where('deliverable_type', '!=', 'email')
                                ->where('status', 'delivered')
                                ->whereNotNull('deliverable_url')
                                ->get();
                            $certificateDeliverables = \App\Models\Deliverable::where('session_id', $data->session_id ?? null)
                                ->where('status', 'delivered')
                                ->whereNotNull('certificate_url')
                                ->get();
                            \Log::info('Email template: Using database query deliverables', [
                                'content_count' => $contentDeliverables->count(),
                                'certificate_count' => $certificateDeliverables->count()
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('Email template: Failed to load deliverables', ['error' => $e->getMessage()]);
                    $contentDeliverables = collect();
                    $certificateDeliverables = collect();
                }
            @endphp

            @if($contentDeliverables && count($contentDeliverables) > 0)
            <tr>
                <td style="padding:0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#FF007F;text-align:center;padding:0 0 8px 0;">🔓 Your Content is Ready!</div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;text-align:center;padding:0 0 16px 0;">Click the links below to access your exclusive content:</div>

                                @include('email.digital-content-notice')

                                @foreach($contentDeliverables as $deliverable)
                                    @php
                                        // Handle both consolidated deliverables (objects) and legacy deliverables (models)
                                        if (is_object($deliverable) && isset($deliverable->metadata)) {
                                            $metadata = is_array($deliverable->metadata) ? $deliverable->metadata : json_decode($deliverable->metadata, true);
                                        } else {
                                            $metadata = [];
                                        }

                                        // Get wish name - try multiple sources
                                        $wishName = 'Digital Content';
                                        if (isset($deliverable->wish_item) && $deliverable->wish_item->wishname) {
                                            $wishName = $deliverable->wish_item->wishname;
                                        } elseif (isset($metadata['wish_name'])) {
                                            $wishName = $metadata['wish_name'];
                                        }

                                        // Get media type information
                                        $mediaType = $metadata['media_type'] ?? $metadata['content_file_type'] ?? 'file';
                                        $fileName = $metadata['content_file_name'] ?? null;
                                        $contentSource = $metadata['content_source'] ?? 'unknown';

                                        // Determine content type and icon
                                        $contentIcon = '📄';
                                        $contentDescription = 'Digital File';

                                        if (!empty($mediaType)) {
                                            if (strpos($mediaType, 'video/') === 0) {
                                                $contentIcon = '🎬';
                                                $contentDescription = 'Video Content';
                                            } elseif (strpos($mediaType, 'image/') === 0) {
                                                $contentIcon = '🖼️';
                                                $contentDescription = 'Image Content';
                                            } elseif (strpos($mediaType, 'audio/') === 0) {
                                                $contentIcon = '🎵';
                                                $contentDescription = 'Audio Content';
                                            } elseif ($mediaType == 'application/pdf') {
                                                $contentIcon = '📋';
                                                $contentDescription = 'PDF Document';
                                            }
                                        }

                                        // Get deliverable URL - Use tracking URL if UUID is available
                                        $contentUrl = isset($deliverable->uuid)
                                           ? route('deliverable.access', $deliverable->uuid)
                                           : ($deliverable->deliverable_url ?? '#');
                                    @endphp
                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin:0 0 12px 0;">
                                        <tr>
                                            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;border-left:4px solid #8C52FF;padding:14px 16px;text-align:center;">
                                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;color:#1A1A1A;padding:0 0 4px 0;">{{ $wishName }}</div>
                                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;padding:0 0 12px 0;">
                                                    {{ $contentIcon }} {{ $contentDescription }}
                                                    @if(!empty($fileName))
                                                        <br><span style="font-size:12px;color:#999999;">📁 {{ $fileName }}</span>
                                                    @endif
                                                </div>
                                                <a href="{{ $contentUrl }}"
                                                   style="display:inline-block;padding:10px 24px;background-color:#8C52FF;color:#ffffff;text-decoration:none;border-radius:50px;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;"
                                                   target="_blank">🎁 Access Your Content</a>
                                            </td>
                                        </tr>
                                    </table>
                                @endforeach
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            @if($certificateDeliverables && count($certificateDeliverables) > 0)
            <tr>
                <td style="padding:0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#8C52FF;text-align:center;padding:0 0 8px 0;">🏆 Certificate of Authenticity</div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;text-align:center;padding:0 0 16px 0;">Your purchase comes with an official certificate of authenticity for your records:</div>

                                @foreach($certificateDeliverables as $deliverable)
                                    @php
                                        // Handle both consolidated deliverables (objects) and legacy deliverables (models)
                                        if (is_object($deliverable) && isset($deliverable->metadata)) {
                                            $metadata = is_array($deliverable->metadata) ? $deliverable->metadata : json_decode($deliverable->metadata, true);
                                        } else {
                                            $metadata = [];
                                        }

                                        // Get wish name for certificate
                                        $itemName = 'Digital Purchase';
                                        if (isset($deliverable->wish_item) && $deliverable->wish_item->wishname) {
                                            $itemName = $deliverable->wish_item->wishname;
                                        } elseif (isset($metadata['wish_name'])) {
                                            $itemName = $metadata['wish_name'];
                                        }

                                        // Get certificate URL
                                        $certificateUrl = $deliverable->certificate_url ?? '#';
                                        $certificateId = isset($deliverable->uuid) ? substr($deliverable->uuid, 0, 8) : 'N/A';
                                    @endphp
                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin:0 0 12px 0;">
                                        <tr>
                                            <td bgcolor="#FF007F" style="background-color:#FF007F;background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);border-radius:12px;padding:16px;text-align:center;">
                                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;padding:0 0 6px 0;">🎊 {{ $itemName }}</div>
                                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#ffffff;opacity:0.9;padding:0 0 14px 0;">Certificate ID: {{ $certificateId }}...</div>
                                                <a href="{{ $certificateUrl }}"
                                                   style="display:inline-block;padding:10px 24px;background-color:rgba(255,255,255,0.2);color:#ffffff;text-decoration:none;border-radius:50px;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;border:2px solid rgba(255,255,255,0.4);"
                                                   target="_blank">📜 Download Certificate</a>
                                            </td>
                                        </tr>
                                    </table>
                                @endforeach

                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#999999;text-align:center;padding:6px 0 0 0;">
                                    💡 <strong style="color:#666666;">What's this?</strong> Your certificate serves as proof of authentic purchase and content delivery. Keep it safe for your records!
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Discover more creators on <a href="https://spennypiggy.co/" style="color:#8C52FF;text-decoration:none;font-weight:600;">Spenny Piggy</a> — check out their Intros, memberships and more! ✨
                </td>
            </tr>

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') . '/' . (isset($data->owner) && isset($data->owner->username) ? $data->owner->username : '') }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Send more surprises →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- One-off buyer: offer the creator's membership. Silent unless there is one.
                 ⚠️ A cart can span several creators; this offers the FIRST deliverable's
                 creator only. Advertising every creator in one basket would be a list of
                 adverts, not a next step. --}}
            @php($offerDeliverable = collect($allDeliverables ?? [])->first())
            @include('email.membership-offer', [
                'creator' => optional($offerDeliverable)->creator,
                'buyerEmail' => optional($offerDeliverable)->customer_email,
            ])

        </table>
    </td>
</tr>
@include('email.guest-purchase-hint', ['isGuest' => empty($data->user_id)])
@endsection
