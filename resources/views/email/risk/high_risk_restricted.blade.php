<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Required: Account Restricted</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #dc3545; color: #ffffff; padding: 20px; text-align: center; } /* RED Header */
        .content { padding: 30px; }
        .alert-box { background-color: #fff5f5; border: 1px solid #dc3545; color: #dc3545; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777; }
        .btn { display: inline-block; background-color: #dc3545; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Action Required</h1>
        </div>
        <div class="content">
            <h2>Hello {{ $user->name }},</h2>
            <p>We have detected unusual activity on your account, specifically a high rate of disputes ({{ number_format($metric->dispute_rate_30d * 100, 1) }}%).</p>
            
            <div class="alert-box">
                <strong>Account Status: High Risk</strong><br>
                A {{ $metric->reserve_percent }}% rolling reserve has been applied to all new incoming payments. Payouts are now delayed by {{ $metric->payout_delay_days }} days.
            </div>

            <p>To restore your account standing, please resolve outstanding disputes and ensure future transactions are legitimate.</p>
            
            <a href="{{ url('/dashboard') }}" class="btn">View Dashboard</a>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Spenny Piggy. All rights reserved.
        </div>
    </div>
</body>
</html>
