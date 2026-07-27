<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class ValidSubscriptionPeriod implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $sub = request()->input('subscription');
        if ($sub == 1) {
            if (! in_array($value, ['daily', 'weekly', 'monthly', 'yearly'])) {
                $fail('Please select a valid subscription period. It can be daily, weekly, monthly.');
            }
        }
    }
}
