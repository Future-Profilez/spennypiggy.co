@extends('email.default-2')
@section('content')
{{-- Help conversation opened — creator-facing. Transactional; no opt-out. Use &#64; for @. --}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;-webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                💬
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{ $auto ? 'We opened a conversation with you' : 'Your help request is open' }}, {{ $creatorName }}
                </td>
            </tr>
            <tr>
                <td align="center" style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:24px;padding:0 0 20px 0;text-align:center;">
                    <strong style="color:#1A1A1A;">{{ $title }}</strong> &middot; Ticket #{{ $ticketNumber }}
                </td>
            </tr>
            @if (! empty($opening))
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:.08em;padding-bottom:6px;">
                                    From the Spenny Piggy team
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;line-height:22px;white-space:pre-line;">{{ $opening }}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif
            <tr>
                <td align="center" style="padding:24px 0 24px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F" style="background-color:#FF007F;border-radius:999px;-webkit-border-radius:999px;">
                                <a href="{{ $url }}" target="_blank" style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:15px;color:#000000;text-decoration:none;border-radius:999px;-webkit-border-radius:999px;">
                                    Open the conversation
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;line-height:20px;padding:0 0 8px 0;text-align:center;">
                    Reply inside Spenny Piggy — a person reads every message on this ticket.
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
