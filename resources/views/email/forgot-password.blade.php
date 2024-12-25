@extends('email.default-2')
@section('content')
<tr>
     {{--width="100%"--}}
     {{--max-width: 296px;--}}
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table cellspacing="0" cellpadding="0" border="0"
            style="width: 100%; text-align: center;">
            <tr>
                <td style=" padding: 0 0 25px 0; text-align: center;"><img
                        src="https://ucarecdn.com/4e45b4c3-8538-496f-8873-b5fd53115c50/giftimg.png" alt="img"></td>
            </tr>
            <tr>
                <td
                    style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                    <b>Hello {{ $data['name'] ?? 'user' }}</b><br></br>
                        <span style="color:#F94F97 ">
                        <b>Click on the given below button to forgot the password</b>
                        </span>
                </td>
            </tr>
            <tr>
                <td style="line-height:30px;height:30px;"></td>
            </tr>
            <tr>
               <td>
                  <a
                          href="{{ env('APP_URL') }}/forgot-password/{{ $data['uuid'] }}"
                           style="border-radius:30px;background-color:#F94F97;color:white;border:none;padding:13px 30px 13px 30px; width: 210px;
                           text-decoration:none; border:none;background-color: #F94F97;
                            font-family: Arial; font-weight: bold; font-size:
                             15px; text-align: center; color:#ffffff; cursor: pointer;"
                          >Forgot Password</a>

               </td>
            </tr>
            <tr>
                <td style="line-height:30px;height:30px;"></td>
            </tr>
        </table>
    </td>
</tr>
@endsection

