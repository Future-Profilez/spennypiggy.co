<?php

namespace App\Console\Commands;

use App\Support\MediaUrl;
use App\Support\SecureMedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Pre-flight for Uploadcare secure delivery.
 *
 * 🚨 Run this BEFORE setting MEDIA_SECURE_ENABLED=true. Signing depends on an
 * account setting nobody can switch on from code, and if that setting is not on
 * (or the key is the wrong one) the failure mode is every paid download 403ing
 * at once — on a live platform, silently, for people who have already paid.
 *
 * It signs a real file and reports what the CDN actually answers, signed and
 * unsigned, so the two independent halves are checked separately.
 */
class CheckSecureMedia extends Command
{
    protected $signature = 'media:secure-check
                            {uuid? : An Uploadcare file uuid to probe (defaults to the platform placeholder)}
                            {--no-request : Print the signed URL only; make no HTTP request}';

    protected $description = 'Verify Uploadcare secure delivery is correctly configured before enabling signed paid-content URLs';

    public function handle(): int
    {
        $uuid = (string) ($this->argument('uuid') ?: MediaUrl::FALLBACK_THUMBNAIL);
        $plain = 'https://ucarecdn.com/'.$uuid.'/';

        $this->line('');
        $this->line('<comment>Configuration</comment>');
        $this->table(['Setting', 'Value'], [
            ['media.secure.enabled', config('media.secure.enabled') ? 'true' : 'false (ships off)'],
            ['media.secure.ttl', SecureMedia::ttl().'s'],
            ['media.secure.delivery_ttl', SecureMedia::deliveryTtl().'s'],
            ['UPLOADCARE_SECURE_KEY', $this->keyShape(config('services.uploadcare.secure_key'))],
            ['UPLOADCARE_SECRET_KEY', $this->keyShape(config('services.uploadcare.secret')).' (API key — not the signing key)'],
        ]);

        // The flag gates SecureMedia::sign(), but this command has to be able to
        // report on signing BEFORE anyone flips it — that is its whole purpose.
        $signed = null;
        config()->set('media.secure.enabled', true);
        $signed = SecureMedia::sign($plain);
        config()->set('media.secure.enabled', (bool) env('MEDIA_SECURE_ENABLED', false));

        if (! is_string($signed) || $signed === $plain) {
            $this->error('Could not sign a URL. The signing key is missing or is not an even-length hex string.');
            $this->line('  Uploadcare project → Delivery → enable secure delivery, then copy the CDN secret it issues into UPLOADCARE_SECURE_KEY.');
            $this->line('  ⚠️ Set it explicitly rather than relying on the UPLOADCARE_SECRET_KEY fallback — if the two differ, signing succeeds and the edge still 403s.');

            return self::FAILURE;
        }

        $this->line('');
        $this->line('<comment>Signed URL</comment>');
        $this->line($signed);

        if ($this->option('no-request')) {
            return self::SUCCESS;
        }

        $signedStatus = $this->probe($signed);
        $plainStatus = $this->probe($plain);

        $this->line('');
        $this->table(['Request', 'Status'], [
            ['signed', $signedStatus ?? 'request failed'],
            ['unsigned', $plainStatus ?? 'request failed'],
        ]);

        // The two halves are independent and each has its own failure mode, so
        // they are reported separately rather than as one verdict.
        if ($signedStatus === 200 && $plainStatus === 403) {
            $this->info('READY. Secure delivery is on and the key is correct — MEDIA_SECURE_ENABLED=true is safe.');

            return self::SUCCESS;
        }

        if ($signedStatus === 200 && $plainStatus === 200) {
            $this->warn('Secure delivery is NOT enabled on the Uploadcare account yet — an unsigned URL still answers 200.');
            $this->line('  Turning the flag on now is harmless (the token is ignored) but buys nothing: the permanent links stay reachable.');

            return self::FAILURE;
        }

        if ($signedStatus === 403) {
            $this->error('The SIGNED URL was refused. The signing key is wrong, or the ACL/expiry format does not match this project.');
            $this->line('  🚨 Do NOT set MEDIA_SECURE_ENABLED=true — every paid download would 403.');

            return self::FAILURE;
        }

        $this->warn('Inconclusive. Check the file uuid exists and that this host can reach ucarecdn.com.');

        return self::FAILURE;
    }

    private function probe(string $url): ?int
    {
        try {
            return Http::timeout(10)->withoutRedirecting()->head($url)->status();
        } catch (\Throwable $e) {
            $this->line('  request error: '.$e->getMessage());

            return null;
        }
    }

    /** Never print a key — only whether it is the right SHAPE. */
    private function keyShape($key): string
    {
        $key = (string) $key;

        if ($key === '') {
            return 'not set';
        }

        $hex = preg_match('/^[a-f0-9]+$/i', $key) === 1 && strlen($key) % 2 === 0;

        return sprintf('set, %d chars, %s', strlen($key), $hex ? 'valid hex' : 'NOT hex — unusable as an HMAC key');
    }
}
