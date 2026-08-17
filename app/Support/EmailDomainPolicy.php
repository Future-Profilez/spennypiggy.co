<?php

namespace App\Support;

use App\Models\AllowedDomain;
use App\Models\BlockedDomain;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * The ONE decision of whether an email address may be registered.
 *
 * 🚨 THIS REPLACES THE APPROVED-LIST GATE. `allowed_domains` used to decide
 * signup on its own, and it could not do the job it was written for: its stated
 * intent was to keep throwaway and undeliverable addresses out, but an
 * allow-list can only achieve that by refusing every legitimate custom domain
 * as well. Measured on the live list, it permitted a known disposable service
 * (`yopmail.com`) while refusing Outlook, Hotmail, Proton and every creator on
 * their own brand domain — and `gmail.com` is on it, so it stopped no spammer
 * who wanted in.
 *
 * The order is: override → blocklist → mail server. Read it from here and
 * nowhere else, or the three checks end up applied in different orders on
 * different screens.
 */
class EmailDomainPolicy
{
    /** How long the two admin-managed lists are cached, in seconds. */
    public const LIST_TTL = 60;

    /** How long a domain's mail-server verdict is cached, in seconds. */
    public const MX_TTL = 86400;

    /**
     * Disposable services blocked even on a database that has never been
     * seeded.
     *
     * ⚠️ A baseline in code, NOT the whole list. `blocked_domains` is the
     * maintained one and an admin adds to it as new services appear; without a
     * baseline, a fresh environment (or one where the seeder was never run)
     * would open signup to every throwaway service at once, silently.
     */
    public const BASELINE_BLOCKED = [
        // Yopmail
        'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
        'nospam.ze.tc', 'nomail.xl.cx', 'monemail.fr.nf', 'monmail.fr.nf',
        // Mailinator
        'mailinator.com', 'mailinator.net', 'mailinator2.com', 'sogetthis.com',
        'spamherelots.com', 'notmailinator.com', 'reallymymail.com', 'veryrealemail.com',
        // Guerrilla Mail
        'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
        'guerrillamail.de', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la',
        'spam4.me', 'pokemail.net',
        // Timed inboxes
        '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com',
        'minuteinbox.com', '1secmail.com', '1secmail.net', '1secmail.org',
        // Temp-Mail family
        'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmailo.com', 'tempail.com',
        'tempr.email', 'tmpmail.org', 'tmpeml.com', 'tempmail.dev', 'tempmail.plus',
        'mytemp.email', 'tempmailaddress.com', 'mail-temporaire.fr',
        // Throwaway / trash
        'throwawaymail.com', 'throwam.com', 'trashmail.com', 'trashmail.de',
        'trashmail.net', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
        'discard.email', 'discardmail.com', 'discardmail.de', 'mailcatch.com',
        // Others in common use
        'getnada.com', 'nada.email', 'dispostable.com', 'fakeinbox.com',
        'fakemailgenerator.com', 'emailfake.com', 'maildrop.cc', 'mohmal.com',
        'emailondeck.com', 'moakt.com', 'mailto.plus', 'fexpost.com', 'fexbox.org',
        'tafmail.com', 'mailnesia.com', 'spamgourmet.com', 'inboxbear.com',
        'inboxkitten.com', 'burnermail.io', 'mailsac.com', 'harakirimail.com',
        'mvrht.net', 'spambog.com', 'mailpoof.com', 'anonbox.net', 'byom.de',
        'trbvm.com', 'vomoto.com', 'zetmail.com', 'linshiyouxiang.net',
        // Fake Mail Generator's rotating domains
        'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu',
        'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us',
    ];

    /**
     * Gmail treats dots as insignificant and everything after a `+` as a tag,
     * so all of these are ONE mailbox.
     */
    public const DOT_INSENSITIVE = ['gmail.com', 'googlemail.com'];

    /**
     * Why an address was refused. The caller turns this into copy; the reason
     * exists so the three cases stay distinguishable — "you used a throwaway",
     * "that domain cannot receive mail" and "you mistyped" need three different
     * answers, and the old single "Invalid Email Id." gave none of them.
     */
    public const REASON_MALFORMED = 'malformed';

    public const REASON_DISPOSABLE = 'disposable';

    public const REASON_NO_MAIL_SERVER = 'no_mail_server';

    /**
     * Returns null when the address may be used, or a reason code.
     */
    public static function reject(?string $email): ?string
    {
        $domain = self::domainOf($email);

        if ($domain === null) {
            return self::REASON_MALFORMED;
        }

        // 🚨 The override wins over BOTH checks below. `allowed_domains` is now
        // an always-allow list: a partner domain whose DNS we cannot read, or
        // one an admin has vouched for, must never be refused by an automated
        // check.
        if (self::isOverridden($domain)) {
            return null;
        }

        if (self::isBlocked($domain)) {
            return self::REASON_DISPOSABLE;
        }

        if (! self::canReceiveMail($domain)) {
            return self::REASON_NO_MAIL_SERVER;
        }

        return null;
    }

    /** The creator-facing wording for a reason code. */
    public static function message(string $reason, ?string $domain = null): string
    {
        return match ($reason) {
            self::REASON_DISPOSABLE => 'Temporary and disposable email addresses cannot be used here. Please use an address you will still have access to later — your receipts and account recovery are sent to it.',
            self::REASON_NO_MAIL_SERVER => $domain
                ? "We could not find a mail server for {$domain}, so this address cannot receive email. Check the spelling, or use another address."
                : 'That domain cannot receive email. Check the spelling, or use another address.',
            default => 'That does not look like a valid email address.',
        };
    }

    /** Convenience: reason + message in one call, or null to accept. */
    public static function errorFor(?string $email): ?string
    {
        $reason = self::reject($email);

        if ($reason === null) {
            return null;
        }

        return self::message($reason, self::domainOf($email));
    }

    public static function domainOf(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        $domain = trim(substr(strrchr($email, '@') ?: '', 1));

        return $domain === '' ? null : $domain;
    }

    public static function isBlocked(string $domain): bool
    {
        return in_array($domain, self::blockedList(), true);
    }

    public static function isOverridden(string $domain): bool
    {
        return in_array($domain, self::overrideList(), true);
    }

    /**
     * Does this domain have somewhere to deliver mail?
     *
     * ⚠️ FAILS OPEN. A DNS blip, a resolver that is slow, or a host where the
     * function is disabled must never be able to refuse every signup on the
     * platform. An unanswerable question is treated as "yes".
     *
     * ⚠️ An A record counts. RFC 5321 says a domain with no MX but an address
     * record still accepts mail on that host, and a handful of long-standing
     * business domains are set up exactly that way — refusing them would
     * recreate the problem this replaces.
     */
    public static function canReceiveMail(string $domain): bool
    {
        return Cache::remember('email_mx_ok:'.$domain, self::MX_TTL, function () use ($domain) {
            if (! function_exists('checkdnsrr')) {
                return true;
            }

            try {
                if (checkdnsrr($domain, 'MX')) {
                    return true;
                }

                // RFC 5321 implicit MX.
                return checkdnsrr($domain, 'A') || checkdnsrr($domain, 'AAAA');
            } catch (\Throwable $e) {
                Log::warning('Mail-server lookup failed, allowing the address.', [
                    'domain' => $domain,
                    'error' => $e->getMessage(),
                ]);

                return true;
            }
        });
    }

    /**
     * The form of an address used to decide whether an account already exists.
     *
     * 🚨 NOT what gets stored. The address the person typed is what we mail and
     * what they recognise; this is only for the "is this the same mailbox?"
     * question. `jane@gmail.com`, `jane+1@gmail.com` and `j.a.ne@gmail.com` are
     * one inbox, and today they are three accounts that each pass every check.
     *
     * ⚠️ Dot-stripping is applied to Gmail ONLY. On other providers a dot is a
     * literal character and two addresses that differ by one are two different
     * people. Plus-tagging is near-universal, so that is stripped everywhere.
     */
    public static function normalise(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        $at = strrpos($email, '@');
        $local = substr($email, 0, $at);
        $domain = substr($email, $at + 1);

        if (($plus = strpos($local, '+')) !== false) {
            $local = substr($local, 0, $plus);
        }

        if (in_array($domain, self::DOT_INSENSITIVE, true)) {
            $local = str_replace('.', '', $local);
            $domain = 'gmail.com';
        }

        if ($local === '') {
            return null;
        }

        return $local.'@'.$domain;
    }

    /**
     * Is this mailbox already registered under a different spelling?
     *
     * ⚠️ Scoped to the aliasable providers, so this is an indexed lookup on a
     * handful of candidate rows rather than a normalisation of the whole users
     * table. A plain `where('email', $email)` unique rule still covers the
     * exact-match case; this only catches the alias.
     */
    public static function aliasOfExistingAccount(?string $email, ?int $ignoreUserId = null): bool
    {
        $normalised = self::normalise($email);
        $domain = self::domainOf($email);

        if ($normalised === null || $domain === null) {
            return false;
        }

        // Only worth asking where the local part can legitimately vary.
        if (! in_array($domain, self::DOT_INSENSITIVE, true) && ! str_contains((string) $email, '+')) {
            return false;
        }

        $local = substr($normalised, 0, strrpos($normalised, '@'));

        // Candidates: same domain family, local part starting with the same
        // letter. Narrow enough to stay cheap, wide enough that a dotted or
        // tagged variant is always in it.
        $candidates = User::query()
            ->when($ignoreUserId, fn ($q) => $q->where('id', '!=', $ignoreUserId))
            ->where(function ($q) use ($domain) {
                if (in_array($domain, self::DOT_INSENSITIVE, true)) {
                    $q->where('email', 'like', '%@gmail.com')
                        ->orWhere('email', 'like', '%@googlemail.com');
                } else {
                    $q->where('email', 'like', '%@'.$domain);
                }
            })
            ->where('email', 'like', substr($local, 0, 1).'%')
            ->pluck('email');

        foreach ($candidates as $existing) {
            if (self::normalise($existing) === $normalised) {
                return true;
            }
        }

        return false;
    }

    /** @return array<int, string> */
    protected static function blockedList(): array
    {
        // ⚠️ Short TTL: the two apps share a database but NOT a cache, so an
        // admin adding a domain in the back office cannot forget this entry.
        // The TTL IS the lag.
        $stored = Cache::remember('blocked_email_domains', self::LIST_TTL, function () {
            try {
                return BlockedDomain::pluck('name')
                    ->map(fn ($d) => strtolower(trim((string) $d)))
                    ->filter()
                    ->all();
            } catch (\Throwable $e) {
                // A missing table (deploy order) must not open the gate wide;
                // the baseline still applies.
                return [];
            }
        });

        return array_values(array_unique(array_merge(self::BASELINE_BLOCKED, $stored)));
    }

    /** @return array<int, string> */
    protected static function overrideList(): array
    {
        return Cache::remember('override_email_domains', self::LIST_TTL, function () {
            try {
                return AllowedDomain::pluck('name')
                    ->map(fn ($d) => strtolower(trim((string) $d)))
                    ->filter()
                    ->all();
            } catch (\Throwable $e) {
                return [];
            }
        });
    }

    /** Drop both cached lists — call after an admin edits either one. */
    public static function forgetLists(): void
    {
        Cache::forget('blocked_email_domains');
        Cache::forget('override_email_domains');
    }
}
