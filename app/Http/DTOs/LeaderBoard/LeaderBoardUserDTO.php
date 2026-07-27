<?php

namespace App\Http\DTOs\LeaderBoard;

class LeaderBoardUserDTO extends BaseLeaderBoardUserDTO
{
    private float $totalAmount;

    private string $currency;

    private ?string $name; // Personal name - excluded from public responses

    public function __construct(
        ?string $uuid,
        string $username,
        ?string $name,
        ?string $avatar,
        ?string $coverImg,
        int $rank,
        float $topPercentage,
        int $profileStatusLock,
        int $role,
        float $totalAmount,
        string $currency = 'USD'
    ) {
        parent::__construct(
            $uuid,
            $username,
            $avatar,
            $coverImg,
            $rank,
            $topPercentage,
            $profileStatusLock,
            $role
        );

        $this->totalAmount = $totalAmount;
        $this->currency = $currency;
        $this->name = $name;
    }

    public function toInternalArray(): array
    {
        return array_merge($this->toPublicArray(), [
            'name' => $this->name, // Personal name for internal use only
            'amount' => $this->totalAmount,
            'currency' => $this->currency,
        ]);
    }

    public function hasZeroValue(): bool
    {
        return $this->totalAmount <= 0;
    }

    public function getTotalAmount(): float
    {
        return $this->totalAmount;
    }
}
