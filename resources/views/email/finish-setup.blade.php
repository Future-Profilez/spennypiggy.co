@extends('email.default-2')
@section('content')
{{--
    "Finish setting up your page" — sent at most twice per journey step
    (CreatorJourneyService::NUDGE_STAGES), then silence on that step.

    🚨 The heading, body and button label are passed in from
    CreatorJourneyService::STEPS. Do NOT retype step copy here — the dashboard card, the
    nudge bar and this email must say the same thing, and a second copy is how they drift.

    Content-first copy only: no gift/tip/donation/fundraise/bill wording.
    Use &#64; for @.

    ⚠️ Black type on the pink button, not white. #FF007F is mid-luminance: white is 3.78:1
    (fails AA at label size), black is 5.56:1. House rule, both apps, every surface.
--}}
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
                                {{ $emoji }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Where they are. A stalled creator has forgotten how close they got. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;
                           text-transform:uppercase;color:#FF007F;font-weight:700;
                           padding:0 0 10px 0;text-align:center;">
                    Step {{ $stepNumber }} of {{ $totalSteps }}
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{ $heading }}
                </td>
            </tr>

            {{-- Greeting + why this arrived now --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    Hi {{ $creatorName }} — {{ $context }}
                </td>
            </tr>

            {{-- The step itself, in the platform's own words --}}
            @if ($body)
            <tr>
                <td style="padding:0 0 4px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;font-size:14px;
                                       color:#4A4A4A;line-height:22px;">
                                {{ $body }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Primary action --}}
            <tr>
                <td align="center" style="padding:24px 0 20px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $ctaUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    {{ $ctaLabel }}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Second reminder says plainly that it is the last one. --}}
            @if ($stage >= 7)
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;
                           line-height:20px;padding:0 0 16px 0;text-align:center;">
                    This is the last reminder we will send about this step. Your page stays exactly as you left it — pick it up whenever you are ready.
                </td>
            </tr>
            @endif

            {{-- Footnote --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this because you started setting up a creator page on Spenny Piggy and have not finished this step.
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
