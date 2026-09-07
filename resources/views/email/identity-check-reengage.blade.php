@extends('email.default-2')
@section('content')
{{-- One-off ID-check re-engagement, worded per reason. Trust facts must stay TRUE of the shipped system. --}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#E9E5FF"
                                style="width:68px;height:68px;background-color:#E9E5FF;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🪪
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    Hi {{ $creatorName }}
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    {{ $lead }}
                </td>
            </tr>

            <tr>
                <td style="padding:0 0 12px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:8px;">
                                    What to do
                                </div>
                                @foreach ($steps as $step)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;line-height:20px;">
                                    &bull; {{ $step }}
                                </div>
                                @endforeach
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- The trust panel — the same facts the page shows --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FFFFFF;border-radius:14px;border:2px solid #000000;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:6px;">
                                    🔒 Your ID is checked by Stripe, not stored by us
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#4A4A4A;line-height:20px;">
                                    &bull; Your passport photo and selfie go straight to Stripe’s secure servers — never uploaded to or stored on Spenny Piggy<br>
                                    &bull; Stripe is PCI Level 1 certified and runs ID checks for millions of businesses<br>
                                    &bull; UK law requires us to confirm who receives payouts — this is that check, done once<br>
                                    &bull; Our team only ever views a result inside Stripe’s own dashboard; we never keep a copy
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#666666;line-height:18px;padding-top:8px;">
                                    <a href="https://stripe.com/privacy" target="_blank" style="color:#000000;text-decoration:underline;">How Stripe handles your data</a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:24px 0 24px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            {{-- Black type on brand pink: white measures 3.78:1 and fails AA. --}}
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;-webkit-border-radius:999px;">
                                <a href="{{ $actionUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    {{ $reason === 'abandoned' ? 'Finish the check' : 'Start the check' }}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this once because your Spenny Piggy page is approved and its ID check is not finished.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Unsubscribe from creator updates
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
