@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;"><a href="https://spennypiggy.co"><img alt="image"
                    width="119" src="https://whoyouinto.com/emails/user/logo.png" style="border:none"></a></td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width: 296px; width: 100%; text-align: center;">
                <tr>
                    <td
                        style="font-family: Arial; font-weight: bold; font-size: 18px; color:#000; line-height: 26px; padding: 0 0 25px 0; text-align: center;">
                        {{ $data->user->name }} subscribed to your wish <span
                            style="color: #8C52FF">{{ $data->wish_item->wishname }}</span> on a {{ $data->wish_item->subscription_period }} basis.
                    </td>
                </tr>

                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 10px; color: #4D4D4D; text-align: center; line-height: 18px;">
                        Go to <a href="https://spennypiggy.co/">Spenny Piggy</a> to check out all your current subscribers.</td>
                </tr>

                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href="{{ env('APP_URL') . '/wish-tracker' }}"
                        style="border-radius:30px;padding: 13px 25px 13px 25px;border:none;background-color:#f94f97;font-family:Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;text-decoration: none;" >My Account.</a>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
@endsection
