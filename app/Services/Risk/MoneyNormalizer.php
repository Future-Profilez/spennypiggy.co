<?php

namespace App\Services\Risk;

use App\Models\Currency;

class MoneyNormalizer
{
    public function toGbpMinor(int $amountMinor, string $currency): int
    {
        $currency = strtoupper($currency ?: 'GBP');
        if ($currency === 'GBP') {
            return $amountMinor;
        }

        $from = Currency::where('ISO', $currency)->first();
        $gbp = Currency::where('ISO', 'GBP')->first();

        if (!$from || !$gbp || (float) $from->conversion_rate === 0.0) {
            return $amountMinor;
        }

        $fromDigits = (int) ($from->ISOdigits ?? 2);
        $fromDivisor = $fromDigits === 0 ? 1 : (10 ** $fromDigits);

        $amountMajor = $amountMinor / $fromDivisor;
        $gbpMajor = $amountMajor / (float) $from->conversion_rate;
        $gbpMinor = (int) round($gbpMajor * 100);

        return max(0, $gbpMinor);
    }
}

