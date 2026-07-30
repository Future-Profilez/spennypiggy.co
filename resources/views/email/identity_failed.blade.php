@extends('email.default-2')
@section('content')
{{-- $failure is the resolved payload from App\Support\IdentityFailureReason —
     the same words the creator sees on their profile. Rows written before that
     map existed still resolve, so this template never needs a fallback branch
     for a raw Stripe code. --}}
@php
    $failure = $failure ?? \App\Support\IdentityFailureReason::explain($user->identity_verification_error ?? null);
    $isFraud = ($failure['code'] ?? null) === 'fraud_suspected';
    $steps = $failure['what_to_do'] ?? [];
@endphp
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                ⚠️
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading: what actually went wrong, not the word "failed" --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{ $failure['title'] ?? 'Your ID check didn’t go through' }}
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 8px 0;text-align:center;">
                    Hello <strong style="color:#1A1A1A;">{{ ucfirst(strtolower($user->name)) }}</strong>,
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    {{ $failure['what_happened'] ?? 'Stripe couldn’t complete your identity check this time.' }}
                    @unless($isFraud)
                        Nothing else on your account has changed, and you can try again straight away.
                    @endunless
                </td>
            </tr>

            {{-- What to do next --}}
            @if(!empty($steps))
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 12px 0;">
                                            What to do next
                                        </td>
                                    </tr>
                                    @foreach($steps as $index => $step)
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;
                                                   font-weight:400;line-height:20px;padding:0 0 {{ $loop->last ? '0' : '8' }}px 0;">
                                            <span style="color:#8C52FF;font-weight:700;">{{ $index + 1 }}.</span>&nbsp;{{ $step }}
                                        </td>
                                    </tr>
                                    @endforeach
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- An admin's own note, when a person rejected the check --}}
            @if(!empty($failure['note']))
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#F6F6F8"
                        style="background-color:#F6F6F8;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:18px 22px;font-family:'Outfit',Arial,sans-serif;font-size:14px;
                                       color:#4A4A4A;line-height:20px;">
                                <strong style="color:#1A1A1A;">Note from our team</strong><br>
                                {{ $failure['note'] }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- CTA. Without it the creator is told they failed and left to find
                 the retry screen themselves — the single biggest gap in the old
                 template. A fraud-flagged check has no retry, so it gets support
                 instead of a button that cannot help. --}}
            @unless($isFraud)
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#1A1A1A"
                                style="background-color:#1A1A1A;border-radius:14px;-webkit-border-radius:14px;">
                                <a href="{{ $retryUrl ?? rtrim(config('app.url'), '/').'/stripe/identity-verification' }}"
                                   style="display:inline-block;padding:14px 30px;font-family:'Outfit',Arial,sans-serif;
                                          font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">
                                    Try verification again
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endunless

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:13px;color:#999999;
                           line-height:19px;padding:0 0 8px 0;text-align:center;">
                    Still stuck? Email
                    <a href="mailto:{{ $supportEmail ?? config('support.contact_email') }}"
                       style="color:#8C52FF;text-decoration:none;font-weight:600;">{{ $supportEmail ?? config('support.contact_email') }}</a>
                    and we’ll take a look.
                </td>
            </tr>

            {{-- Stripe's own wording, kept small and last: it is written for
                 developers, and quoting it as the headline is what made the old
                 email read like a system error. --}}
            @if(!empty($failure['reason']))
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:12px;color:#B0B0B0;
                           line-height:18px;padding:0 0 4px 0;text-align:center;">
                    Reference: {{ $failure['reason'] }}
                </td>
            </tr>
            @endif

        </table>
    </td>
</tr>
@endsection
