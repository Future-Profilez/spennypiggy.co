@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:40px 10px 40px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; text-align: center;">
                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-family: Arial; font-weight: normal; font-size: 15px; color: #666666; text-align: center; line-height: 18px;">
                        Hey {{ $name ?? 'user' }}</td>
                </tr>
                <tr> 
                    <td
                        style="padding: 0 0 10px 0; font-family: Arial; font-weight: bold; font-size: 22px; color: #0D0D0D; text-align: center; line-height: 25px;">
                        Welcome to spenny piggy</td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 10px 0; font-family: Arial; font-weight: bold; font-size: 22px; color: #0D0D0D; text-align: center; line-height: 25px;">
                        Your wishlist added successfully </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
