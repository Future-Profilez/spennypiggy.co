@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <a href="{{ env('APP_URL') }}">
                 <img alt="Logo" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
             </a>
         </td>
     </tr>
     <tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; text-align: center;">
                 <tr>
                     <td style=" font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                         <span style="color: #FFC107">Identity Verification In Process</span>
                     </td>
                 </tr>
                 <tr>
                     <td style="padding: 0 0 25px 0;  font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                         Hello {{ ucfirst(strtolower($user->name)) }}, <br><br>
                         Your identity verification is currently in process. We are reviewing the details you submitted.
                     </td>
                 </tr>
                 <tr>
                     <td style="padding: 0 0 25px 0;  font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                         This process may take some time. We will notify you once the verification is complete. If you have any questions, please contact our support team.
                     </td>
                 </tr>
             </table>
         </td>
     </tr>
@endsection
