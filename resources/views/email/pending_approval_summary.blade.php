@extends('email.default-2')

@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img alt="image" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>

<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; text-align: center;">
            <tr>
                <td style="font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0;">
                    <span style="color: #8C52FF">Pending Approval Summary</span> on Spenny Piggy 🎁
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 25px 0;">
                    <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img">
                </td>
            </tr>

            <tr>
                <td style="font-size: 18px; font-weight: bold; color: #141414; text-align: center; padding: 0 0 15px 0;">
                    Hello Admin! <br><br>
                    Here's a quick summary of the items pending your approval:
                </td>
            </tr>

            <tr>
                <td style="text-align: left; padding: 0 20px;">
                    <ul style="list-style-type: none; padding-left: 0;">
                        @foreach ($pendingSummary as $entry)
                        <li style="font-size: 16px; margin-bottom: 10px;">
                            🔸 <strong>{{ $entry['label'] }}</strong>: {{ $entry['count'] }} pending
                        </li>
                        @endforeach
                    </ul>
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/login' }}" style="background-color: #8C52FF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Review Pending Items
                    </a>
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0 0 0; font-size: 14px; color: #4D4D4D; text-align: center;">
                    Thanks for keeping Spenny Piggy running smoothly!
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
