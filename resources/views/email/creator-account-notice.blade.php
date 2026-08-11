@extends('email.default-2')
@section('content')
{{--
    A creator-facing account notice: payments stopped, or a payout held.

    ⚠️ Do not write copy into this template. Every sentence comes from
    App\Support\RiskMessages, so the email, the dashboard and the in-app
    notification cannot describe the same event differently.

    ⚠️ The REASON is the reason this email exists. Both states that render here
    are ones the brief singles out for specificity — a held payout left
    unexplained is, in the client's words, the single scariest message a
    creator can receive. The reason is already interpolated into the body by
    RiskMessages before it arrives here.

    Unlike the supporter messages, a creator MAY be told numbers here — their
    own reserve percentage, their own posting requirement. Those are their
    account's terms, not a threshold anyone can stay under.
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFF4E0"
                                style="width:68px;height:68px;background-color:#FFF4E0;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                ⚠️
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{ $ui['title'] ?? '' }}
                </td>
            </tr>

            @if (! empty($firstName))
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 6px 0;text-align:center;">
                    Hi {{ $firstName }},
                </td>
            </tr>
            @endif

            {{-- Paragraphs arrive as newlines and are split rather than rendered
                 as markup — the reason is written by an admin, so it is never
                 trusted as HTML. --}}
            @foreach (preg_split('/\R+/', (string) ($ui['body'] ?? ''), -1, PREG_SPLIT_NO_EMPTY) as $line)
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 12px 0;text-align:center;">
                    {{ trim($line) }}
                </td>
            </tr>
            @endforeach

            @if (! empty($ui['next_step']))
            <tr>
                <td style="padding:8px 0 4px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;">
                        <tr>
                            <td style="padding:14px 16px;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                       font-size:15px;color:#1A1A1A;line-height:22px;text-align:center;">
                                {{ $ui['next_step'] }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            @if (! empty($ui['cta']['url']))
            <tr>
                <td align="center" style="padding:24px 0 12px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $ui['cta']['url'] }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    {{ $ui['cta']['label'] }}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#9A9A9A;
                           line-height:20px;padding:14px 0 0 0;text-align:center;">
                    Stuck? Reply to this email or use the chat bubble on your dashboard &mdash;
                    we'll walk you through it.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
