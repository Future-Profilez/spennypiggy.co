<?php

namespace App\Http\DTOs\LeaderBoard;

class RecentGifterDTO extends BaseLeaderBoardUserDTO
{
    private float $amount;

    private string $currency;

    private ?string $name; // Personal name - excluded from public responses

    public function __construct(
        ?string $uuid,
        string $username,
        ?string $name,
        ?string $avatar,
        ?string $coverImg,
        int $profileStatusLock,
        int $role,
        float $amount,
        string $currency
    ) {
        parent::__construct(
            $uuid,
            $username,
            $avatar,
            $coverImg,
            0, // No rank for recent gifters
            0.0, // No top percentage for recent gifters
            $profileStatusLock,
            $role
        );

        $this->amount = $amount;
        $this->currency = $currency;
        $this->name = $name;
    }

    public function toPublicArray(): array
    {
        $baseArray = parent::toPublicArray();

        // Remove rank and top percentage as they're not relevant for recent gifters
        unset($baseArray['rank'], $baseArray['top']);

        // Return without financial amounts
        return $baseArray;
    }

    public function toInternalArray(): array
    {
        return array_merge($this->toPublicArray(), [
            'name' => $this->name, // Personal name for internal use only
            'amount' => $this->amount,
            'currency' => $this->currency,
        ]);
    }

    public function hasZeroValue(): bool
    {
        return $this->amount <= 0;
    }

    public function getAmount(): float
    {
        return $this->amount;
    }
}
