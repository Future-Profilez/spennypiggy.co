<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Founder Bonus Payout Issue</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #e91e63;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #1a202c;
            margin: 20px 0;
        }
        .alert {
            background: #fed7d7;
            border: 1px solid #feb2b2;
            color: #742a2a;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-box {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #e91e63;
            margin: 10px 0;
        }
        .steps {
            background: #e6fffa;
            border: 1px solid #81e6d9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .step-item {
            margin: 10px 0;
            padding-left: 20px;
            position: relative;
        }
        .step-item::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #319795;
            font-weight: bold;
        }
        .cta {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: #e91e63;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 5px;
        }
        .button-secondary {
            background: #4a5568;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SpennyPiggy</div>
            <h1 class="title">Founder Bonus Payout Issue</h1>
        </div>

        <div class="alert">
            <strong>⚠️ Action Required:</strong> We encountered an issue processing your founder bonus payout.
        </div>

        <p>Hi {{ ucwords($creator->name) }},</p>

        <p>We attempted to process your founder bonus payout but encountered an issue with the payment. Don't worry - your bonus is still secure and we'll help you resolve this quickly.</p>

        <div class="info-box">
            <h3>Payout Details</h3>
            <p><strong>Bonus Period:</strong> {{ $founderBonus->bonus_month->format('F Y') }}</p>
            <p><strong>Bonus Amount:</strong> <span class="amount">£{{ $founderBonus->getFormattedBonusAmount() }}</span></p>
            <p><strong>Status:</strong> Payment Rejected</p>
        </div>

        <div class="steps">
            <h3>🔧 Next Steps to Resolve</h3>
            <div class="step-item">Check your Stripe account for any issues or required verifications</div>
            <div class="step-item">Ensure your bank account details are up to date</div>
            <div class="step-item">Verify that your account is in good standing</div>
            <div class="step-item">Contact our support team if you need assistance</div>
        </div>

        <p><strong>Common reasons for payout issues:</strong></p>
        <ul>
            <li>Incomplete Stripe account verification</li>
            <li>Outdated bank account information</li>
            <li>Account restrictions or holds</li>
            <li>Insufficient account balance for fees</li>
        </ul>

        <div class="cta">
            <a href="{{ config('app.url') }}/founder/bonus" class="button">View Founder Dashboard</a>
            <a href="mailto:support@spennypiggy.co?subject=Founder Bonus Payout Issue - {{ ucwords($creator->name) }}" class="button button-secondary">Contact Support</a>
        </div>

        <p>Once you've resolved the issue, we'll automatically retry the payout during our next processing cycle (7th of each month). If you need immediate assistance, please don't hesitate to reach out to our support team.</p>

        <p>Thank you for your patience, and congratulations again on being a SpennyPiggy Founder!</p>

        <div class="footer">
            <p>Best regards,<br>The SpennyPiggy Team</p>
            <p>Questions? Reply to this email or contact us at support@spennypiggy.co</p>
        </div>
    </div>
</body>
</html>