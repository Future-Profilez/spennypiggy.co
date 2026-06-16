<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PolicyNotificationController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/PolicyNotifications', [
            'currentSettings' => [
                'last_terms_update' => Setting::getValue('last_terms_update', '2026-04-23 00:00:00'),
                'updated_terms_list' => json_decode(Setting::getValue('updated_terms_list', '[]'), true) ?? [],
            ],
        ]);
    }

    public function trigger(Request $request)
    {
        $request->validate([
            'updated_terms_list' => 'required|array|min:1',
            'updated_terms_list.*' => 'string',
            'trigger_date' => 'nullable|date',
        ]);

        $date = $request->trigger_date
            ? date('Y-m-d H:i:s', strtotime($request->trigger_date))
            : now()->toDateTimeString();

        Setting::setValue('last_terms_update', $date);
        Setting::setValue('updated_terms_list', json_encode($request->updated_terms_list));

        return back()->with('success', 'Policy change notification triggered. All existing users will see the popup on next visit.');
    }

    public function deactivate()
    {
        // Push the update date far into the past so no one sees the popup
        Setting::setValue('last_terms_update', '2000-01-01 00:00:00');
        Setting::setValue('updated_terms_list', '[]');

        return back()->with('success', 'Policy change notification deactivated.');
    }
}
