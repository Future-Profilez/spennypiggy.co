<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'actor',
        'admin_id',
        'action_type',
        'reference_id',
        'entity_type',
        'entity_id',
        'case_id',
        'correlation_id',
        'reason_code',
        'metadata_json',
        'old_values',
        'new_values',
        'evidence_refs',
        'payment_refs',
        'created_at', // Add this
    ];

    protected $casts = [
        'metadata_json' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
        'evidence_refs' => 'array',
        'payment_refs' => 'array',
    ];

    protected static function booted(): void
    {
        /*
         * 🚨 AN AUDIT ROW IS WRITTEN ONCE AND NEVER CHANGED. The scrub command and
         * the system-row prune go through the query builder deliberately (a row is
         * never re-dated, and a prune is a policy, not an edit); everything else
         * that reaches the model is refused. Mirrored in the admin app's model.
         */
        static::updating(function (): void {
            throw new \LogicException('audit_logs rows are immutable — write a new row instead of changing one.');
        });
        static::deleting(function (): void {
            throw new \LogicException('audit_logs rows are immutable — a deletion here is a hole in the record.');
        });

        static::creating(function (self $model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
            if (! $model->created_at) {
                $model->created_at = now();
            }
            $model->normaliseReasonCode();
        });
    }

    /**
     * The value stored when a caller passed prose where a CODE belongs.
     *
     * ⚠️ It names WHERE the reason is, never what it was — inventing a code for
     * somebody else's sentence would put a decision in the trail nobody took.
     */
    public const REASON_NOTE_CODE = 'SEE_REASON_NOTE';

    /** The column is `string` (varchar 255); a code has no business near that. */
    private const REASON_CODE_MAX = 64;

    /**
     * 🚨 `reason_code` IS A CODE, AND AN OVERLONG ONE TOOK THE ADMIN'S ACTION
     * DOWN WITH IT (Sentry JAVASCRIPT-REACT-B8 / -BJ, 6 Sep 2026).
     *
     * Several call sites read `$reason ?: 'REJECTED'`, where `$reason` is the
     * admin's own typed paragraph — so rejecting a creator with a real
     * explanation wrote a 400-character sentence into a varchar(255) and threw
     * SQLSTATE[22001]. Every one of those callers saves the record FIRST and
     * audits second, so the creator was rejected, the e-mail went out, and the
     * admin was shown *"Error: SQLSTATE[22001]…"* — a failure message for an
     * action that had already happened. That is the expensive half: the next
     * thing a reviewer does is try again.
     *
     * The guard lives on the MODEL rather than in `AuditTrailService` because
     * this app writes rows through that service AND directly, the website
     * writes them only directly, and a rule enforced in one writer is a rule
     * the next writer does not have.
     *
     * ⚠️ NOTHING IS LOST. The full text moves to `metadata_json.reason_note`
     * (never overwriting a note a caller set itself), so the Explorer still
     * shows the reviewer's words — they are simply no longer pretending to be
     * a code the presenter can map.
     */
    private function normaliseReasonCode(): void
    {
        $original = $this->reason_code;

        if (! is_string($original)) {
            return;
        }

        $code = trim($original);

        // ⚠️ Whitespace-only is ABSENT, not a code — left as-is it renders as a
        // blank reason the Explorer cannot tell from a real one.
        if ($code === '') {
            $this->reason_code = null;

            return;
        }

        // A code: no whitespace, no newlines, short. Anything else is prose.
        $isCodeShaped = mb_strlen($code) <= self::REASON_CODE_MAX
            && preg_match('/^[A-Za-z0-9_.:\-]+$/', $code) === 1;

        if ($isCodeShaped) {
            $this->reason_code = $code;

            return;
        }

        $metadata = $this->metadata_json;
        $metadata = is_array($metadata) ? $metadata : [];

        if (! isset($metadata['reason_note'])) {
            // The caller's own string, untrimmed — the note is the record of what
            // the reviewer actually wrote.
            $metadata['reason_note'] = $original;
            $this->metadata_json = $metadata;
        }

        $this->reason_code = self::REASON_NOTE_CODE;
    }

    // Helper methods
    public function getActorType(): string
    {
        return explode(':', $this->actor)[0] ?? 'unknown';
    }

    public function getActorId(): ?string
    {
        $parts = explode(':', $this->actor);

        return $parts[1] ?? null;
    }

    public function isUserAction(): bool
    {
        return str_starts_with($this->actor, 'user:');
    }

    public function isAdminAction(): bool
    {
        return str_starts_with($this->actor, 'admin:');
    }

    public function isSystemAction(): bool
    {
        return $this->actor === 'system';
    }

    public function getMetadata(?string $key = null)
    {
        if ($key === null) {
            return $this->metadata_json;
        }

        return $this->metadata_json[$key] ?? null;
    }

    // Add scope for filtering
    public function scopeForUser($query, $userId)
    {
        return $query->where('actor', "user:{$userId}");
    }

    public function scopeOfType($query, $actionType)
    {
        return $query->where('action_type', $actionType);
    }

    public function scopeDateRange($query, $from, $to)
    {
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query;
    }
}
