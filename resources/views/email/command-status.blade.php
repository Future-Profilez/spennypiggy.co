@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0"
            style="max-width: 420px; width: 100%; text-align: center;">
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
