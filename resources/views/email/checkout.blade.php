@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Gift emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🎁
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
                    New Wish Granted!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                @if ($data->wish_item_id == null)
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    <strong style="color:#FF007F;">Lucky you!</strong><br><br>
                    @if ($data->payment->anonymous == 0)
                    <strong style="color:#1A1A1A;">{{
                        $anon == false ? ucwords($data->cart?->user?->name ?? $data->payment?->user?->name ?? 'Someone') : ucwords($anonname)
                    }}</strong> just granted you a surprise gift on Spenny Piggy for <strong style="color:#8C52FF;">{{ $symbol }}{{ number_format($data->amount, 2) }}</strong> 🎁🥳
                    @else
                    An <strong style="color:#1A1A1A;">anonymous user</strong> just granted you a surprise gift on Spenny Piggy for <strong style="color:#8C52FF;">{{ $symbol }}{{ number_format($data->amount, 2) }}</strong> 🎁🥳
                    @endif
                </td>
                @else
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    <strong style="color:#FF007F;">Lucky you!</strong><br><br>
                    @if ($data->payment->anonymous == 0)
                    <strong style="color:#1A1A1A;">{{ $anon == false ? ucwords($data->cart->user->name) : ucwords($anonname) }}</strong> just granted your wish <em>"{{ $data->wish->wishname ?? 'surprise gift' }}"</em> on Spenny Piggy for <strong style="color:#8C52FF;">{{ $symbol }}{{ number_format($data->amount, 2) }}</strong> 🎁🥳
                    @else
                    An <strong style="color:#1A1A1A;">anonymous user</strong> just granted your wish <em>"{{ $data->wish->wishname ?? 'surprise gift' }}"</em> on Spenny Piggy for <strong style="color:#8C52FF;">{{ $symbol }}{{ number_format($data->amount, 2) }}</strong> 🎁🥳
                    @endif
                </td>
                @endif
            </tr>

            @if (!empty($messages))
            {{-- Message card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 6px 0;">
                                    💬 Message
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;">
                                    {{ $messages ?? '' }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Go to <a href="https://spennypiggy.co" style="color:#8C52FF;text-decoration:none;font-weight:600;">Spenny Piggy</a> to see your granted wish, message your gifter, and share your gift. ✨
                </td>
            </tr>

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href={{ env('APP_URL') . '/history' }}
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    See your granted wish →
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
