<?php

namespace App\Support;

/**
 * Turns Stripe's raw requirement keys into something a creator can act on.
 *
 * Stripe answers with machine keys — `individual.address.postal_code`,
 * `person_1MK7x2Bd.dob.year`, `external_account`. The dashboard used to print
 * them almost verbatim ("Individual.Address.Postal Code"), which reads as a
 * system error rather than a to-do list, and gave the creator no idea that
 * `external_account` means "add your bank account".
 *
 * Two jobs:
 *  - map each key to plain wording
 *  - collapse the keys that are really ONE question. Stripe lists
 *    `dob.day`, `dob.month` and `dob.year` separately; a creator does not
 *    supply three things, they supply a date of birth once.
 */
class StripeRequirementLabels
{
    /**
     * Suffix (the part after any `individual.` / `company.` / `person_xxx.`
     * prefix) => human wording. Matched longest-first so `address.line1` wins
     * over `address`.
     */
    private const LABELS = [
        'first_name' => 'First name',
        'last_name' => 'Last name',
        'full_name_aliases' => 'Any other names you use',
        'maiden_name' => 'Maiden name',
        'email' => 'Email address',
        'phone' => 'Phone number',
        'dob' => 'Date of birth',
        'dob.day' => 'Date of birth',
        'dob.month' => 'Date of birth',
        'dob.year' => 'Date of birth',
        'id_number' => 'National ID number',
        'id_number_secondary' => 'Second ID number',
        'ssn_last_4' => 'Last 4 digits of your SSN',
        'political_exposure' => 'Political exposure declaration',
        'nationality' => 'Nationality',

        'address' => 'Home address',
        'address.line1' => 'Address line 1',
        'address.line2' => 'Address line 2',
        'address.city' => 'Town or city',
        'address.state' => 'County or state',
        'address.postal_code' => 'Postcode',
        'address.country' => 'Country',
        'address_kana' => 'Address (kana)',
        'address_kanji' => 'Address (kanji)',

        'verification.document' => 'Photo ID (passport or driving licence)',
        'verification.additional_document' => 'Proof of address document',
        'verification.document.front' => 'Front of your photo ID',
        'verification.document.back' => 'Back of your photo ID',

        'name' => 'Business name',
        'tax_id' => 'Tax ID',
        'vat_id' => 'VAT number',
        'registration_number' => 'Company registration number',
        'structure' => 'Business structure',
        'directors_provided' => 'Confirm your company directors',
        'executives_provided' => 'Confirm your company executives',
        'owners_provided' => 'Confirm your company owners',
        'ownership_declaration' => 'Ownership declaration',

        'relationship.title' => 'Your job title',
        'relationship.director' => 'Whether you are a director',
        'relationship.executive' => 'Whether you are an executive',
        'relationship.owner' => 'Whether you are an owner',
        'relationship.percent_ownership' => 'Your ownership percentage',
    ];

    /**
     * Top-level keys that carry no `individual.`/`company.` prefix.
     */
    private const TOP_LEVEL = [
        'external_account' => 'Your bank account for payouts',
        'bank_account' => 'Your bank account for payouts',
        'tos_acceptance.date' => "Accept Stripe's terms of service",
        'tos_acceptance.ip' => "Accept Stripe's terms of service",
        'tos_acceptance.service_agreement' => "Accept Stripe's terms of service",
        'business_profile.url' => 'Your website address',
        'business_profile.mcc' => 'Your business category',
        'business_profile.name' => 'Your public business name',
        'business_profile.product_description' => 'A description of what you sell',
        'business_profile.support_phone' => 'A support phone number',
        'business_profile.support_email' => 'A support email address',
        'business_profile.support_address' => 'A support address',
        'business_type' => 'Whether you trade as an individual or a company',
        'settings.payments.statement_descriptor' => 'Your card statement descriptor',
    ];

    /**
     * Convert Stripe requirement keys to a deduplicated list of plain labels.
     *
     * Order is preserved from the input (Stripe returns roughly the order it
     * asks for them), and duplicates produced by the collapsing above are
     * dropped — three `dob.*` keys become one "Date of birth".
     *
     * @param  array<int, string>  $fields  Raw Stripe requirement keys.
     * @return array<int, string> Human labels, deduplicated.
     */
    public static function humanise(array $fields): array
    {
        $labels = [];

        foreach ($fields as $field) {
            if (! is_string($field) || $field === '') {
                continue;
            }

            $label = self::labelFor($field);

            // Dedupe by the LABEL, not the key — collapsing dob.day/month/year
            // is the entire point and they are three different keys.
            if (! in_array($label, $labels, true)) {
                $labels[] = $label;
            }
        }

        return $labels;
    }

    /**
     * Plain wording for one raw Stripe requirement key.
     */
    public static function labelFor(string $field): string
    {
        if (isset(self::TOP_LEVEL[$field])) {
            return self::TOP_LEVEL[$field];
        }

        $suffix = self::stripPrefix($field);

        if (isset(self::LABELS[$suffix])) {
            return self::LABELS[$suffix];
        }

        // An unmapped key must still read as a to-do rather than a stack trace.
        // Stripe adds requirement keys over time, so this path is expected to be
        // hit — it must never produce something that looks broken.
        return self::prettify($suffix);
    }

    /**
     * Drop the owner prefix so `individual.address.city`,
     * `company.address.city` and `person_1MK7x2Bd8.address.city` all resolve to
     * the same `address.city` entry.
     */
    private static function stripPrefix(string $field): string
    {
        foreach (['individual.', 'company.'] as $prefix) {
            if (str_starts_with($field, $prefix)) {
                return substr($field, strlen($prefix));
            }
        }

        // `person_<id>.first_name` — the id is generated, so match on the shape.
        if (str_starts_with($field, 'person_')) {
            $dot = strpos($field, '.');

            return $dot === false ? $field : substr($field, $dot + 1);
        }

        return $field;
    }

    /**
     * Last-resort formatting for a key nobody has mapped yet:
     * `documents.company_tax_id.files` => "Company tax id files".
     */
    private static function prettify(string $field): string
    {
        $words = str_replace(['.', '_'], ' ', $field);
        $words = trim(preg_replace('/\s+/', ' ', $words) ?? $words);

        if ($words === '') {
            return 'Additional information';
        }

        return ucfirst($words);
    }
}
