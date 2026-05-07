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
                            src="https://ucarecdn.com/2f36094e-028f-48d2-9681-ef5f1226c355/subscriptionicon.png"
                            alt="Subscription Started">
                    </td>
                </tr>

                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                        <b>Hi {{ ucwords($user->name ?? 'User') }} 👋</b><br><br>
                        <span style="color:#F94F97;">
                            <b>Your subscription has started!</b>
                        </span>
                    </td>
                </tr>

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                        Your free trial has ended, and your subscription is now active. <br>
                        We've successfully charged <b>{{ $amount }} {{ $currency }}</b> to your account on
                        <b>{{ \Carbon\Carbon::parse($paymentDate)->format('F j, Y') }}</b>.
                    </td>
                </tr>

                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td>
                        <a href="{{ env('APP_URL') }}/user/{{ $user->uuid }}"
                            style="border-radius: 30px; background-color: #F94F97; color: white; border: none; padding: 13px 30px;
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
