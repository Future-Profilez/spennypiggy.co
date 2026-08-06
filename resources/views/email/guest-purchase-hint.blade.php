{{--
    "Bought without an account? Here is how to find this again."

    Guest checkout is allowed on Piggy Pot, Wishes and the Piggy Bank, so this receipt is
    frequently the ONLY record a supporter holds — they cannot sign in, because there is
    nothing to sign in to. Losing this email used to mean losing the content, and every
    one of those became a support ticket.

    ⚠️ Renders for a GUEST only. An account holder has `/my-purchases`, and telling them
    they have no account is worse than saying nothing.

    ⚠️ `config('app.url')`, never `env()` — env() returns null once Vapor caches config on
    deploy, and the link silently becomes a bare path.

    Usage: @include('email.guest-purchase-hint', ['isGuest' => ! $pay->user_id])
--}}
@if (! empty($isGuest))
<tr>
    <td align="center" style="padding:4px 28px 28px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">
            <tr>
                <td style="padding:16px 18px;background-color:#F6F6F6;border-radius:14px;
                           font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#555555;">
                    <strong style="color:#111111;">Bought without an account?</strong><br>
                    You can find this purchase and your content again at any time —
                    <a href="{{ rtrim(config('app.url'), '/') }}/find-my-purchase"
                       style="color:#FF007F;font-weight:bold;text-decoration:underline;">
                        find my purchase
                    </a>. Enter this email address and we will send you a link.
                </td>
            </tr>
        </table>
    </td>
</tr>
@endif
