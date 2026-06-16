@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Heart emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                💖
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
                    <strong style="color:#8C52FF;text-transform:capitalize;">{{ (isset($payment->payment) && isset($payment->payment->owner) && isset($payment->payment->owner->name)) ? ucwords($payment->payment->owner->name) : 'A creator' }}</strong>
                    sent you a Thank You message! ✨
                </td>
            </tr>

            @if (!empty($payment->thankyou_message))
            {{-- Message card --}}
            <tr>
                <td style="padding:0 0 22px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;text-align:center;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 8px 0;">💬 Message</div>
                                <em style="font-family:'Outfit',Arial,sans-serif;font-style:italic;font-size:16px;color:#1A1A1A;font-weight:500;line-height:24px;">"{{ $payment->thankyou_message }}"</em>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            @if (!empty($payment->message_media))
            <tr>
                <td align="center" style="padding:0 0 22px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:280px;margin:auto;">
                        <tbody></tbody>
                        @if ($payment->media_type == 'image')
                        <tr>
                            <td align="center">
                                <img style="border-radius:20px;max-height:300px;max-width:280px;object-fit:cover;" src="https://ucarecdn.com/{{ $payment->message_media ?? '' }}/" alt="img" />
                            </td>
                        </tr>
                        @endif

                        @if ($payment->media_type == 'video')
                        <tr>
                            <td style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;line-height:22px;color:#666666;text-align:center;">
                                <strong style="color:#1A1A1A;">{{ (isset($payment->payment) && isset($payment->payment->owner) && isset($payment->payment->owner->name)) ? ucwords($payment->payment->owner->name) : 'The creator' }}</strong> has attached a video message.<br><br>Click "See Message" below to view the video message.
                            </td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
            @endif

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') . '/history' }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    See Message →
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
