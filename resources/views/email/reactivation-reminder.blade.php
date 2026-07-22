@extends('email.default-2')
@section('content')
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

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{ $heading }}, <span style="color:#FF007F;">{{ $firstName }}</span>
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    {{ $intro }}
                </td>
            </tr>

            {{-- Creators this supporter actually pays. Named people beat a generic pitch. --}}
            @if (!empty($creators))
            <tr>
                <td style="padding:0 0 8px 0;">
                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;letter-spacing:1px;
                                text-transform:uppercase;color:#9A9A9A;padding-bottom:10px;">
                        Creators you support
                    </div>

                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;">
                        @foreach ($creators as $creator)
                        <tr>
                            <td style="padding:12px 14px;{{ $loop->last ? '' : 'border-bottom:1px solid #F0E7ED;' }}">
                                <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%">
                                    <tr>
                                        <td width="44" valign="middle" style="width:44px;">
                                            <img src="{{ $creator['avatar'] }}" width="40" height="40" alt=""
                                                 style="width:40px;height:40px;border-radius:50%;
                                                        -webkit-border-radius:50%;display:block;border:0;
                                                        object-fit:cover;background-color:#FFE6F2;">
                                        </td>
                                        <td valign="middle" style="padding-left:12px;">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                                        font-size:15px;color:#1A1A1A;line-height:20px;">
                                                {{ $creator['name'] }}
                                            </div>
                                            @if (!empty($creator['username']))
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                                        color:#9A9A9A;line-height:18px;">
                                                &commat;{{ $creator['username'] }}
                                            </div>
                                            @endif
                                        </td>
                                        @if (!empty($creator['username']))
                                        <td valign="middle" align="right" style="white-space:nowrap;">
                                            <a href="{{ url('/'.$creator['username']) }}" target="_blank"
                                               style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                                      font-weight:700;color:#FF007F;text-decoration:none;">
                                                View &rsaquo;
                                            </a>
                                        </td>
                                        @endif
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif

            {{-- Primary action --}}
            <tr>
                <td align="center" style="padding:24px 0 12px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $browseUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    See what's new
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Secondary action --}}
            <tr>
                <td align="center" style="padding:0 0 22px 0;">
                    <a href="{{ $purchasesUrl }}" target="_blank"
                       style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;
                              color:#7A7A7A;text-decoration:underline;">
                        Or open everything you have already unlocked
                    </a>
                </td>
            </tr>

            {{-- Footnote: says plainly why this arrived and how to stop it. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this because you support creators on Spenny Piggy.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Turn off these reminders
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
