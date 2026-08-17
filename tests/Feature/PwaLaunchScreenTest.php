<?php

namespace Tests\Feature;

use App\Support\PwaSplash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PwaLaunchScreenTest extends TestCase
{
    // ⚠️ These routes serve a static file and touch no model, but they sit in the
    // `web` group, whose shared Inertia props read the `currencies` table — so
    // without a migrated database every one of them answers 500, including the
    // cases asserting a 404.
    use RefreshDatabase;

    /**
     * 🚨 iOS ignores a startup image whose file is not the exact device pixel
     * size — it does not scale it and it does not fall back. A declared device
     * with no artwork behind it is therefore a device that launches to a blank
     * screen, silently, which is the state this whole feature replaced.
     */
    public function test_every_declared_device_has_artwork_at_its_exact_size(): void
    {
        foreach (PwaSplash::LAUNCH_IMAGES as $device) {
            $file = PwaSplash::fileFor($device);
            $path = resource_path('proxy/splash/'.$file.'.png');

            $this->assertFileExists($path, "Missing launch image for {$file}");

            [$width, $height] = getimagesize($path);
            $this->assertSame($device['w'] * $device['dpr'], $width, "Wrong width for {$file}");
            $this->assertSame($device['h'] * $device['dpr'], $height, "Wrong height for {$file}");
        }
    }

    public function test_launch_image_is_served_by_route(): void
    {
        $file = PwaSplash::fileFor(PwaSplash::LAUNCH_IMAGES[0]);

        $this->get('/ios-splash/'.$file.'.png')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');
    }

    /**
     * ⚠️ The basename becomes a filesystem path. The route resolves it against
     * the known set rather than trusting the URL, so a size we do not publish is
     * a 404 even if some other PNG happens to sit in that directory.
     */
    public function test_an_unpublished_size_is_refused(): void
    {
        $this->assertFalse(PwaSplash::knows('9999x9999'));

        $this->get('/ios-splash/9999x9999.png')->assertNotFound();
    }

    public function test_a_traversal_attempt_never_reaches_the_filesystem(): void
    {
        $this->get('/ios-splash/..%2F..%2Fproxy%2Fmanifest.json.png')->assertNotFound();
        $this->get('/ios-splash/manifest.png')->assertNotFound();
    }

    /**
     * 🚨 `/apple-touch-icon.png` answered 404 in production while every sibling
     * icon resolved, because a file under `public/` is not served on the app
     * domain and this one had no proxy route. It is the iOS home-screen icon and
     * the 180x180 entry in site.webmanifest.
     */
    public function test_the_apple_touch_icon_is_served(): void
    {
        $this->get('/apple-touch-icon.png')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        // ⚠️ It is declared 180x180 by both the manifest and the <link> tag, and
        // shipped as a 512 — an icon whose real size contradicts its declaration
        // is one Chrome can reject outright.
        [$width, $height] = getimagesize(resource_path('proxy/apple-touch-icon.png'));
        $this->assertSame([180, 180], [$width, $height]);
    }

    /**
     * ⚠️ `/` IS the manifest's `start_url`, and it is also a marketing route — the
     * launch screen used to sit inside an `@unless($isMarketingRoute)`, so a cold
     * start of the installed app rendered neither the screen nor, before that, a
     * usable set of launch tags.
     */
    public function test_the_launch_tags_and_screen_render_on_the_start_url(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertSame(
            count(PwaSplash::LAUNCH_IMAGES),
            substr_count($html, 'apple-touch-startup-image'),
            'One startup-image tag per declared device',
        );

        $this->assertStringContainsString('id="initial-loading-screen"', $html);

        foreach (PwaSplash::LAUNCH_IMAGES as $device) {
            $this->assertStringContainsString(
                '/ios-splash/'.PwaSplash::fileFor($device).'.png',
                $html,
                'Missing tag for '.PwaSplash::fileFor($device),
            );
        }
    }

    public function test_the_generated_filename_is_derived_from_device_metrics(): void
    {
        $this->assertSame('1290x2796', PwaSplash::fileFor(['w' => 430, 'h' => 932, 'dpr' => 3]));
        $this->assertSame('1536x2048', PwaSplash::fileFor(['w' => 768, 'h' => 1024, 'dpr' => 2]));
    }

    public function test_no_two_devices_claim_the_same_media_query(): void
    {
        $seen = [];

        foreach (PwaSplash::LAUNCH_IMAGES as $device) {
            $key = "{$device['w']}x{$device['h']}@{$device['dpr']}";
            $this->assertNotContains($key, $seen, "Duplicate media query for {$key}");
            $seen[] = $key;
        }
    }

    /**
     * ⚠️ Both manifests are served (site.webmanifest and manifest.json), and
     * `background_color` IS the Android splash. Two values means the installed
     * app flashes a different colour depending on which manifest the browser
     * happened to read.
     */
    public function test_both_manifests_agree_on_the_splash_background(): void
    {
        $manifest = json_decode(file_get_contents(resource_path('proxy/manifest.json')), true);
        $webmanifest = json_decode(file_get_contents(resource_path('proxy/site.webmanifest')), true);

        $this->assertSame('#FF007F', $manifest['background_color']);
        $this->assertSame($manifest['background_color'], $webmanifest['background_color']);
        $this->assertSame(
            $manifest['background_color'],
            config('laravelpwa.manifest.background_color'),
        );
    }
}
