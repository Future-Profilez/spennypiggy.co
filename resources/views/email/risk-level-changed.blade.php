<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Status Update</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #ff3366; /* Spenny Piggy Brand Color */
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .status-box {
            background-color: #f8f9fa;
            border-left: 4px solid #ff3366;
            padding: 15px;
            margin: 20px 0;
        }
        .status-box.high {
            border-color: #dc3545;
            background-color: #fff5f5;
        }
        .status-box.medium {
            border-color: #ffc107;
            background-color: #fffdf5;
        }
        .status-box.low {
            border-color: #28a745;
            background-color: #f0fff4;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .details-table th, .details-table td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        .btn {
            display: inline-block;
            background-color: #ff3366;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Spenny Piggy</h1>
        </div>
        <div class="content">
            <h2>Hello {{ $user->name }},</h2>
            
            <p>{{ $messageBody }}</p>
            
            <div class="status-box {{ $metric->risk_level }}">
                <h3>Current Account Status: {{ ucfirst($metric->risk_level) }} Risk</h3>
                <p>
                    @if($metric->risk_level === 'low')
                        Your account is in good standing. No additional reserves are being held.
                    @else
                        A temporary rolling reserve has been applied to your account to cover potential disputes or refunds.
                    @endif
                </p>
            </div>

            <table class="details-table">
                <tr>
                    <th>Reserve Rate:</th>
                    <td>{{ $metric->reserve_percent }}%</td>
                </tr>
                <tr>
                    <th>Payout Delay:</th>
                    <td>{{ $metric->payout_delay_days }} Days</td>
                </tr>
                <tr>
                    <th>Dispute Rate (30d):</th>
                    <td>{{ number_format($metric->dispute_rate_30d * 100, 1) }}%</td>
                </tr>
                <tr>
                    <th>Refund Rate (30d):</th>
                    <td>{{ number_format($metric->refund_rate_30d * 100, 1) }}%</td>
                </tr>
            </table>

            <p>
                Rolling reserves are released automatically after 90 days if no disputes occur. You can continue to accept payments normally.
            </p>
            
            <a href="{{ url('/dashboard') }}" class="btn">View Dashboard</a>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Spenny Piggy. All rights reserved.
        </div>
    </div>
</body>
</html>
