<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * One competitor comparison sheet — the contents of config/comparisons/{slug}.php.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026.
 *
 * 🚨 THIS CLASS IS THE PUBLISH GATE, AND IT FAILS LOUD IN DEVELOPMENT AND
 * CLOSED IN PRODUCTION. The spec's acceptance criteria are explicit: a sheet
 * with fewer than two "where they are better" bullets, or a fee row missing its
 * source URL, "refuses to publish and shows a clear error in development".
 *
 * The reason is the whole premise of these pages. They make a transparency
 * claim — every competitor figure is sourced from that competitor's own site,
 * with the date it was checked — and a page that quietly renders a sourceless
 * number is worse than no page, because it looks exactly like a sourced one.
 * So an invalid sheet throws where a developer will see it, and 404s in
 * production rather than publishing a claim nobody can stand behind.
 */
class CompetitorSheet
{
    /**
     * Fields a sheet cannot be built without.
     *
     * ⚠️ `betterAt` is on this list on purpose. "Where they are better" is
     * MANDATORY per the spec — the page does not publish with fewer than two —
     * because a comparison page that finds nothing good to say about the
     * competitor reads as marketing rather than as information, and a creator
     * choosing between two products deserves the whole picture.
     */
    private const REQUIRED = [
        'name',
        'what',
        'heroSubline',
        'metaTitle',
        'metaDescription',
        'betterAt',
        'switchSteps',
    ];

    /**
     * The three page shapes the spec defines, and the Inertia page each renders.
     *
     * 🚨 THEY ARE SEPARATE COMPONENTS ON PURPOSE. A generic page names no brand
     * and cites no sources; a case study has a timeline and no fee table at all.
     * Branching all three inside one template produces a component whose every
     * section is wrapped in a condition, and the rules that differ between them
     * (a source link is mandatory HERE and meaningless THERE) stop being
     * checkable.
     */
    public const LAYOUTS = [
        'comparison' => 'creators/vs/Show',
        'generic' => 'creators/vs/Generic',
        'case_study' => 'creators/vs/CaseStudy',
    ];

    private const MIN_BETTER_AT = 2;

    private const SWITCH_STEPS = 3;

    private function __construct(
        public readonly string $slug,
        private readonly array $sheet,
    ) {}

    /**
     * Load a sheet by slug, or null when there is no such competitor.
     *
     * ⚠️ The slug IS the config file name and nothing else is consulted, so an
     * unknown slug can only ever 404 — there is no lookup a caller can steer.
     */
    public static function find(string $slug): ?self
    {
        if (! preg_match('/^[a-z0-9-]+$/', $slug)) {
            return null;
        }

        $sheet = config("comparisons.$slug");

        if (! is_array($sheet) || $sheet === []) {
            return null;
        }

        $found = new self($slug, $sheet);

        try {
            $found->assertValid();
        } catch (RuntimeException $e) {
            // Loud where someone can fix it; silent-but-logged where a visitor
            // would otherwise be shown a half-built page.
            if (app()->environment('local', 'testing')) {
                throw $e;
            }

            Log::error('Comparison sheet is invalid and will not be served', [
                'slug' => $slug,
                'reason' => $e->getMessage(),
            ]);

            return null;
        }

        return $found;
    }

    /**
     * Every sheet that is ready to be served, in config order.
     *
     * Used by /creators/compare and by the "how we compare" cards on the
     * /creators overview. ⚠️ An unpublished or invalid sheet is absent from
     * both — the spec's rule is that a card only ever links to a live page.
     */
    public static function published(): array
    {
        $slugs = array_keys(config('comparisons', []));

        return array_values(array_filter(array_map(
            fn (string $slug) => self::find($slug),
            $slugs
        ), fn (?self $sheet) => $sheet !== null && $sheet->isPublished()));
    }

    /**
     * 🚨 Ships false. Jack clears every "verify" row against the competitor's
     * live page before a comparison goes public; nothing here can flip it.
     */
    public function isPublished(): bool
    {
        return (bool) ($this->sheet['published'] ?? false);
    }

    public function name(): string
    {
        return $this->sheet['name'];
    }

    /** Which of the three page shapes this sheet is. */
    public function layout(): string
    {
        $layout = $this->sheet['layout'] ?? 'comparison';

        return isset(self::LAYOUTS[$layout]) ? $layout : 'comparison';
    }

    /** The Inertia component that renders it. */
    public function component(): string
    {
        return self::LAYOUTS[$this->layout()];
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->sheet[$key] ?? $default;
    }

    /**
     * The 21 fixed rows, ours and theirs side by side.
     *
     * ⚠️ Row order and labels come from config/comparison_matrix.php, never
     * from the sheet — a competitor file supplies only its own cell, so no
     * sheet can reorder the questions or restate our answers.
     */
    public function matrix(): array
    {
        $values = config('comparison_matrix.values');
        $theirs = $this->sheet['matrix'] ?? [];

        return array_map(function (array $row) use ($values, $theirs) {
            $cell = $theirs[$row['key']] ?? [];

            $ourValue = ($row['ours_is_literal'] ?? false)
                ? $row['ours']
                : ($values[$row['ours']] ?? $values['not_stated']);

            $theirRaw = $cell['value'] ?? 'not_stated';

            return [
                'key' => $row['key'],
                'label' => $row['label'],
                'ours' => $ourValue,
                // A sheet may give a literal string (the 18+ row's "Yes, with
                // restrictions") or one of the four vocabulary keys.
                'theirs' => $values[$theirRaw] ?? $theirRaw,
                'sourceUrl' => $cell['sourceUrl'] ?? null,
            ];
        }, config('comparison_matrix.rows'));
    }

    /**
     * The competitor's fee lines, each carrying where it was read and when.
     *
     * ⚠️ `notOnPricingPage` is the STRONGEST wording the spec permits anywhere
     * in this UI. Never "hidden", never "sneaky".
     */
    public function fees(): array
    {
        return array_map(fn (array $row) => [
            'label' => $row['label'],
            'value' => $row['value'],
            'sourceUrl' => $row['sourceUrl'],
            'checkedOn' => $row['checkedOn'] ?? null,
            'notOnPricingPage' => (bool) ($row['notOnPricingPage'] ?? false),
            'verify' => (bool) ($row['verify'] ?? false),
        ], $this->sheet['fees'] ?? []);
    }

    /**
     * @throws RuntimeException with a message naming the field, so the failure
     *                          is actionable without opening the class.
     */
    private function assertValid(): void
    {
        /*
         * 🚨 A SHEET WITH AN UNCLEARED `verify` ROW CANNOT BE PUBLISHED.
         *
         * A `verify` row's `value` is a NOTE TO OURSELVES — Linktree's read
         * "Verify the current tier names and prices on their pricing page
         * before publishing" and "Verify. On a link page the buyer usually
         * pays…". Four of its five fee rows are that. Published, those render
         * verbatim on a public, indexable, paid-ads destination as our
         * statement of what a named competitor charges.
         *
         * The rule was written in prose at the top of every sheet and in
         * `isPublished()`'s own docblock — "Jack clears every verify row before
         * a comparison goes public; nothing here can flip it" — and prose is
         * not a guard. Flipping one boolean was all it took, and the page would
         * have rendered perfectly while saying nothing anybody could stand
         * behind. That is the exact failure this whole build is defended
         * against everywhere else.
         *
         * ⚠️ It fails LOUD rather than dropping the row: a silently omitted fee
         * line is a comparison with a hole in it, which is worse than one that
         * refuses to build.
         */
        if (($this->sheet['published'] ?? false) === true) {
            $unverified = array_values(array_filter(
                $this->sheet['fees'] ?? [],
                fn (array $row) => ($row['verify'] ?? false) === true
            ));

            if ($unverified !== []) {
                $labels = implode(', ', array_column($unverified, 'label'));

                throw new RuntimeException(
                    "comparisons.{$this->slug}: cannot publish with ".count($unverified)
                    ." unverified fee row(s) [{$labels}] — clear the `verify` flag against the"
                    .' competitor’s own live page first, or leave `published` false.'
                );
            }
        }

        foreach (self::REQUIRED as $field) {
            if (blank($this->sheet[$field] ?? null)) {
                throw new RuntimeException("comparisons.{$this->slug}: missing required field [$field].");
            }
        }

        $betterAt = $this->sheet['betterAt'];

        if (! is_array($betterAt) || count($betterAt) < self::MIN_BETTER_AT) {
            throw new RuntimeException(
                "comparisons.{$this->slug}: [betterAt] needs at least ".self::MIN_BETTER_AT
                .' genuine points — a comparison page does not publish without them.'
            );
        }

        $steps = $this->sheet['switchSteps'];

        if (! is_array($steps) || count($steps) !== self::SWITCH_STEPS) {
            throw new RuntimeException(
                "comparisons.{$this->slug}: [switchSteps] must be exactly ".self::SWITCH_STEPS.' steps.'
            );
        }

        $this->assertLayoutShape();

        foreach (($this->sheet['fees'] ?? []) as $i => $row) {
            foreach (['label', 'value', 'sourceUrl'] as $field) {
                if (blank($row[$field] ?? null)) {
                    throw new RuntimeException(
                        "comparisons.{$this->slug}: fee row #$i is missing [$field]. "
                        .'Every competitor figure carries a link to the page it was read from.'
                    );
                }
            }
        }

        foreach (($this->sheet['matrix'] ?? []) as $key => $cell) {
            // 🚨 The 18+ row may never read yes without the policy that says so.
            $claimsAdult = $key === 'permits_adult'
                && ! in_array($cell['value'] ?? '', ['no', 'not_stated'], true);

            if ($claimsAdult && blank($cell['sourceUrl'] ?? null)) {
                throw new RuntimeException(
                    "comparisons.{$this->slug}: the [permits_adult] row claims a policy without linking to it."
                );
            }
        }
    }

    /**
     * Each layout has to carry the thing it is FOR.
     *
     * 🚨 A page shape with nothing in it renders as a heading over empty space,
     * which reads as a styling bug rather than as a missing config — so each is
     * refused by name instead.
     */
    private function assertLayoutShape(): void
    {
        $layout = $this->layout();

        if ($layout === 'comparison' && blank($this->sheet['fees'] ?? null)) {
            throw new RuntimeException(
                "comparisons.{$this->slug}: a comparison page needs [fees] — it is the page's whole subject."
            );
        }

        if ($layout === 'generic' && blank($this->sheet['rows'] ?? null)) {
            throw new RuntimeException(
                "comparisons.{$this->slug}: a generic page needs [rows] — it has no fee table to fall back on."
            );
        }

        if ($layout !== 'case_study') {
            return;
        }

        foreach (['timeline', 'differences'] as $field) {
            if (blank($this->sheet[$field] ?? null)) {
                throw new RuntimeException(
                    "comparisons.{$this->slug}: a case study needs [$field]."
                );
            }
        }

        /*
         * 🚨 EVERY LINE OF A TIMELINE ABOUT A REAL COMPANY IS SOURCED. This page
         * describes a business that closed; an unsourced claim about it is the
         * one thing on this build with legal consequences, so it is refused the
         * same way a sourceless fee row is.
         */
        foreach ($this->sheet['timeline'] as $i => $entry) {
            foreach (['when', 'what', 'sourceUrl'] as $field) {
                if (blank($entry[$field] ?? null)) {
                    throw new RuntimeException(
                        "comparisons.{$this->slug}: timeline entry #$i is missing [$field]."
                    );
                }
            }
        }
    }
}
