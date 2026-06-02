@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:14px 10px 6px 10px;">
            <span style="display:none; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#ffffff;">
                Discover creators, follow favorites, and send gifts securely on Spenny Piggy.
            </span>
            <a href="{{ config('app.url') . '/' }}">
                <img width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none" alt="Spenny Piggy Logo">
            </a>
        </td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 420px; width: 100%; text-align: center;">
                <tr>
                    <td style="background-color:#FFFFFF; border-radius:16px; padding:22px 18px 18px 18px; text-align:center;">
                        <div style="font-weight:900; font-size:28px; color:#141414; line-height:34px; padding:10px 0 0 0; text-align:center;">
                            Welcome to <span style="color:#8C52FF">Spenny Piggy</span>! 🐷✨
                        </div>
                        <div style="padding:12px 0 0 0; text-align:center;">
                            <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="Gift">
                        </div>
                        <div style="padding:12px 0 0 0; font-weight:600; font-size:16px; line-height:24px; color:#4D4D4D; text-align:center;">
                            Hi <span style="color:#8C52FF; font-weight:800;">{{ ucwords($name ?? 'there') }}</span> — you’re all set to discover creators and make someone’s day with the perfect gift.
                        </div>
                        <div style="padding:18px 0 0 0; text-align:center;">
                            <a href="{{ url('/discover') }}" style="border-radius:30px; padding:13px 30px 13px 30px; text-decoration:none; border:none; background-color:#FF007F; font-weight:800; font-size:15px; text-align:center; color:#ffffff; display:inline-block;">
                                Discover Creators
                            </a>
                        </div>
                        <div style="padding:10px 0 0 0; font-weight:500; font-size:13px; line-height:20px; color:#666666; text-align:center;">
                            Looking for something specific? Try <a href="{{ url('/discover') }}" style="color:#8C52FF; text-decoration:none; font-weight:800;">search</a> or browse trending.
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="line-height:14px; height:14px;"></td>
                </tr>
                <tr>
                    <td style="background-color:#FBF0F5; border-radius:16px; padding:18px 18px 16px 18px; text-align:left;">
                        <div style="font-weight:900; font-size:16px; line-height:24px; color:#141414; padding:0 0 10px 0;">
                            Your first 3 minutes on Spenny Piggy
                        </div>
                        <div style="font-weight:500; font-size:14px; line-height:22px; color:#4D4D4D;">
                            <span style="color:#FF007F; font-weight:900;">1.</span> Follow a creator you love<br>
                            <span style="color:#FF007F; font-weight:900;">2.</span> Pick a wish that fits your budget<br>
                            <span style="color:#FF007F; font-weight:900;">3.</span> Send a gift with a message (or keep it private)
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="line-height:14px; height:14px;"></td>
                </tr>
                <tr>
                    <td style="background-color:#FFFFFF; border:1px solid #F0E6F0; border-radius:16px; padding:18px 18px 16px 18px; text-align:left;">
                        <div style="font-weight:900; font-size:16px; line-height:24px; color:#141414; padding:0 0 10px 0;">
                            Why you’ll love gifting here
                        </div>
                        <div style="font-weight:500; font-size:14px; line-height:22px; color:#4D4D4D;">
                            <span style="color:#8C52FF; font-weight:900;">✓</span> Secure checkout and privacy-first design<br>
                            <span style="color:#8C52FF; font-weight:900;">✓</span> Discover wishes, memberships and subscriptions<br>
                            <span style="color:#8C52FF; font-weight:900;">✓</span> Support creators across the world in minutes
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="line-height:14px; height:14px;"></td>
                </tr>
                <tr>
                    <td style="padding:0 6px 0 6px; text-align:center; font-weight:500; font-size:12px; line-height:18px; color:#666666;">
                        Want a quick tour? Read <a href="{{ url('/how-it-works') }}" style="color:#8C52FF; text-decoration:none; font-weight:800;">how it works</a>.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
