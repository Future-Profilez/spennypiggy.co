{{--
    The maintenance wall.

    Deliberately a standalone Blade page, NOT an Inertia render: Inertia needs the
    Vite manifest and HandleInertiaRequests' shared props, and those props query
    users, journey state and subscriptions. This page has to work when the app is
    half-deployed, mid-migration, or when the database is exactly what is being
    worked on — so it depends on nothing built. All CSS is inline and the only
    JavaScript is the countdown.

    🚨 The two brand faces are INLINED as data: URIs, not fetched. `vapor.yml`
    uploads only `public/build/**` to the asset host, so a `/fonts/…` URL 404s in
    production while working perfectly on every developer's machine — and the built
    copies are content-hashed, so reading the Vite manifest would break the wall on
    exactly the deploy that raised it. See MaintenanceMode::fontCss().

    Everything interpolated is escaped: `message` is admin-authored free text on an
    unauthenticated page, which is stored XSS the moment it is rendered raw.
--}}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <title>Back soon — Spenny Piggy</title>
    <link rel="icon" href="/favicon.ico">
    <style>
        {{-- Brand faces, inlined as data: URIs — see MaintenanceMode::fontCss().
             Unescaped because it is CSS this application generates from its own
             font files; nothing here comes from a request or from an admin. --}}
        {!! \App\Support\MaintenanceMode::fontCss() !!}

        :root {
            --black: #000;
            --white: #fff;
            --pink: #FF007F;
            --mint: #05EFB8;
            --violet: #8C52FF;
            --muted: rgba(255, 255, 255, .64);
            /* ⚠️ The house radii, copied. This page is standalone Blade — it must
               render when the app is half-deployed or mid-migration, so it cannot
               load resources/css/theme.css and carries its own copy. Keep in step. */
            --sp-radius-box: 24px;
            --sp-radius-box-sm: 16px;
        }

        @media (min-width: 768px) {
            :root {
                --sp-radius-box: 30px;
                --sp-radius-box-sm: 20px;
            }
        }

        * { box-sizing: border-box; }

        html, body {
            margin: 0;
            padding: 0;
            background: var(--black);
            color: var(--white);
            font-family: 'CeraGR', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }

        .page {
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 28px 0 calc(28px + env(safe-area-inset-bottom));
        }

        .inner {
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
            padding: 0 20px;
            text-align: center;
        }

        /* ---------------------------------------------------------- eyebrow -- */

        .eyebrow {
            display: inline-block;
            background: var(--pink);
            color: var(--white);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .16em;
            text-transform: uppercase;
            border-radius: 999px;
            padding: 9px 20px;
        }

        /* ------------------------------------------------------------- type -- */

        h1 {
            font-family: 'gulfs', sans-serif;
            /* `gulfs` is a heavy display face — it carries at a far smaller size
               than a normal sans would, and at 84px it stopped reading as a
               headline and became a wall of its own. */
            font-size: clamp(30px, 6.2vw, 52px);
            line-height: .96;
            text-transform: uppercase;
            letter-spacing: .005em;
            font-weight: 400;
            margin: 18px 0 0;

            background-image: linear-gradient(135deg, #FF4DA6 0%, #FF007F 52%, #D1006A 100%);
            background-clip: text;
            -webkit-background-clip: text;
            display: inline-block;
        }

        @supports (-webkit-background-clip: text) {
            h1 { color: transparent; -webkit-text-fill-color: transparent; }
        }

        @supports not (-webkit-background-clip: text) {
            h1 { color: var(--pink); }
        }

        p.msg {
            font-size: 17px;
            line-height: 1.6;
            color: var(--muted);
            margin: 16px auto 0;
            max-width: 44ch;
            white-space: pre-line;
        }

        /* ----------------------------------------------------------- marquee --
           The site's own device, reused here. It carries the RETURN TIME rather
           than a decorative word, so the loudest element on the page is also the
           one piece of information a visitor came for.

           Tilted, so it bleeds wider than the viewport — a rotation on a
           full-width band leaves bare wedges in the corners.

           ⚠️ The angle is small and stays small. Tilt reads as a proportion of
           the run, not as degrees: at -1.5deg across a 1408px band the ends are
           37px apart and it stops being a band and becomes a diagonal wipe across
           an otherwise empty black page. The homepage gets away with more because
           its bands sit between dense sections. */

        .band {
            position: relative;
            margin: 30px 0;
            width: 110%;
            margin-left: -5%;
            transform: rotate(-0.8deg);
            background: var(--mint);
            border-top: 2px solid var(--black);
            border-bottom: 2px solid var(--black);
            overflow: hidden;
        }

        .band-track {
            display: flex;
            width: max-content;
            animation: marquee 26s linear infinite;
        }

        /* ⚠️ Each half must OVERFLOW the viewport on its own. With one phrase per
           half the band was mostly empty mint and the loop read as a single word
           drifting past, not a marquee. */
        .band-track span {
            font-family: 'gulfs', sans-serif;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: .22em;
            color: var(--black);
            padding: 14px 0;
            white-space: nowrap;
        }

        @keyframes marquee {
            from { transform: translateX(0); }
            /* Two identical halves, so shifting by exactly one is seamless. */
            to   { transform: translateX(-50%); }
        }

        /* --------------------------------------------------------- countdown --
           White cards with a black rule and a coloured offset shadow — the house
           card, at the one moment on this page that deserves the boldest
           treatment. One colour each, cycling the brand three. */

        .units {
            display: flex;
            gap: 14px;
            justify-content: center;
        }

        .unit {
            background: var(--white);
            border: 2px solid var(--black);
            border-radius: var(--sp-radius-box-sm);
            padding: 13px 10px 10px;
            min-width: 96px;
        }

        /* 🚨 No shadows (client direction, 14 Aug 2026) — the offset that used to
           be this page's signature is now an accent BORDER, one per unit, which
           is the same three-colour idea carried by line work instead. */
        .unit:nth-child(1) { border-color: var(--pink); }
        .unit:nth-child(2) { border-color: var(--mint); }
        .unit:nth-child(3) { border-color: var(--violet); }

        .unit .n {
            font-family: 'gulfs', sans-serif;
            font-size: 34px;
            line-height: 1;
            color: var(--black);
            font-variant-numeric: tabular-nums;
        }

        .unit .u {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: .16em;
            text-transform: uppercase;
            color: rgba(0, 0, 0, .5);
            margin-top: 9px;
        }

        /* ------------------------------------------------------------- foot -- */

        .safe {
            margin-top: 22px;
            font-size: 15px;
            color: var(--muted);
        }

        .cta {
            display: inline-block;
            margin-top: 16px;
            background: var(--pink);
            color: var(--white);
            text-decoration: none;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: .06em;
            border-radius: 999px;
            padding: 14px 26px;
            min-height: 44px;
        }

        .cta:hover { background: #E23F85; }

        .cta:focus-visible,
        a:focus-visible {
            outline: 3px solid var(--mint);
            outline-offset: 3px;
        }

        @media (max-width: 400px) {
            .unit { min-width: 0; flex: 1; padding: 14px 4px 10px; }
            .unit .n { font-size: 28px; }
            .units { gap: 10px; }
        }

        /* A wall nobody can read without scrolling is a wall that failed. On a
           short laptop viewport the rhythm compresses instead. */
        @media (max-height: 720px) {
            .page { padding: 18px 0; }
            .band { margin: 20px 0; }
            h1 { font-size: clamp(28px, 5vw, 42px); }
            p.msg { font-size: 15.5px; margin-top: 12px; }
            .safe { margin-top: 16px; font-size: 14px; }
            .cta { margin-top: 12px; }
            .unit { padding: 11px 10px 9px; }
            .unit .n { font-size: 30px; }
        }

        @media (prefers-reduced-motion: reduce) {
            .band-track { animation: none; justify-content: center; width: 100%; }
            /* One copy is enough when it is not moving — the second would read as
               a stutter. */
            .band-track > span:nth-child(n+2) { display: none; }
        }
    </style>
</head>

<body>
    <div class="page">
        <div class="inner">
            <span class="eyebrow">Offline for maintenance</span>
            <h1>{{ $headline ?: 'Back in a moment' }}</h1>

            @if ($message)
                <p class="msg">{{ $message }}</p>
            @else
                <p class="msg">We are making some changes behind the scenes. Everything you have bought or earned is exactly where you left it.</p>
            @endif
        </div>

        {{-- The band states the return time, so the decoration is also the answer.
             Its text is set server-side to something honest and replaced by the
             local time once JavaScript can format one. --}}
        <div class="band" aria-hidden="true">
            {{-- Two identical halves; the keyframe shifts by exactly one, so the
                 loop is seamless. Each half repeats the phrase enough times to
                 overflow the widest viewport. --}}
            <div class="band-track">
                <span class="band-text">{{ str_repeat(($endsAt ? 'Back soon' : 'Back shortly').'   •   ', 12) }}</span>
                <span class="band-text">{{ str_repeat(($endsAt ? 'Back soon' : 'Back shortly').'   •   ', 12) }}</span>
            </div>
        </div>

        <div class="inner">
            @if ($endsAt)
                {{-- The countdown is computed in the BROWSER from an ISO instant.
                     Rendering "2h 14m" server-side would freeze the moment any
                     layer caches the page, and would be wrong for every viewer
                     after the first. --}}
                <div class="units" id="timer" role="timer" aria-label="Time until the site is back online" hidden>
                    <div class="unit"><div class="n" id="h">00</div><div class="u">Hours</div></div>
                    <div class="unit"><div class="n" id="m">00</div><div class="u">Minutes</div></div>
                    <div class="unit"><div class="n" id="s">00</div><div class="u">Seconds</div></div>
                </div>
            @endif

            <p class="safe">Payments already in progress will finish normally.</p>

            <a class="cta" href="mailto:support@spennypiggy.co">Email support</a>
        </div>
    </div>

    @if ($endsAt)
        {{-- ⚠️ Nonced, like every other inline block in this app: the CSP carries no
             'unsafe-inline', so without it the countdown is refused and the wall shows a
             timer that never moves. `$cspNonce` is shared by SecurityHeaders, which runs
             on the `web` group this 503 is rendered inside. --}}
        <script nonce="{{ $cspNonce ?? '' }}">
            (function () {
                var target = new Date(@json($endsAt)).getTime();
                if (isNaN(target)) return;

                var box = document.getElementById('timer');
                var h = document.getElementById('h');
                var m = document.getElementById('m');
                var s = document.getElementById('s');

                /* The band repeats the return time in the viewer's own timezone —
                   an instant printed server-side would be wrong for most of them. */
                try {
                    var at = new Date(target).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    var phrase = 'Back at ' + at + '   •   ';
                    var texts = document.querySelectorAll('.band-text');

                    for (var i = 0; i < texts.length; i++) {
                        /* ⚠️ Repeat until the half is WIDER than the band, or this
                           replacement shrinks a filled marquee back to a single
                           phrase drifting across empty mint. Measured rather than
                           guessed — the phrase length changes with the locale's
                           time format and with the viewport. */
                        var band = texts[i].closest('.band').getBoundingClientRect().width;
                        var filled = phrase;

                        texts[i].textContent = filled;

                        while (texts[i].getBoundingClientRect().width < band && filled.length < 3000) {
                            filled += phrase;
                            texts[i].textContent = filled;
                        }
                    }
                } catch (e) { /* locale data missing — the served text still reads. */ }

                var pad = function (n) { return String(n).padStart(2, '0'); };
                var reloaded = false;

                function tick() {
                    var left = target - Date.now();

                    if (left <= 0) {
                        h.textContent = m.textContent = s.textContent = '00';

                        /* Come back on our own rather than leaving someone staring
                           at a wall that has already been lifted. Once only — a
                           reload loop against a site still down is a small DDoS. */
                        if (!reloaded) {
                            reloaded = true;
                            setTimeout(function () { location.reload(); }, 20000);
                        }

                        return;
                    }

                    var t = Math.floor(left / 1000);
                    h.textContent = pad(Math.floor(t / 3600));
                    m.textContent = pad(Math.floor((t % 3600) / 60));
                    s.textContent = pad(t % 60);
                }

                box.hidden = false;
                tick();
                setInterval(tick, 1000);
            })();
        </script>
    @endif
</body>

</html>
