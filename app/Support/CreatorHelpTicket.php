<?php

namespace App\Support;

use App\Helpers;
use App\Mail\HelpTicketOpenedMail;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Open a help conversation between a creator and the Spenny Piggy team.
 *
 * See `config/creator_help.php` for what a help ticket IS and the three tiers.
 * The admin app carries a mirror of this class (it writes the same row from its
 * own refusals and suspensions); keep the two in step by hand.
 *
 * 🚨 NEVER THROWS. Every caller sits inside a Stripe webhook, a suspension
 * write or a creator's button press — a ticket failing to open must not fail
 * the thing it is about. Returns the ticket, or null.
 *
 * Guards, in order:
 *   - master switch off → null
 *   - unknown code → null (logged)
 *   - an OPEN ticket for this creator + code already exists → that ticket
 *     (never a second conversation about the same thing)
 *   - tier 1 only: a RESOLVED ticket for this code exists → null. An automatic
 *     opener must not reopen a conversation a person closed; the creator can
 *     still open one themselves.
 *   - tier 1 only: the daily cap → null + ERROR log.
 */
final class CreatorHelpTicket
{
    public static function openFor(User $creator, string $code, ?string $opening = null, array $context = [], bool $auto = true): ?SupportTicket
    {
        try {
            if (! config('creator_help.enabled', true)) {
                return null;
            }

            $def = config("creator_help.codes.{$code}");

            if (! is_array($def)) {
                Log::warning('CreatorHelpTicket: unknown code', ['code' => $code, 'user_id' => $creator->id]);

                return null;
            }

            /*
             * 🚨 ONE CONVERSATION PER CREATOR PER CODE, EVEN UNDER A RACE (review finding,
             * 7 Sep 2026). The "is one already open" read and the insert below are two
             * statements, so a retried webhook or a double-tapped button could pass the
             * read twice and open two. The lock serialises them; a caller that cannot
             * take it inside a few seconds answers with whatever the other one opened.
             */
            $lock = Cache::lock("creator_help:open:{$creator->id}:{$code}", 10);

            try {
                return $lock->block(5, fn () => self::openLocked($creator, $code, $def, $opening, $context, $auto));
            } catch (LockTimeoutException) {
                return self::openTicketFor($creator, $code);
            }
        } catch (\Throwable $e) {
            Log::error('CreatorHelpTicket: failed to open', [
                'code' => $code,
                'user_id' => $creator->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /** The open ticket for this creator + code, if there is one. */
    private static function openTicketFor(User $creator, string $code): ?SupportTicket
    {
        $type = (string) config('creator_help.type', 'help');
        $openStatuses = [config('creator_help.status_open', 'open'), config('creator_help.status_awaiting_admin', 'awaiting_admin'), 'escalated'];

        return SupportTicket::where('type', $type)
            ->where('creator_id', $creator->id)
            ->where('event_type', $code)
            ->whereIn('status', $openStatuses)
            ->orderByDesc('id')
            ->first();
    }

    /** Every tier-1 code — the only ones the daily cap counts. */
    private static function tierOneCodes(): array
    {
        return array_keys(array_filter(
            (array) config('creator_help.codes', []),
            fn ($def) => is_array($def) && (int) ($def['tier'] ?? 0) === 1
        ));
    }

    private static function openLocked(User $creator, string $code, array $def, ?string $opening, array $context, bool $auto): ?SupportTicket
    {
        $type = (string) config('creator_help.type', 'help');

        $existing = self::openTicketFor($creator, $code);

        if ($existing) {
            return $existing;
        }

        if ($auto) {
            $resolvedBefore = SupportTicket::where('type', $type)
                ->where('creator_id', $creator->id)
                ->where('event_type', $code)
                ->exists();

            if ($resolvedBefore) {
                return null;
            }

            // 🚨 The cap counts AUTOMATIC (tier-1) openers only. A busy day of
            // creators pressing "Get help" must not silence a fraud flag or a
            // suspension notice (review finding, 7 Sep 2026).
            $cap = (int) config('creator_help.daily_cap', 10);
            $today = SupportTicket::where('type', $type)
                ->whereNull('supporter_id')
                ->whereIn('event_type', self::tierOneCodes())
                ->where('created_at', '>=', now()->startOfDay())
                ->count();

            if ($cap > 0 && $today >= $cap) {
                Log::error('CreatorHelpTicket: daily auto-open cap reached — ticket NOT opened', [
                    'cap' => $cap,
                    'code' => $code,
                    'user_id' => $creator->id,
                ]);

                return null;
            }
        }

        $message = trim((string) ($opening ?: $def['opening']));

        $ticket = SupportTicket::create([
            'type' => $type,
            'status' => config('creator_help.status_open', 'open'),
            'creator_id' => $creator->id,
            'supporter_id' => null,
            'event_type' => $code,
            'source' => $context['source'] ?? null,
            'source_id' => isset($context['source_id']) ? (string) $context['source_id'] : null,
            'reason' => $def['title'],
            'last_message_at' => now(),
            'last_admin_message_at' => now(),
        ]);

        // 🚨 FROM SUPPORT, NOT AS THE CREATOR. `sender_role = admin` with no user id
        // is how the existing screens already render "Admin / Support".
        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_role' => 'admin',
            'sender_user_id' => null,
            'message' => $message,
            'attachments' => null,
        ]);

        self::notify($creator, $ticket, $auto);

        return $ticket;
    }

    /**
     * Tier 3: the automatic first answer to a creator's message, or null.
     */
    public static function autoReplyFor(string $message): ?string
    {
        $haystack = mb_strtolower($message);

        foreach ((array) config('creator_help.auto_replies', []) as $entry) {
            foreach ((array) ($entry['match'] ?? []) as $needle) {
                if ($needle !== '' && str_contains($haystack, mb_strtolower($needle))) {
                    return (string) config('creator_help.auto_reply_prefix')
                        .self::substitute((string) $entry['reply']);
                }
            }
        }

        return null;
    }

    private static function substitute(string $text): string
    {
        $wait = '8 to 14 days';

        try {
            if (class_exists(PayoutCycle::class) && defined(PayoutCycle::class.'::WAIT_LABEL')) {
                $wait = (string) constant(PayoutCycle::class.'::WAIT_LABEL');
            }
        } catch (\Throwable) {
            // keep the default
        }

        return str_replace(['{payout_wait}', '{reserve_days}'], [$wait, '30'], $text);
    }

    private static function notify(User $creator, SupportTicket $ticket, bool $auto): void
    {
        $url = route('support.tickets.show', $ticket->uuid);

        try {
            Helpers::sendNotification(
                $auto ? 'We opened a support conversation for you' : 'Your help request is open',
                $ticket->reason.' — open it to reply.',
                $creator->email
            );
        } catch (\Throwable $e) {
            Log::warning('CreatorHelpTicket: bell failed', ['ticket' => $ticket->id, 'error' => $e->getMessage()]);
        }

        try {
            if ($creator->email && $creator->shouldSendEmailNotification()) {
                Mail::to($creator->email)
                    ->bcc((array) config('support.ticket_admin_recipients', []))
                    ->send(new HelpTicketOpenedMail($ticket, $creator, $url, $auto));
            }
        } catch (\Throwable $e) {
            Log::warning('CreatorHelpTicket: mail failed', ['ticket' => $ticket->id, 'error' => $e->getMessage()]);
        }
    }
}
