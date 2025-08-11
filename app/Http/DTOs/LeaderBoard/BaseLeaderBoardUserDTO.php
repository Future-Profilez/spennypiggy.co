<?php

namespace App\Http\DTOs\LeaderBoard;

abstract class BaseLeaderBoardUserDTO
{
    protected string $uuid;
    protected string $username;
    protected ?string $avatar;
    protected ?string $coverImg;
    protected int $rank;
    protected float $topPercentage;
    protected int $profileStatusLock;
    protected int $role;

    public function __construct(
        ?string $uuid,
        string $username,
        ?string $avatar,
        ?string $coverImg,
        int $rank,
        float $topPercentage,
        int $profileStatusLock,
        int $role
    ) {
        $this->uuid = $uuid ?? '';
        $this->username = $username;
        $this->avatar = $avatar;
        $this->coverImg = $coverImg;
        $this->rank = $rank;
        $this->topPercentage = $topPercentage;
        $this->profileStatusLock = $profileStatusLock;
        $this->role = $role;
    }

    /**
     * Convert to public-safe array (no financial data, no personal names)
     */
    public function toPublicArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'username' => $this->username,
            'avatar' => $this->avatar,
            'coverimg' => $this->coverImg,
            'rank' => $this->rank,
            'top' => $this->topPercentage,
            'profile_status_lock' => $this->profileStatusLock,
            'role' => $this->role,
        ];
    }

    /**
     * Convert to internal array (includes financial data if needed for admin use)
     */
    abstract public function toInternalArray(): array;

    public function hasZeroValue(): bool
    {
        return false; // Override in implementations that track values
    }
}
