@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                width="119" src="https://ucarecdn.com/8df7911e-6a62-4bb4-967c-9ec0fda23c16/spennyPiggyMailLogo.png" style="border:none"></a></td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0"
            style="max-width: 296px; width: 100%; text-align: center;">
            <tr>
                <td
                    style="font-family: Arial; font-weight: bold; font-size: 18px; color:#000; line-height: 20px; padding: 0 0 25px 0; text-align: center;"
                    >
                    {{ $emailMessage }}
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
