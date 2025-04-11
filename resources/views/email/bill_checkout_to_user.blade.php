@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; width: 100%; text-align: center;">
                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img src="https://ucarecdn.com/4e45b4c3-8538-496f-8873-b5fd53115c50/giftimg.png" alt="img"></td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        <span style="color:#F94F97 ">
                            Thank you for granting {{ $user_name }}'s bill ({{$bill_pay->bill->name}}) of {{ $amountWithCurr }} on Spenny Piggy 🐷🎁
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                        Go to <a href="{{ env('APP_URL') . '/wish-tracker' }}">Spenny Piggy</a>  and discover more creators bills to fulfil! Check out their profile Intros, memberships and more! </td>
                    </tr>
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href={{ env('APP_URL') . '/wish-tracker' }}
                            style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Send more surprises</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
