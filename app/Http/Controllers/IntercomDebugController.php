<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\IntercomService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IntercomDebugController extends Controller
{
    public function debug(Request $request)
    {
        $intercomService = new IntercomService();
        
        // Test with different scenarios
        $scenarios = [];
        
        // Scenario 1: No user (anonymous)
        $scenarios['anonymous'] = $intercomService->buildSettings(null);
        
        // Scenario 2: Any user
        $anyUser = User::first();
        $scenarios['any_user'] = $anyUser ? $intercomService->buildSettings($anyUser) : null;
        
        // Scenario 3: Role 1 user (creator)
        $creatorUser = User::where('role', 1)->first();
        $scenarios['creator_user'] = $creatorUser ? $intercomService->buildSettings($creatorUser) : null;
        
        // Scenario 4: Role 0 user (admin)
        $adminUser = User::where('role', 0)->first();
        $scenarios['admin_user'] = $adminUser ? $intercomService->buildSettings($adminUser) : null;
        
        // Configuration info
        $config = [
            'services.intercom' => config('services.intercom'),
            'env_vars' => [
                'INTERCOM_ENABLED' => env('INTERCOM_ENABLED'),
                'INTERCOM_APP_ID' => env('INTERCOM_APP_ID'),
                'INTERCOM_IDENTITY_VERIFICATION_SECRET' => env('INTERCOM_IDENTITY_VERIFICATION_SECRET') ? '[SET]' : '[NOT SET]',
            ]
        ];
        
        return Inertia::render('IntercomDebug', [
            'scenarios' => $scenarios,
            'config' => $config,
            'users' => [
                'any_user' => $anyUser ? [
                    'id' => $anyUser->id,
                    'name' => $anyUser->name,
                    'role' => $anyUser->role,
                ] : null,
                'creator_user' => $creatorUser ? [
                    'id' => $creatorUser->id,
                    'name' => $creatorUser->name,
                    'role' => $creatorUser->role,
                ] : null,
                'admin_user' => $adminUser ? [
                    'id' => $adminUser->id,
                    'name' => $adminUser->name,
                    'role' => $adminUser->role,
                ] : null,
            ]
        ]);
    }
}