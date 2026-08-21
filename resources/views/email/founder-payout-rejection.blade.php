<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>Founder Bonus Payout Issue</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #333333;
            padding: 20px;
            background-color: #ECECEC;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .alert {
            background: #fed7d7; border: 1px solid #feb2b2; color: #742a2a;
            padding: 16px 20px; border-radius: 8px; margin: 20px 0;
            font-family: 'Outfit', Arial, sans-serif; font-size: 15px;
        }
        .info-box {
            background: #f7fafc; padding: 20px; border-radius: 10px;
            margin: 20px 0; border: 1px solid #e2e8f0;
        }
        .info-box h3 { font-family: 'Outfit', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #1a202c; margin-bottom: 12px; }
        .info-box p { font-family: 'Outfit', Arial, sans-serif; font-size: 15px; color: #4a5568; margin-bottom: 6px; }
        .amount { font-size: 22px; font-weight: 700; color: #FF007F; }
        .steps { background: #e6fffa; border: 1px solid #81e6d9; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .steps h3 { font-family: 'Outfit', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #2c7a7b; margin-bottom: 12px; }
        .step-item { font-family: 'Outfit', Arial, sans-serif; font-size: 14px; color: #2d3748; margin: 8px 0; padding-left: 18px; position: relative; line-height: 1.5; }
        .step-item::before { content: "→"; position: absolute; left: 0; color: #319795; font-weight: 700; }
        @media (max-width: 600px) { body { padding: 10px; } }
        @media (prefers-color-scheme: dark) {
            .email-footer { background-color: #3a1a2e !important; color: #e8a8cc !important; }
        }
    </style>
</head>
<body>
<table align="center" cellspacing="0" cellpadding="0" border="0" role="presentation"
    style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <tr>
        <td bgcolor="#FF007F"
            style="background-color:#FF007F;padding:16px 22px;border-radius:16px 16px 0 0;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                <tr>
                    <td align="left" valign="middle">
                        <img src="https://ucarecdn.com/1f1f8919-15f3-491d-b48e-0e3d0a251903/spenny_piggy_logo.png"
                             width="150" alt="Spenny Piggy"
                             style="display:block;width:150px;height:auto;border:0;">
                    </td>
                    <td align="right" valign="middle">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="right">
                            <tr>
                                <td width="12" height="12" bgcolor="#FF5F56" style="width:12px;height:12px;background-color:#FF5F56;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                                <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>
                                <td width="12" height="12" bgcolor="#FFBD2E" style="width:12px;height:12px;background-color:#FFBD2E;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                                <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>
                                <td width="12" height="12" bgcolor="#27C93F" style="width:12px;height:12px;background-color:#27C93F;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:36px 36px 8px 36px;">
            <h1 style="font-family:'Outfit',Arial,sans-serif;font-size:22px;font-weight:700;color:#1a202c;margin:0 0 20px 0;line-height:1.3;">
                Founder Bonus Payout Issue
            </h1>

            <div class="alert">
                <strong>⚠️ Action Required:</strong> We encountered an issue processing your founder bonus payout.
            </div>

            <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4a5568;margin:0 0 16px;line-height:1.7;">
                Hi {{ ucwords($creator->name) }},
            </p>

            <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4a5568;margin:0 0 20px;line-height:1.7;">
                We attempted to process your founder bonus payout but encountered an issue with the payment. Don't worry - your bonus is still secure and we'll help you resolve this quickly.
            </p>

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

            <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#2d3748;margin:20px 0 10px;font-weight:600;">
                Common reasons for payout issues:
            </p>
            <ul style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4a5568;padding-left:20px;margin:0 0 24px;">
                <li style="margin-bottom:6px;">Incomplete Stripe account verification</li>
                <li style="margin-bottom:6px;">Outdated bank account information</li>
                <li style="margin-bottom:6px;">Account restrictions or holds</li>
                <li style="margin-bottom:6px;">Insufficient account balance for fees</li>
            </ul>
        </td>
    </tr>

    <tr>
        <td align="center" style="padding:0 36px 24px 36px;">
            <table cellspacing="0" cellpadding="0" border="0" role="presentation">
                <tr>
                    <td align="center" bgcolor="#FF007F"
                        style="background-color:#FF007F;border-radius:50px;-webkit-border-radius:50px;">
                        <a href="{{ config('app.url') }}/founder/bonus"
                           style="display:inline-block;background-color:#FF007F;color:#ffffff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:50px;-webkit-border-radius:50px;">
                            View Founder Dashboard
                        </a>
                    </td>
                    <td width="12">&nbsp;</td>
                    <td align="center" bgcolor="#4a5568"
                        style="background-color:#4a5568;border-radius:50px;-webkit-border-radius:50px;">
                        <a href="mailto:support@spennypiggy.co?subject=Founder Bonus Payout Issue - {{ ucwords($creator->name) }}"
                           style="display:inline-block;background-color:#4a5568;color:#ffffff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:50px;-webkit-border-radius:50px;">
                            Contact Support
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:0 36px 36px 36px;">
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4a5568;margin:0 0 16px;line-height:1.7;">
                Once you've resolved the issue, we'll automatically retry the payout during our next processing cycle (7th of each month). If you need immediate assistance, please don't hesitate to reach out to our support team.
            </p>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4a5568;margin:0;line-height:1.7;">
                Thank you for your patience, and congratulations again on being a SpennyPiggy Founder!
            </p>
        </td>
    </tr>

    <tr>
        <td class="email-footer" align="center" bgcolor="#FFF1F7"
            style="background-color:#FFF1F7;padding:20px 24px 22px 24px;border-top:1px solid #FFCCE0;border-radius:0 0 16px 16px;">
            <table align="center" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin-bottom:12px;">
                <tr>
                    <td style="padding:0 4px;">
                        <a href="https://x.com/spennypiggy" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/twitterx--v1.png" width="24" height="24" alt="X" style="display:block;border:0;">
                        </a>
                    </td>
                    <td style="padding:0 4px;">
                        <a href="https://www.instagram.com/spennypiggy" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/instagram-new.png" width="24" height="24" alt="Instagram" style="display:block;border:0;">
                        </a>
                    </td>
                    <td style="padding:0 4px;">
                        <a href="https://m.youtube.com/channel/UCC1GASMLYEjW46dHuKZZMZQ" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/youtube-play.png" width="24" height="24" alt="YouTube" style="display:block;border:0;">
                        </a>
                    </td>
                    <td style="padding:0 4px;">
                        <a href="https://www.tiktok.com/@spennypiggy" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/tiktok--v1.png" width="24" height="24" alt="TikTok" style="display:block;border:0;">
                        </a>
                    </td>
                </tr>
            </table>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8B4E76;margin:0 0 6px;line-height:1.8;">
                <a href="{{ config('app.url') }}/email-preferences" style="color:#FF007F;text-decoration:none;font-weight:700;">Manage preferences</a>
                <span style="color:#8B4E76;">&nbsp;·&nbsp;</span>
                <a href="mailto:support@spennypiggy.co" style="color:#8B4E76;text-decoration:none;">Get Help</a>
            </p>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8B4E76;margin:0;line-height:1.7;">
                You're receiving this email because you're a valued member of the Spenny Piggy community.<br>
                © {{ date('Y') }} SpennyPiggy. All rights reserved.
            </p>
        </td>
    </tr>

</table>
</body>
</html>