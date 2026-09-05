{{--
    Standalone, no app stylesheet — this page must render for somebody who
    has never visited the site and never will again. Tokens copied from
    resources/css/theme.css (radius) by hand; keep in step if those change.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>@if($state === 'done') You're unsubscribed @elseif($state === 'invalid') Link expired @else Not found @endif · Spenny Piggy</title>
    <style>
        :root { --sp-radius-box: 24px; --sp-radius-box-sm: 16px; }
        @media (min-width: 768px) { :root { --sp-radius-box: 30px; --sp-radius-box-sm: 20px; } }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #05EFB8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #000; padding: 24px; }
        .card { background: #fff; border: 2px solid #000; border-radius: var(--sp-radius-box); max-width: 520px; width: 100%; padding: 32px 28px; }
        .eyebrow { display: inline-block; background: #FF007F; color: #000; border: 2px solid #000; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; padding: 4px 12px; margin-bottom: 18px; }
        h1 { font-size: 28px; line-height: 1.15; margin: 0 0 12px; }
        p { font-size: 16px; line-height: 1.55; margin: 0 0 12px; }
        a.btn { display: inline-block; margin-top: 8px; background: #000; color: #fff; text-decoration: none; font-weight: 700; padding: 12px 18px; border-radius: var(--sp-radius-box-sm); }
        .muted { color: #444; font-size: 14px; }
    </style>
</head>
<body>
    <main class="card">
        <span class="eyebrow">Spenny Piggy</span>
        @if($state === 'done')
            <h1>You're unsubscribed.</h1>
            <p>We won't email this address about Spenny Piggy again. Nothing else to do.</p>
            <p class="muted">Changed your mind later? You can always take a look at <a href="{{ url('/') }}">spennypiggy.co</a> — we just won't be the ones to bring it up.</p>
        @elseif($state === 'invalid')
            <h1>That link has expired.</h1>
            <p>Unsubscribe links stop working after 30 days. Reply to the email you received with the word <strong>unsubscribe</strong> and we'll take you off by hand.</p>
        @else
            <h1>We couldn't find that address.</h1>
            <p>There is nothing on our list for this link, so there is nothing to unsubscribe. If you are still receiving email from us, reply to it with <strong>unsubscribe</strong>.</p>
        @endif
        <a class="btn" href="{{ url('/') }}">Back to spennypiggy.co</a>
    </main>
</body>
</html>
