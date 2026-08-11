@extends('email.default-2')
@section('content')
{{--
    A payment was stopped before it reached Stripe.

    ⚠️ EVERY sentence here comes from App\Support\RiskMessages. Do not write copy
    into this template. The three rules from the 9 Aug messaging brief hold in an
    inbox exactly as they do on screen:

      1. No threshold — no minutes, no spend headroom, no attempt count.
      2. No accusation — the overwhelming majority of people receiving this are
         genuine, and an email keeps far longer than a toast.
      3. Always a next step — a dead end is what sends someone to their bank.

    ⚠️ The CTA is only rendered when the server resolved a URL for THIS reader.
    A guest gets a link they can actually open (register) or none at all — never
    a link into the signed-in app, which they would land on as a login wall
    having already been turned away once.
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Deliberately a calm badge, never a warning triangle. --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🐷
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading — the message's own title. --}}
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

            {{-- Body. Paragraphs arrive as newlines and are split rather than
                 rendered as markup — this copy is never trusted as HTML. --}}
            @foreach (preg_split('/\R+/', (string) ($ui['body'] ?? ''), -1, PREG_SPLIT_NO_EMPTY) as $line)
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 12px 0;text-align:center;">
                    {{ trim($line) }}
                </td>
            </tr>
            @endforeach

            {{-- The next step, given its own weight. It is the whole reason
                 this email is worth sending. --}}
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

            {{-- The single most reassuring fact, said last so it is what they
                 leave with. Nothing left their account. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#9A9A9A;
                           line-height:20px;padding:14px 0 0 0;text-align:center;">
                    Nothing has been charged.
                    @if ($isGuest)
                        We sent this because a payment was started with this email address.
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
