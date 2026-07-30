<?php

namespace App\Services\Diagnostics;

/**
 * One check's outcome in a single shape.
 *
 * The 30+ check methods on SystemDiagnosticsController each return a loose array — some carry
 * `errors`, some don't, some omit `time_ms` entirely. Rather than rewrite all of them at once,
 * this normalises whatever they return into one contract the runner, the persistence layer, the
 * command and the page can all rely on.
 *
 * `skipped` is a first-class status and deliberately NOT green: a check that could not run tells
 * you nothing, and rendering that as a pass is how a broken probe reads as a healthy system.
 */
class CheckResult
{
    public const PASSED = 'passed';

    public const WARNING = 'warning';

    public const FAILED = 'failed';

    public const SKIPPED = 'skipped';

    public function __construct(
        public string $key,
        public string $status,
        public string $message,
        public string $label,
        public string $group,
        public string $severity,
        public ?string $remediation = null,
        /** @var string[] Human-readable detail lines (the legacy `errors` array). */
        public array $details = [],
        /** @var array<int|string> Ids the reader can go and look at. Never unbounded. */
        public array $ids = [],
        public float $durationMs = 0.0,
        /** @var array<string,mixed> Structured extras — grouped error signatures, counts, etc. */
        public array $meta = [],
    ) {}

    /** Cap on ids surfaced per finding — enough to act on, not a data dump. */
    public const MAX_IDS = 25;

    /**
     * Build from whatever a legacy check method returned.
     */
    public static function fromLegacy(string $key, mixed $raw): self
    {
        $raw = is_array($raw) ? $raw : [];

        $status = $raw['status'] ?? self::FAILED;

        // A check reporting a status nobody defined is a bug in that check, not a pass.
        if (! in_array($status, [self::PASSED, self::WARNING, self::FAILED, self::SKIPPED], true)) {
            $status = self::FAILED;
        }

        $details = $raw['errors'] ?? [];
        $details = is_array($details) ? array_values(array_filter(array_map(
            static fn ($d) => is_scalar($d) ? trim((string) $d) : null,
            $details
        ))) : [];

        $ids = $raw['ids'] ?? [];
        $ids = is_array($ids) ? array_slice(array_values($ids), 0, self::MAX_IDS) : [];

        $meta = $raw['meta'] ?? [];

        return new self(
            key: $key,
            status: $status,
            message: (string) ($raw['message'] ?? 'No message reported.'),
            label: CheckCatalog::label($key),
            group: CheckCatalog::group($key),
            // A passing check has no severity to act on; only a problem gets ranked.
            severity: $status === self::PASSED ? CheckCatalog::SEVERITY_INFO : CheckCatalog::severity($key),
            remediation: $status === self::PASSED ? null : CheckCatalog::remediation($key),
            details: $details,
            ids: $ids,
            durationMs: round((float) ($raw['time_ms'] ?? 0), 2),
            meta: is_array($meta) ? $meta : [],
        );
    }

    /** A check that blew up. Reported as one red row — never a dead page. */
    public static function threw(string $key, \Throwable $e): self
    {
        return new self(
            key: $key,
            status: self::FAILED,
            message: 'The check itself failed to run: '.$e->getMessage(),
            label: CheckCatalog::label($key),
            group: CheckCatalog::group($key),
            severity: CheckCatalog::severity($key),
            remediation: 'This is a fault in the diagnostic, not necessarily in the thing it checks. '.CheckCatalog::remediation($key),
            meta: ['exception' => class_basename($e)],
        );
    }

    public static function skipped(string $key, string $why): self
    {
        return new self(
            key: $key,
            status: self::SKIPPED,
            message: $why,
            label: CheckCatalog::label($key),
            group: CheckCatalog::group($key),
            severity: CheckCatalog::SEVERITY_INFO,
        );
    }

    public function isProblem(): bool
    {
        return in_array($this->status, [self::FAILED, self::WARNING], true);
    }

    /** Sort weight: unhealthy first, then by severity, then alphabetically for stability. */
    public function sortKey(): array
    {
        $statusWeight = match ($this->status) {
            self::FAILED => 0,
            self::WARNING => 1,
            self::SKIPPED => 2,
            default => 3,
        };

        return [
            $statusWeight,
            CheckCatalog::SEVERITY_ORDER[$this->severity] ?? 9,
            $this->label,
        ];
    }

    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'status' => $this->status,
            'message' => $this->message,
            'label' => $this->label,
            'group' => $this->group,
            'severity' => $this->severity,
            'remediation' => $this->remediation,
            'details' => $this->details,
            'ids' => $this->ids,
            'time_ms' => $this->durationMs,
            'meta' => $this->meta,
        ];
    }
}
