@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img alt="Spenny Piggy" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; width: 100%; text-align: center;">
            <tr>
                <td style="font-family:Arial;font-weight:bold;font-size: 21px;color:#000;line-height: 26px;padding:0 0 25px 0;text-align:center">
                    Action Required: <span style="color: #F94F97">Pending Order</span> ⏳
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style=" padding: 0 0 25px 0; text-align: center;">
                    <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="Pending Order">
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                    Hi {{ $creator->name }}, <br>
                    You have a pending physical shop order waiting for fulfillment.
                </td>
            </tr>

            <tr>
                <td style="padding: 10px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 12px; padding: 15px; border: 1px solid #eeeeee; text-align: left;">
                        <tr>
                            <td style="font-family: Arial; font-size: 12px; color: #888888; text-transform: uppercase; padding-bottom: 5px;">Item Name</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 15px; font-weight: bold; color: #333333; padding-bottom: 10px;">{{ $deliverable->metadata['shop_item_name'] ?? 'Shop Item' }}</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 12px; color: #888888; text-transform: uppercase; padding-bottom: 5px;">Order Date</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 14px; font-weight: bold; color: #F94F97;">{{ $payment->created_at->format('M d, Y') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    It has been more than 2 days since this order was placed. Please update the shipping status for your gifter to keep them informed!
                </td>
            </tr>
            
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/shop' }}"
                        style="border-radius:30px; padding:13px 30px; width: 210px; text-decoration:none; border:none; background-color: #F94F97; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer; display: inline-block;">View My Shop Orders</a>
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
        </table>
    </td>
</tr>
@endsection
