@extends('email.default-2')
@section('content')
{{--
    Back-in-stock notice.

    Everyone waiting is told at once, so the stock number is stated plainly — most of
    them will not get one, and finding that out on the checkout page is worse than
    being told here.

    Content-first copy only. No gift / tip / donation / fundraising wording.
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
                                📦
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
                    It's back, <span style="color:#FF007F;">{{ $firstName }}</span>
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    You asked to be told when this was available again. It is &mdash; but everyone
                    who was waiting has been told at the same time, so it may not last.
                </td>
            </tr>

            {{-- The item --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;letter-spacing:1px;
                                text-transform:uppercase;color:#9A9A9A;padding-bottom:10px;">
                        Available again
                    </div>

                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;">
                        <tr>
                            <td style="padding:14px 16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                            font-size:15px;color:#1A1A1A;line-height:22px;">
                                    {{ $itemName }}
                                </div>

                                @if ($creatorUsername)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                            color:#9A9A9A;line-height:20px;">
                                    {{-- &#64; not &commat;: the named entity is HTML5-only and
                                         several mail clients print it as literal text. --}}
                                    &#64;{{ $creatorUsername }}
                                </div>
                                @endif

                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;
                                            font-size:16px;color:#1A1A1A;line-height:24px;padding-top:10px;">
                                    {{ $stock }} available
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Primary action --}}
            <tr>
                <td align="center" style="padding:24px 0 12px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $itemUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    View the item
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Footnote --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:12px 0 8px 0;text-align:center;">
                    You are receiving this because you asked to be told when
                    {{ $creatorName }}'s item was back.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Turn off these notices
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
