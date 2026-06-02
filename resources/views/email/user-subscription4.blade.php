@extends('email.default-2')

@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; text-align: center;">

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td style="padding: 0 0 25px 0; text-align: center;">
                        <img style="max-width: 200px;"
                            src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="Trial Icon">
                    </td>
                </tr>

                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                        <b>Welcome {{ $user->name ?? 'User' }} 🎉</b><br><br>
                        <span style="color:#FF007F;">
                            <b>Your 3-day free trial has started!</b>
                        </span>
                    </td>
                </tr>

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                        Enjoy full access to all premium features during your trial period. Your subscription will
                        automatically start on
                        <b>{{ \Carbon\Carbon::parse($nextPaymentDate)->format('F j, Y') }}</b> and you'll be charged
                        <b>£{{ $amount }}</b>.
                    </td>
                </tr>

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td>
                        <a href="{{ env('APP_URL') }}/user/{{ $user->uuid }}"
                            style="border-radius: 30px; background-color: #FF007F; color: white; border: none; padding: 13px 30px;
                        text-decoration: none; font-weight: bold; font-size: 15px; text-align: center; display: inline-block;">
                            Manage Your Subscription
                        </a>
                    </td>
                </tr>

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

            </table>
        </td>
    </tr>
@endsection
