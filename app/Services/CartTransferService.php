<?php

namespace App\Services;

use App\Models\UserCart;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CartTransferService
{
    /**
     * Transfer guest cart items to authenticated user's cart
     * 
     * @param User $user The authenticated user
     * @param string $deviceId The guest's device ID
     * @return array Transfer results with counts and any issues
     */
    public function transferGuestCartToUser(User $user, string $deviceId): array
    {
        Log::info('Cart transfer started', [
            'user_id' => $user->id,
            'username' => $user->username,
            'device_id' => $deviceId
        ]);

        try {
            DB::beginTransaction();

            // Find guest cart items for this device
            $guestCartItems = UserCart::where('device_id', $deviceId)
                ->whereNull('user_id')
                ->with(['wish', 'owner'])
                ->get();

            if ($guestCartItems->isEmpty()) {
                Log::info('No guest cart items found to transfer', ['device_id' => $deviceId]);
                return [
                    'transferred_count' => 0,
                    'merged_count' => 0,
                    'issues' => []
                ];
            }

            Log::info('Found guest cart items', [
                'device_id' => $deviceId,
                'items_count' => $guestCartItems->count()
            ]);

            $transferredCount = 0;
            $mergedCount = 0;
            $issues = [];

            foreach ($guestCartItems as $guestItem) {
                try {
                    // Check if user already has this item in their cart
                    $existingUserItem = UserCart::where('user_id', $user->id)
                        ->where('wish_item_id', $guestItem->wish_item_id)
                        ->where('owner_id', $guestItem->owner_id)
                        ->first();

                    if ($existingUserItem) {
                        // Merge quantities - add guest quantity to existing user cart item
                        $existingUserItem->quantity += $guestItem->quantity;
                        $existingUserItem->amount = $guestItem->amount; // Update to latest amount
                        $existingUserItem->save();

                        // Delete the guest cart item since we merged it
                        $guestItem->delete();
                        
                        $mergedCount++;
                        Log::info('Merged guest cart item into existing user cart item', [
                            'user_id' => $user->id,
                            'wish_item_id' => $guestItem->wish_item_id,
                            'old_quantity' => $existingUserItem->quantity - $guestItem->quantity,
                            'added_quantity' => $guestItem->quantity,
                            'new_quantity' => $existingUserItem->quantity
                        ]);
                    } else {
                        // Transfer the guest item to the user
                        $guestItem->user_id = $user->id;
                        $guestItem->device_id = null; // Clear device_id since it's now associated with a user
                        $guestItem->save();
                        
                        $transferredCount++;
                        Log::info('Transferred guest cart item to user', [
                            'user_id' => $user->id,
                            'wish_item_id' => $guestItem->wish_item_id,
                            'quantity' => $guestItem->quantity
                        ]);
                    }
                } catch (\Exception $e) {
                    $issues[] = [
                        'guest_item_id' => $guestItem->id,
                        'wish_item_id' => $guestItem->wish_item_id,
                        'error' => $e->getMessage()
                    ];
                    Log::error('Failed to transfer guest cart item', [
                        'guest_item_id' => $guestItem->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            DB::commit();

            $result = [
                'transferred_count' => $transferredCount,
                'merged_count' => $mergedCount,
                'issues' => $issues
            ];

            Log::info('Cart transfer completed', array_merge($result, [
                'user_id' => $user->id,
                'device_id' => $deviceId
            ]));

            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cart transfer failed with exception', [
                'user_id' => $user->id,
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'transferred_count' => 0,
                'merged_count' => 0,
                'issues' => [['error' => 'Transfer failed: ' . $e->getMessage()]]
            ];
        }
    }

    /**
     * Get device ID from request headers or session/cookie
     * Since device ID generation requires client-side info (screen, platform), 
     * we need the device ID to be passed from the frontend during login
     * 
     * @param \Illuminate\Http\Request $request
     * @return string|null
     */
    public function extractDeviceIdFromRequest($request): ?string
    {
        try {
            // Try to get device ID from request (form data, query param, or header)
            $deviceId = $request->input('device_id') 
                       ?? $request->query('device_id')
                       ?? $request->header('X-Device-ID')
                       ?? $request->cookie('device_id');
            
            if (!empty($deviceId)) {
                return $deviceId;
            }
            
            // Fallback: try to reconstruct from headers (less reliable)
            $userAgent = $request->header('User-Agent', '');
            $platform = $request->header('X-Platform', '');
            $screenWidth = $request->header('X-Screen-Width', '');
            $screenHeight = $request->header('X-Screen-Height', '');
            
            if (!empty($userAgent)) {
                // Match frontend logic: ${userAgent}_${platform}_${screenWidth}_${screenHeight}
                $deviceString = $userAgent . '_' . $platform . '_' . $screenWidth . '_' . $screenHeight;
                return base64_encode($deviceString);
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Failed to extract device ID from request', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
