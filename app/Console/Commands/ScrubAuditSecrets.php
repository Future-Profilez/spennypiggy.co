<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;

/**
 * One-off repair for secrets already written into `audit_logs`.
 *
 * 🚨 `ActivityObserver` dumps the WHOLE model row into
 * `metadata_json.deleted_data` on a delete. Its redaction list named
 * `two_factor_secret` / `two_factor_key`, which are not columns on this
 * `users` table — the TOTP seed is `tfa_key` — so every `USER_DELETED` row
 * carried a live 2FA secret in plain text beside the account's email and date
 * of birth. The observer is fixed; this scrubs what it already wrote.
 *
 * ⚠️ DRY RUN BY DEFAULT. It rewrites audit history, which is the one table
 * that is supposed to be immutable, so it changes ONLY the value of a
 * sensitive key and never the shape of the row: the key stays, its value
 * becomes `[REDACTED]`, and a reader can still see that the field was
 * present. Nothing else in the row is touched.
 */
class ScrubAuditSecrets extends Command
{
    protected $signature = 'audit:scrub-secrets {--apply} {--max=}';

    protected $description = 'Redact secrets left in audit_logs metadata by the old ActivityObserver list (dry run unless --apply)';

    /**
     * Keys whose VALUE must never sit in an audit row.
     *
     * Kept in step with `ActivityObserver::$excludedFields` — the observer
     * stops new ones arriving, this clears the old ones.
     */
    private const SENSITIVE_KEYS = [
        'tfa_key',
        'passwordless_login_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_key',
        'api_key',
        'secret_key',
        'private_key',
        'access_token',
        'refresh_token',
    ];

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $scrubbed = 0;
        $fields = 0;

        // Only rows that mention one of the keys — the table is large and most
        // of it carries no `deleted_data` at all.
        $query = AuditLog::query()->where(function ($q) {
            foreach (self::SENSITIVE_KEYS as $key) {
                $q->orWhere('metadata_json', 'like', '%"'.$key.'"%');
            }
        })->orderBy('created_at');

        foreach ($query->cursor() as $row) {
            if ($max !== null && $scrubbed >= $max) {
                break;
            }

            $metadata = $row->metadata_json;

            if (! is_array($metadata)) {
                continue;
            }

            $found = 0;
            $clean = $this->redact($metadata, $found);

            if ($found === 0) {
                continue;
            }

            $this->line(sprintf(
                '  %s %s (%s) — %d field(s)',
                $apply ? 'scrubbing' : 'would scrub',
                $row->action_type,
                $row->created_at,
                $found
            ));

            if ($apply) {
                // `AuditLog::$timestamps` is false and `created_at` is fillable,
                // so a plain save cannot silently re-date the row.
                $row->metadata_json = $clean;
                $row->save();
            }

            $scrubbed++;
            $fields += $found;
        }

        $this->newLine();
        $this->info(sprintf(
            '%s %d row(s), %d field(s).',
            $apply ? 'Scrubbed' : 'Would scrub',
            $scrubbed,
            $fields
        ));

        if (! $apply && $scrubbed > 0) {
            $this->comment('Re-run with --apply to write the changes.');
        }

        return self::SUCCESS;
    }

    /**
     * Walk the metadata and redact any sensitive key at any depth.
     *
     * `deleted_data` is one level down today, but `diff` and `old_values`
     * nest differently, and a scrub that only looked where the fault was found
     * would leave the next one behind.
     */
    private function redact(array $data, int &$found): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->redact($value, $found);

                continue;
            }

            if (! in_array((string) $key, self::SENSITIVE_KEYS, true)) {
                continue;
            }

            if ($value === null || $value === '[REDACTED]') {
                continue;
            }

            $data[$key] = '[REDACTED]';
            $found++;
        }

        return $data;
    }
}
