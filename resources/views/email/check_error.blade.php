<!DOCTYPE html>
<html>
<head>
    <title>Error Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:20px;background:#ECECEC;font-family:'Outfit',Arial,sans-serif;">
    <table align="center" cellspacing="0" cellpadding="0" border="0" role="presentation"
        style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
            <td bgcolor="#FF007F" style="background-color:#FF007F;padding:16px 22px;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                    <tr>
                        <td align="left" valign="middle">
                            <img src="https://ucarecdn.com/1f1f8919-15f3-491d-b48e-0e3d0a251903/spenny_piggy_logo.png"
                                 width="150" alt="Spenny Piggy" style="display:block;width:150px;height:auto;border:0;">
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
            <td style="padding:28px 28px 20px;">
                <h2 style="font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:700;color:#c53030;margin:0 0 14px;">⚠ An error occurred</h2>
                <pre style="font-family:monospace;font-size:13px;color:#333333;background:#f5f5f5;padding:14px;border-radius:6px;overflow-x:auto;border:1px solid #e0e0e0;white-space:pre-wrap;word-break:break-word;">{{ $th }}</pre>
            </td>
        </tr>
        <tr>
            <td style="padding:12px 28px 20px;background:#FFF1F7;border-top:1px solid #FFCCE0;text-align:center;">
                <span style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8B4E76;">© {{ date('Y') }} SpennyPiggy — Internal Error Report</span>
            </td>
        </tr>
    </table>
</body>
</html>
