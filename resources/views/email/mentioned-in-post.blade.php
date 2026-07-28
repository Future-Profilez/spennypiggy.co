@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                💬
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    <span style="color:#FF007F;">{{ $creatorName }}</span> mentioned you
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    &#64;{{ $creatorUsername }} tagged you in a post on Spenny Piggy.
                </td>
            </tr>

            @if($postTitle || $excerpt)
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           bgcolor="#FAF8F5" style="background-color:#FAF8F5;border-radius:16px;">
                        <tr>
                            <td style="padding:18px 20px;font-family:'Outfit',Arial,sans-serif;">
                                @if($postTitle)
                                    <div style="font-weight:700;font-size:16px;color:#1A1A1A;line-height:22px;">{{ $postTitle }}</div>
                                @endif
                                @if($excerpt)
                                    <div style="font-size:14px;color:#4A4A4A;line-height:22px;padding-top:6px;">{{ $excerpt }}</div>
                                @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            <tr>
                <td align="center" style="padding:0 0 28px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F" style="background-color:#FF007F;border-radius:30px;">
                                <a href="{{ $postUrl }}"
                                   style="display:inline-block;padding:14px 30px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:700;font-size:15px;color:#FFFFFF;text-decoration:none;">
                                    View the post
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
