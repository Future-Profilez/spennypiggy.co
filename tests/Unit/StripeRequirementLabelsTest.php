<?php

namespace Tests\Unit;

use App\Support\StripeRequirementLabels;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class StripeRequirementLabelsTest extends TestCase
{
    #[Test]
    public function it_collapses_the_three_date_of_birth_keys_into_one_label(): void
    {
        // Stripe asks for dob.day, dob.month and dob.year separately. A creator
        // does not supply three things — printing three rows makes a two-minute
        // form look like nine.
        $labels = StripeRequirementLabels::humanise([
            'individual.dob.day',
            'individual.dob.month',
            'individual.dob.year',
        ]);

        $this->assertSame(['Date of birth'], $labels);
    }

    #[Test]
    public function it_names_the_bank_account_requirement_in_plain_words(): void
    {
        // `external_account` is the single most common blocker and the least
        // guessable key Stripe returns.
        $this->assertSame(
            'Your bank account for payouts',
            StripeRequirementLabels::labelFor('external_account')
        );
    }

    #[Test]
    public function it_resolves_individual_company_and_person_prefixes_to_the_same_label(): void
    {
        // Stripe uses a generated person id (`person_1MK7x2Bd8.address.city`)
        // for anyone who is not the account holder. All three must read the same.
        $this->assertSame('Town or city', StripeRequirementLabels::labelFor('individual.address.city'));
        $this->assertSame('Town or city', StripeRequirementLabels::labelFor('company.address.city'));
        $this->assertSame('Town or city', StripeRequirementLabels::labelFor('person_1MK7x2Bd8XyZ.address.city'));
    }

    #[Test]
    public function an_unmapped_key_still_reads_as_words_not_a_machine_key(): void
    {
        // Stripe adds requirement keys over time, so this path WILL be hit. It
        // must never render something that looks like a bug.
        $this->assertSame(
            'Documents company tax id files',
            StripeRequirementLabels::labelFor('documents.company_tax_id.files')
        );
    }

    #[Test]
    public function it_preserves_order_and_drops_duplicates(): void
    {
        $labels = StripeRequirementLabels::humanise([
            'individual.first_name',
            'individual.dob.day',
            'individual.last_name',
            'individual.dob.year',
            'individual.first_name',
        ]);

        $this->assertSame(
            ['First name', 'Date of birth', 'Last name'],
            $labels
        );
    }

    #[Test]
    public function it_ignores_empty_and_non_string_entries(): void
    {
        $this->assertSame([], StripeRequirementLabels::humanise(['', null, 123]));
    }
}
