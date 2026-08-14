<?php

namespace App\Http\Controllers;

use App\SeoMeta;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Brand assets handed to the team and to partners — currently the email
 * signatures.
 *
 * The signature markup is NOT authored in this file and must not be. It lives
 * as plain .html under resources/views/brand/signatures/ and is read verbatim,
 * because the whole point of the page is that what it hands over is byte for
 * byte what a mail client receives. Rebuilding it as JSX, or as Blade, would
 * put a second copy in play that can drift from the one that was tested.
 *
 * ⚠️ .html, deliberately NOT .blade.php. A signature contains addresses like
 * jack@spennypiggy.co, and Blade reads a leading @word as a directive — the
 * compiler chokes on @spennypiggy.
 */
class BrandAssetController extends Controller
{
    /**
     * Every signature design, in the order they are shown.
     *
     * `recommended` is the one that was signed off; the rest stay on the page
     * so whoever is installing can pick, which is why the copy is written for
     * a reader choosing rather than for a designer presenting.
     */
    private const VARIANTS = [
        [
            'key' => 'v1-card',
            'name' => 'Night card',
            'note' => 'Black card, contacts on the right, a coloured band and the company line underneath. The most presence, and the biggest footprint on a long thread.',
            'recommended' => true,
        ],
        [
            'key' => 'v5-daylight',
            'name' => 'Daylight',
            'note' => 'White, and built so a dark-mode inbox cannot spoil it. The one to use if you would rather not send a black block.',
            'recommended' => false,
        ],
        [
            'key' => 'v2-brutalist',
            'name' => 'Hard shadow',
            'note' => 'White card, black frame, solid offset shadow — the device the website itself uses. The most obviously Spenny Piggy of the set.',
            'recommended' => false,
        ],
        [
            'key' => 'v4-band',
            'name' => 'Band',
            'note' => 'A colour band above a black section. Reads as brand at a glance without the full card behind it.',
            'recommended' => false,
        ],
        [
            'key' => 'v3-minimal',
            'name' => 'Quiet rule',
            'note' => 'Compact, one accent, no coloured blocks. This is the one that survives a twenty-message thread without becoming noise.',
            'recommended' => false,
        ],
    ];

    /** Who each file belongs to. */
    private const OWNERS = [
        'jack' => ['owner' => 'Jack Smith', 'role' => 'Founder & CEO', 'address' => 'jack@spennypiggy.co'],
        'support' => ['owner' => 'Support team', 'role' => 'Here to help', 'address' => 'support@spennypiggy.co'],
    ];

    public function emailSignatures()
    {
        // Belt and braces with StaticPageSeoMiddleware's 'brand/' prefix: this is
        // an internal handover page, and that list is shared with a dozen other
        // screens rather than owned by this one.
        //
        // ⚠️ SeoMeta has no setTitle/setDescription — the title comes from the
        // page's own Inertia <Head>, and a noindex page has no use for a
        // description. Calling methods it does not have 500s the route.
        SeoMeta::setRobots('noindex,nofollow');

        return Inertia::render('Brand/EmailSignatures', [
            'variants' => $this->variants(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function variants(): array
    {
        $resolved = [];

        foreach (self::VARIANTS as $variant) {
            $signatures = [];

            foreach (self::OWNERS as $who => $owner) {
                $markup = $this->markup("{$who}-{$variant['key']}.html");

                if ($markup === null) {
                    continue;
                }

                $signatures[] = $owner + ['key' => $who, 'markup' => $markup];
            }

            // A variant whose files are both unreadable has nothing to show.
            // Dropping it beats rendering an empty heading.
            if ($signatures !== []) {
                $resolved[] = $variant + ['signatures' => $signatures];
            }
        }

        return $resolved;
    }

    /**
     * One unreadable file must not take the whole page down — every other
     * signature on it is still worth handing over.
     */
    private function markup(string $file): ?string
    {
        $path = resource_path('views/brand/signatures/'.$file);

        if (! is_file($path)) {
            Log::warning('Brand signature file missing', ['path' => $path]);

            return null;
        }

        $markup = file_get_contents($path);

        if ($markup === false) {
            Log::warning('Brand signature file unreadable', ['path' => $path]);

            return null;
        }

        // Every comment in these files is a note for whoever maintains them, and
        // they would otherwise ride along into the clipboard and into someone's
        // mail settings. Stripping them also buys ~500 characters of headroom
        // under Gmail's 10,000-character signature cap.
        //
        // ⚠️ Safe only because none of these carry an Outlook conditional
        // comment (`<!--[if mso]>`), which IS markup — check before adding one.
        return trim(preg_replace('/<!--.*?-->/s', '', $markup));
    }
}
