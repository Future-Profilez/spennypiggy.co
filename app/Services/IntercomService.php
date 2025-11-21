<?php

namespace App\Services;

use App\Models\User;

class IntercomService
{
    public function buildSettings(?User $user): array
    {
        $enabled = (bool) config('services.intercom.enabled');
        $appId = config('services.intercom.app_id') ?: 'xomg14o9';
        
        if (!$enabled) {
            return ['enabled' => false];
        }

        $settings = [
            'enabled' => true,
            'appId' => $appId,
            'boot' => [
                'api_base' => 'https://api-iam.intercom.io',
                'app_id' => $appId,
                'custom_launcher_selector' => '.livechat',
            ],
        ];

        if (!$user) {
            // For anonymous users, still show Intercom but without user data (like your Footer)
            return $settings;
        }

        $secret = config('services.intercom.identity_secret');
        $userId = (string) $user->id;
        $userHash = $secret ? hash_hmac('sha256', $userId, $secret) : null;

        $userBoot = [
            'name' => $user->name ?? $user->username ?? null,
            'email' => $user->email,
            'created_at' => optional($user->created_at)->timestamp,
            'user_id' => $userId,
        ];
        if ($userHash) {
            $userBoot['user_hash'] = $userHash;
        }
        $settings['boot'] = array_merge($settings['boot'], $userBoot);

        // Add creator-specific custom attributes for better support context
        $isCreator = $this->isCreator($user);
        if ($isCreator) {
            $customAttributes = [];
            
            // Safely add custom attributes
            if ($user->username) {
                $customAttributes['profile_url'] = url('/' . $user->username);
            }
            
            $customAttributes['is_creator'] = true;
            $customAttributes['account_status'] = ($user->suspended_account ?? false) ? 'suspended' : 'active';
            $customAttributes['role'] = $user->role ?? null;
            
            // Add counts if available
            try {
                if (method_exists($user, 'wishItems')) {
                    $customAttributes['wishlist_items_count'] = $user->wishItems()->count();
                }
            } catch (\Exception $e) {
                // Ignore relationship errors
            }
            
            $settings['boot']['custom_attributes'] = $customAttributes;
        }

        return $settings;
    }

    private function isCreator(User $user): bool
    {
        // Check multiple ways a user could be identified as a creator
        // First check if user has is_creator attribute (safely)
        if (isset($user->is_creator) && $user->is_creator) {
            return true;
        }
        
        // Check role (both string and numeric)
        if ($user->role === 'creator' || $user->role == 1) {
            return true;
        }
        
        // Check if user has wishlist items (indicates creator activity)
        try {
            if (method_exists($user, 'wishItems') && $user->wishItems()->exists()) {
                return true;
            }
        } catch (\Exception $e) {
            // Ignore errors from relationship checks
        }
        
        // Check if user has memberships (indicates creator activity)
        try {
            if (method_exists($user, 'memberships') && $user->memberships()->exists()) {
                return true;
            }
        } catch (\Exception $e) {
            // Ignore errors from relationship checks
        }
        
        return false;
    }

    private function isAdmin(User $user): bool
    {
        // Check both string and numeric role values
        $role = $user->role ?? '';
        return in_array($role, ['admin', 'staff', 'support']) || $role == 0; // Assuming 0 is admin
    }
}