@extends('email.default-2')
@section('content')
{{--
    Rejected-profile re-engagement. Names the reason, names what is missing,
    sells the page — NEVER an earnings figure (content-first copy, no gift/tip/
    donation/bill wording; use &#64; for @).
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#E6EA7B"
                                style="width:68px;height:68px;background-color:#E6EA7B;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🐷
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    Your page is still here, {{ $creatorName }}
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    Your profile was not approved last time — but nothing was deleted, and it is one fix away
                    from being live. Here is exactly what to change.
                </td>
            </tr>

            {{-- WHY --}}
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FFF6D6;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:6px;">
                                    Why it was turned down
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#4A4A4A;line-height:20px;">
                                    {{ $rejectReason }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- WHAT (only when something is genuinely absent) --}}
            @if (count($missing))
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:8px;">
                                    Still to add
                                </div>
                                @foreach ($missing as $item)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;line-height:20px;">
                                    &bull; {{ ucfirst($item) }}
                                </div>
                                @endforeach
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- What the page does for them — the argument, with no figures --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#F3FBF6;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:6px;">
                                    What is waiting on the other side
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#4A4A4A;line-height:20px;">
                                    &bull; Memberships your supporters renew every month<br>
                                    &bull; One-off content they unlock straight away<br>
                                    &bull; Paid requests made just for them<br>
                                    &bull; You keep your listed price — supporters cover the fees<br>
                                    &bull; Nothing is charged to you until your first sale
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
                                    Fix it and submit again
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
                    You are receiving this because your Spenny Piggy profile was reviewed and not approved.
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
