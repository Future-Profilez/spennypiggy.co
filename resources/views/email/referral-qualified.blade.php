@extends('email.default-2')

@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px;">
        <a href="{{ config('app.url') }}">
            <img width="119"
                src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png"
                alt="Spenny Piggy">
        </a>
    </td>
</tr>

<tr>
    <td align="center" style="padding:10px;">
        <table width="100%" style="max-width:420px;text-align:center;">
            <tr>
                <td style="font-size:22px;font-weight:bold;color:#000;">
                    🎉 Referral Reward Unlocked!
                </td>
            </tr>

            <tr>
                <td height="15"></td>
            </tr>

            <tr>
                <td style="font-size:15px;color:#4D4D4D;line-height:22px;">
                    Great news! One of your referrals has successfully crossed
                    <strong>£1,000 GMV</strong>.
                </td>
            </tr>

            <tr>
                <td height="10"></td>
            </tr>

            <tr>
                <td style="font-size:16px;font-weight:bold;color:#141414;">
                    Total Qualified GMV: £{{ $amount }}
                </td>
            </tr>

            <tr>
                <td height="15"></td>
            </tr>

            <tr>
                <td style="font-size:14px;color:#4D4D4D;">
                    Your referral reward has been transferred to your wallet.
                    You can redeem it anytime from your dashboard.
                </td>
            </tr>

            <tr>
                <td height="25"></td>
            </tr>

            <tr>
                <td>
                    <a href="{{ $redeemUrl }}"
                        style="display:inline-block;
                              padding:14px 30px;
                              background:#F94F97;
                              color:#fff;
                              font-weight:bold;
                              border-radius:30px;
                              text-decoration:none;">
                        Go to Wallet
                    </a>
                </td>
            </tr>

            <tr>
                <td height="20"></td>
            </tr>
        </table>
    </td>
</tr>
@endsection