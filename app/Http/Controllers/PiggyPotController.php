<?php

namespace App\Http\Controllers;

use App\Models\PiggyPot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Uploadcare;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class PiggyPotController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $piggyPots = PiggyPot::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('PiggyPots/Index', [
            'piggyPots' => $piggyPots,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_amount' => 'required|numeric|min:1',
            'currency' => 'required|string|max:3',
            'cover_media' => 'nullable|string',
            'content_file' => 'nullable|string',
            'content_description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_pinned' => 'boolean',
            'enable_leaderboard' => 'boolean',
            'allow_anonymous' => 'boolean',
        ]);

        $validator->after(function ($validator) use ($request) {
            if (empty($request->content_file) && empty($request->content_description)) {
                $validator->errors()->add('content_file', 'You must provide either a Digital Reward file or a Content Description.');
            }
        });

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $data['user_id'] = Auth::id();

        if (!empty($data['is_pinned']) && $data['is_pinned']) {
            // Unpin others
            PiggyPot::where('user_id', Auth::id())->update(['is_pinned' => false]);
        }

        $piggyPot = PiggyPot::create($data);

        return redirect()->back()->with('success', 'Piggy Pot created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $piggyPot = PiggyPot::where('user_id', Auth::id())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_amount' => 'required|numeric|min:1',
            'currency' => 'required|string|max:3',
            'cover_media' => 'nullable|string',
            'content_file' => 'nullable|string',
            'content_description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_pinned' => 'boolean',
            'enable_leaderboard' => 'boolean',
            'allow_anonymous' => 'boolean',
            'status' => 'in:active,completed,expired,archived,moderation_hold',
        ]);

        $validator->after(function ($validator) use ($request) {
            if (empty($request->content_file) && empty($request->content_description)) {
                $validator->errors()->add('content_file', 'You must provide either a Digital Reward file or a Content Description.');
            }
        });

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        if (!empty($data['is_pinned']) && $data['is_pinned']) {
            // Unpin others
            PiggyPot::where('user_id', Auth::id())->where('id', '!=', $id)->update(['is_pinned' => false]);
        }

        $piggyPot->update($data);

        return redirect()->back()->with('success', 'Piggy Pot updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $piggyPot = PiggyPot::where('user_id', Auth::id())->findOrFail($id);
        $piggyPot->delete();

        return redirect()->back()->with('success', 'Piggy Pot deleted successfully');
    }
}
