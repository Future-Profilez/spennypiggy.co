@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; text-align: center;">
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img style="max-width: 140px;"
                    src="https://ucarecdn.com/9833ac18-d610-44de-8c9a-8ca9371f15a0/thankyouimage.png" alt="img"></td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold; font-size: 22px; line-height: 30px; color:#F94F97; text-align: center;">
                        <strong style="color:#F94F97; text-transform: capitalize;">{{ $payment->payment->owner->name }}</strong> sent you<br><br>a Thank You message! ✨
                    </td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>



                @if (!empty($payment->thankyou_message))
                <tr>
                    <td
                        style="padding: 15px 20px; font-family: Arial; font-weight: normal; font-size: 16px; line-height: 24px; color:#333333; text-align: center; background-color: #f8f9fa; border-radius: 8px; margin: 10px 0;">
                        <em style="font-style: italic; color:#555;">"{{ $payment->thankyou_message }}"</em>
                    </td>
                </tr>
                @endif
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
                @if (!empty($payment->message_media))
                <tr>
                    <td>
                        <table cellpadding="0" cellspacing="0" style="max-width:280px;margin: auto;" >
                        <tbody></tbody>
                            @if ($payment->media_type == 'image')
                            <tr>
                                <img style="border-radius:20px; max-height:300px; object-fit:cover;" src="https://ucarecdn.com/{{ $payment->message_media ?? '' }}/" alt="img" />
                            </tr>
                            @endif

                            @if ($payment->media_type == 'video')
                            <tr>
                                <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold; font-size: 18px; line-height: 27px; color:#000000; text-align: center;">
                                    <strong>{{ $payment->payment->owner->name }}</strong> has attached a video message.<br><br>Click "See Message" below to view the video message.
                                </td>
                            </tr>
                            @endif
                        </table>
                    </td>
                </tr>
                @endif

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href="{{ env('APP_URL') . '/wish-tracker' }}"
                            style="padding:13px 30px; border-radius:30px; text-decoration:none; border:none; background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer; display: inline-block;">See Message</a>
                    </td>
                </tr>

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
