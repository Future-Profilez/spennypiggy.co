<?php

namespace App\Services\Bio;

use RuntimeException;

/**
 * The stablecoin rail is not switched on.
 *
 * ⚠️ Its message is supporter-facing and says nothing about why. It does not
 * name a provider, does not promise a date, and does not describe a settlement
 * speed — all three are standing client prohibitions, and the third is one
 * nobody has confirmed.
 */
class BioTipUnavailableException extends RuntimeException
{
    public function __construct(string $message = 'Tips are not available yet.')
    {
        parent::__construct($message);
    }
}
