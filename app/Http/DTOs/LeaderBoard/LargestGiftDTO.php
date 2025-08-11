<?php

namespace App\Http\DTOs\LeaderBoard;

class LargestGiftDTO extends BaseLeaderBoardUserDTO
{
    private float $amount;
    private string $currency;
    private ?string $name; // Personal name - excluded from public responses
    private string $type; // Type of gift (wish, subscription, tip, etc.)

    public function __construct(
        ?string $uuid,
        string $username,
        ?string $name,
        ?string $avatar,
        ?string $coverImg,
        int $profileStatusLock,
        int $role,
        float $amount,
        string $currency,
        string $type
    ) {
        parent::__construct(
            $uuid,
            $username,
            $avatar,
            $coverImg,
            0, // No rank for largest gifts
            0.0, // No top percentage for largest gifts
            $profileStatusLock,
            $role
        );
        
        $this->amount = $amount;
        $this->currency = $currency;
        $this->name = $name;
        $this->type = $type;
    }

    public function toPublicArray(): array
    {
        $baseArray = parent::toPublicArray();
        
        // Remove rank and top percentage as they're not relevant for largest gifts
        unset($baseArray['rank'], $baseArray['top']);
        
        // Add type but exclude financial amounts from public view
        return array_merge($baseArray, [
            'type' => $this->type
        ]);
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

    public function getType(): string
    {
        return $this->type;
    }
}
