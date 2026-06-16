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
use App\Services\UserProfileService;

class PiggyPotController extends Controller
{
    /**
     * Restrict this controller to creator users only.
     *
     * The Piggy Pot area is only available for creators with role === 1,
     * so any authenticated user without creator privileges must be blocked.
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware(function ($request, $next) {
            if (Auth::user()?->role !== 1) {
                abort(403, 'Unauthorized access.');
            }
            return $next($request);
        });
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PiggyPot::where('user_id', Auth::id())
            ->with(['contributions' => function ($q) {
                $q->where('status', 'paid')
                    ->with('user:id,name,username,avatar,avatar_cdn_modifier,avatar_approved')
                    ->orderBy('created_at', 'desc');
            }])
            ->withSum(['contributions as total_raised' => function ($q) {
                $q->where('status', 'paid');
            }], 'amount')
            ->orderBy('created_at', 'desc');

        if ($request->has('pot_id') && $request->pot_id) {
            $query->where('id', $request->pot_id);
        }

        $piggyPots = $query->get();

        $allPotsList = PiggyPot::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get(['id', 'title']);

        return Inertia::render('PiggyPots/Index', [
            'piggyPots' => $piggyPots,
            'allPotsList' => $allPotsList,
            'filter_pot_id' => $request->pot_id,
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
            'content_file' => 'required|string',
            'content_description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_pinned' => 'boolean',
            'enable_leaderboard' => 'boolean',
            'allow_anonymous' => 'boolean',
        ]);

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

        // SFW gate: scan the cover image; hold for review if it fails moderation.
        if (!empty($piggyPot->cover_media)) {
            \App\Jobs\CheckMediaModeration::dispatch(
                PiggyPot::class,
                $piggyPot->id,
                $piggyPot->cover_media,
                ['status' => 'moderation_hold']
            );
        }

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

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
            'content_file' => 'required|string',
            'content_description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_pinned' => 'boolean',
            'enable_leaderboard' => 'boolean',
            'allow_anonymous' => 'boolean',
            'status' => 'in:active,completed,expired,archived,moderation_hold',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        if (!empty($data['is_pinned']) && $data['is_pinned']) {
            // Unpin others
            PiggyPot::where('user_id', Auth::id())->where('id', '!=', $id)->update(['is_pinned' => false]);
        }

        $piggyPot->update($data);

        // SFW gate: re-scan the cover image on update.
        if (!empty($piggyPot->cover_media)) {
            \App\Jobs\CheckMediaModeration::dispatch(
                PiggyPot::class,
                $piggyPot->id,
                $piggyPot->cover_media,
                ['status' => 'moderation_hold']
            );
        }

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $piggyPot = PiggyPot::where('user_id', Auth::id())->findOrFail($id);
        $piggyPot->delete();

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot deleted successfully');
    }
}
