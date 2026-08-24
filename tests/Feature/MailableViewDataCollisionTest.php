<?php

namespace Tests\Feature;

use App\Mail\AbandonedCheckoutReminder;
use App\Mail\ContentUnderReview;
use ReflectionClass;
use ReflectionProperty;
use Tests\TestCase;

/**
 * 🚨 A PUBLIC PROPERTY ON A MAILABLE SILENTLY OVERWRITES ITS OWN VIEW DATA.
 *
 * `Mailable::buildViewData()` reflects over PUBLIC properties and merges them
 * OVER the `Content(with: […])` array. So when `content()` COMPUTES a value and a
 * public property shares that key, the computed version is thrown away — and the
 * e-mail renders perfectly, which is what makes it invisible. `ReactivationReminder`
 * lost its whole Discovery attribution this way (20 Aug 2026).
 *
 * Two more were found by scanning every Mailable on 24 Aug 2026 and asserting
 * against RENDERED output rather than the payload — the payload is exactly what
 * lies here.
 */
class MailableViewDataCollisionTest extends TestCase
{
    /**
     * 🚨 `resolvedFirstName()` exists to fall back to "there" when no name is
     * known. A public `$firstName = null` overwrote it, so the e-mail rendered
     * "You are one step away, " — a dangling comma with nothing after it, on a
     * recovery mail sent to supporters.
     */
    public function test_the_abandoned_checkout_greeting_falls_back_instead_of_rendering_nothing(): void
    {
        $html = (new AbandonedCheckoutReminder(
            checkoutUrl: 'https://example.test/checkout/abc',
            creatorName: 'Ada',
            firstName: null,
        ))->render();

        $this->assertStringContainsString('there', $html);
        $this->assertStringNotContainsString('step away, <span style="color:#FF007F;"></span>', $html);
    }

    /**
     * 🚨 An empty `$manageUrl` must fall back to the app URL. As a public
     * property it overwrote that fallback and rendered `href=""` — a link to
     * nowhere, on the mail telling a creator their item is under review.
     */
    public function test_content_under_review_never_renders_an_empty_link(): void
    {
        $html = (new ContentUnderReview(
            creatorName: 'Ada',
            feature: 'listing',
            itemTitle: 'A print',
            reason: 'Awaiting review',
            manageUrl: '',
        ))->render();

        $this->assertStringNotContainsString('href=""', $html);
        $this->assertStringContainsString(config('app.url'), $html);
    }

    /**
     * ⚠️ The general guard: no Mailable may declare a PUBLIC property whose name
     * matches a key its own `content()` COMPUTES. A plain `'x' => $this->x`
     * passthrough is harmless — the merge is a no-op — so only transformed values
     * are reported.
     */
    public function test_no_mailable_overwrites_a_value_its_content_method_computes(): void
    {
        $offenders = [];

        foreach (glob(app_path('Mail/*.php')) as $file) {
            $class = 'App\\Mail\\'.basename($file, '.php');

            if (! class_exists($class)) {
                continue;
            }

            $reflection = new ReflectionClass($class);

            if ($reflection->isAbstract()) {
                continue;
            }

            $public = [];

            foreach ($reflection->getProperties(ReflectionProperty::IS_PUBLIC) as $property) {
                if ($property->isStatic() || $property->getDeclaringClass()->getName() !== $class) {
                    continue;
                }

                $public[$property->getName()] = true;
            }

            if ($public === []) {
                continue;
            }

            $source = file_get_contents($file);

            if (! preg_match("/function content\(\).*?\n    \}/s", $source, $body)) {
                continue;
            }

            preg_match_all('/[\'"]([a-zA-Z_][a-zA-Z0-9_]*)[\'"]\s*=>\s*([^\n]+)/', $body[0], $pairs, PREG_SET_ORDER);

            foreach ($pairs as [, $key, $value]) {
                if (! isset($public[$key])) {
                    continue;
                }

                $value = trim(rtrim(trim($value), ','));

                // Passthrough — the property and the key hold the same thing.
                if ($value === '$this->'.$key || $value === '$this->'.$key.']') {
                    continue;
                }

                $offenders[] = class_basename($class)." key [{$key}] <= {$value}";
            }
        }

        $this->assertSame(
            [],
            $offenders,
            'These Mailables compute a value in content() that a public property of the same '
            ."name then overwrites, so the computed version never reaches the view:\n  "
            .implode("\n  ", $offenders)
        );
    }
}
