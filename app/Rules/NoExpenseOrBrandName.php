<?php

namespace App\Rules;

use App\Support\ContentWording;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Stripe compliance — Goal / Deliverable two-field model (20 June 2026 spec, §3).
 *
 * THE one naming rule. Rejects impersonated brands, bill / debt / living-expense
 * wording, AND wording that names the payment rather than the content. Applied to:
 *   - Field B (the content deliverable title) — must read as content, never an expense.
 *   - Field A (the optional goal label) — aspirational goals are fine ("studio upgrade",
 *     "new camera"), but a living expense / bill / debt named on a public surface
 *     ("rent", "phone bill", "car payment", "vet bill") reads as bill-funding, a
 *     prohibited category for the payment partner.
 *
 * The "delete the money reason" test (spec §6): the value must still make sense as
 * content/aspiration once the money reason is removed. "Exclusive summer set" stands
 * alone; "rent" does not — it is just an expense.
 *
 * NOTE: the earlier brand-only `NoBrandOrExpenseName` and `Helpers::validateItemField()`
 * were both folded into this class and DELETED on 14 Aug 2026 — both had zero
 * production callers, so between them they enforced nothing at all. One rule now, so
 * a field cannot be covered by one definition and missed by another.
 *
 * We deliberately do NOT block the bare word "bill" (the feature is called Bills and
 * "Bill" is also a common name); only expense *phrases* and specific living-expense
 * terms are blocked, to avoid false positives. The same reasoning governs the
 * transfer list below.
 */
class NoExpenseOrBrandName implements ValidationRule
{
    /**
     * 🚨 `$allowedBrands` EXISTS FOR ONE CASE: a field whose JOB is to name a
     * third-party platform. A social link button on the bio page is exactly
     * that — the creator picks TikTok from a list and the button has to be
     * able to say "TikTok", which is the platform's own intended labelling and
     * neither impersonation nor selling somebody else's service.
     *
     * ⚠️ Pass ONLY the tokens the selected platform itself needs. It is an
     * allowance for one row, never a way to switch the brand list off: a link
     * whose platform is TikTok still may not be labelled "Netflix".
     */
    public function __construct(private array $allowedBrands = []) {}

    /**
     * ⚠️ The lists and the matching moved to `App\Support\ContentWording` on
     * 31 Aug 2026 so the creator's own review screen and the admin console's
     * reviewer advice could reach the SAME verdict as this rule. Nothing about
     * what passes or fails changed — this is the same check, called elsewhere.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $match = ContentWording::firstMatch((string) $value, $this->allowedBrands);

        if ($match !== null) {
            $fail($match['message']);
        }
    }
}
