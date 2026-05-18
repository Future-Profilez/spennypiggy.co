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
                    Your <span style="color: #FF007F">Order</span> is now <br> {{ ucfirst($status) }}! 
                    @if($status === 'shipped') 🚚 @elseif($status === 'delivered') 📦 @else ⏳ @endif
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style=" padding: 0 0 25px 0; text-align: center;">
                    <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="{{ ucfirst($status) }}">
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                    @if($status === 'shipped')
                        Great news! <br>
                        {{ ucwords($creator->name) }} has shipped your shop item: <br>
                    @elseif($status === 'delivered')
                        Your item from {{ ucwords($creator->name) }} has been delivered: <br>
                    @else
                        {{ ucwords($creator->name) }} has updated the status of your shop item to {{ ucfirst($status) }}: <br>
                    @endif
                    <span style="color: #FF007F">{{ $deliverable->metadata_json->shop_item_name ?? 'Shop Item' }}</span>
                </td>
            </tr>

            @if($status === 'shipped' || $deliverable->tracking_id)
            <tr>
                <td style="padding: 10px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 12px; padding: 15px; border: 1px solid #eeeeee; text-align: left;">
                        <tr>
                            <td style="font-family: Arial; font-size: 12px; color: #888888; text-transform: uppercase; padding-bottom: 5px;">Courier</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 15px; font-weight: bold; color: #333333; padding-bottom: 10px;">{{ $deliverable->courier_name ?? 'Standard Shipping' }}</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 12px; color: #888888; text-transform: uppercase; padding-bottom: 5px;">Tracking ID</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 16px; font-weight: bold; color: #FF007F; padding-bottom: {{ $deliverable->expected_delivery_date ? '10px' : '0' }};">{{ $deliverable->tracking_id ?? 'Available soon' }}</td>
                        </tr>
                        @if($deliverable->expected_delivery_date)
                        <tr>
                            <td style="font-family: Arial; font-size: 12px; color: #888888; text-transform: uppercase; padding-bottom: 5px;">Expected Delivery Date</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 16px; font-weight: bold; color: #333333;">{{ \Carbon\Carbon::parse($deliverable->expected_delivery_date)->format('M d, Y') }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
            @endif

            @php $metaArr = is_array($deliverable->metadata) ? $deliverable->metadata : (is_string($deliverable->metadata) ? (json_decode($deliverable->metadata, true) ?? []) : []); @endphp
            @if(!empty($metaArr['creator_note']))
            <tr>
                <td style="padding: 10px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff4f8; border-radius: 12px; padding: 15px; border: 1px solid #f94f97; text-align: left;">
                        <tr>
                            <td style="font-family: Arial; font-size: 12px; color: #f94f97; text-transform: uppercase; font-weight: bold; padding-bottom: 5px;">Note from {{ ucwords($creator->name) }}</td>
                        </tr>
                        <tr>
                            <td style="font-family: Arial; font-size: 14px; font-weight: normal; color: #333333; line-height: 20px;">{{ $metaArr['creator_note'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            <tr>
                <td style="padding: 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    You can track your order status anytime in your purchases dashboard.
                </td>
            </tr>
            
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/shop?type=purchases' }}"
                        style="border-radius:30px; padding:13px 30px; width: 210px; text-decoration:none; border:none; background-color: #FF007F; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer; display: inline-block;">View My Purchases</a>
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
        </table>
    </td>
</tr>
@endsection
