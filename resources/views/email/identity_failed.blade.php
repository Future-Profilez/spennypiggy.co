@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') }}">
            <img alt="Logo" width="119" src="https://ucarecdn.com/8df7911e-6a62-4bb4-967c-9ec0fda23c16/spennyPiggyMailLogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; text-align: center;">
            <tr>
                <td style="font-family: Arial; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                    <span style="color: #DC3545">Identity Verification Failed</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                    Hello {{ ucfirst(strtolower($user->name)) }}, <br><br>
                    Unfortunately, your identity verification failed. Please review the details you submitted and try again.
                </td>
            </tr>
            @if(isset($user->identity_verification_error))
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 16px; line-height: 24px; color: #DC3545; text-align: left;">
                    <strong>Error Details:</strong>
                    @php
                    $error = json_decode($user->identity_verification_error, true);
                    @endphp
                    @if($error && is_array($error))
                    <ul style="padding: 0; margin: 10px 0 0 0; list-style-type: none;">
                        @if(isset($error['code']))
                        <li><strong>Code:</strong> {{ $error['code'] }}</li>
                        @endif
                        @if(isset($error['reason']))
                        <li><strong>Reason:</strong> {{ $error['reason'] }}</li>
                        @endif
                    </ul>
                    @else
                    <p>Unable to retrieve error details. Please contact support for further assistance.</p>
                    @endif
                </td>
            </tr>
            @endif
            <!-- <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: left;">
                    If you believe this is an error, contact our support team for assistance.
                </td>
            </tr> -->
        </table>
    </td>
</tr>
@endsection
