@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Status emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                ⚠️
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    Payment <span style="color:#8C52FF;">{{ $sub->status }}</span>
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Hello <strong style="color:#1A1A1A;">{{ ucwords($sub->guest_name) }}</strong>!<br><br>
                    Your payment for subscription of wish item <strong style="color:#8C52FF;">{{ $sub->wish_item->wishname }}</strong> is in <strong style="color:#1A1A1A;">{{ $sub->status }}</strong> status on Spenny Piggy.
                </td>
            </tr>

            {{-- <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;line-height:20px;padding:0 0 22px 0;text-align:center;">
                    <strong>Cancel :~ <a href={{ env('APP_URL') . '/cancel-subs/' . $data['uuid'] }}>
                            Click Here</a></strong>
                </td>
            </tr> --}}

        </table>
    </td>
</tr>
@endsection
