<?php

namespace App\Http\Controllers;

use App\Models\GifterCardVerification;
use App\Models\User;
use App\Support\Badges;
use App\Support\GifterToCreator;
use App\Support\SocialHandle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A gifter turning their own account into a creator account.
 *
 * The offer existed before this controller — a card in Account Settings that opened
 * Intercom and asked them to talk to a person — so every conversion was a role flip
 * done by hand, with none of the resets `App\Support\GifterToCreator` performs. That
 * is how a fan photo nobody had ever reviewed could end up on a selling creator's
 * public page.
 *
 * 🚨 THE WRITE IS A POST, AND THE ENTRY POINTS LINK TO THIS PAGE, NEVER TO IT.
 * A GET that converts an account needs nothing to click it — a link prefetch, a hover
 * prerender, an extension's link scanner, an inbox scanning a link — and this is the
 * write that turns somebody into a creator and re-opens their profile for review.
 * Same rule, and the same reason, as `update-profile-lock-status` (7 Sep 2026).
 *
 * 🚨 EMULATION IS REFUSED. `session('emulated_by_admin')` means an admin is browsing
 * as this person; becoming a creator is a declaration only the account holder can
 * make, and a reviewer cannot tell a conversion the owner never asked for from one
 * they did.
 */
class CreatorConversionController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // Already a creator (or an admin) — a page offering a conversion they have
        // already made reads as an offer to do it twice.
        if (! GifterToCreator::isEligibleRole($user)) {
            return redirect()->route('user.show', $user->username);
        }

        return Inertia::render('Auth/BecomeCreator', [
            /*
             * The refusals, as CODES. The page owns the wording per reason — a
             * server-supplied sentence would have to be written for a screen it
             * cannot see, and a test asserting a gate would be matching prose.
             */
            'blockers' => GifterToCreator::blockers($user),
            'prefill' => [
                // Whatever they already picked as a fan, so the picker opens on their
                // own choices rather than empty.
                'creator_category' => Badges::decode($user->creator_category),
                'pride_badges' => Badges::decode($user->pride_badges),
                // Asked for ONLY when the account has none. Every gifter since
                // 31 Aug 2026 answered it at signup; a legacy row can be NULL, and
                // `users.country` is what the shipping zones and the Stripe
                // business-type check read.
                'country' => $user->country,
                'needs_country' => blank($user->country),
                'has_bio' => filled($user->bio),
                'has_avatar' => filled($user->avatar),
            ],
            /*
             * What carries over. Shown because the first thing anybody asks before
             * pressing this is whether they lose their purchases — and the answer is
             * no. The card check is the one worth naming: a gifter who passed the
             * £500 verification did real work that is not thrown away.
             */
            'retains' => [
                'card_verified' => GifterCardVerification::where('user_id', $user->id)
                    ->where('status', 'success')
                    ->exists(),
            ],
            // The one support address, from config rather than typed into the page —
            // the same value the Help Centre's own escalation block reads.
            'support_email' => config('support.contact_email'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (! GifterToCreator::isEligibleRole($user)) {
            return redirect()->route('user.show', $user->username);
        }

        // 🚨 An admin browsing as this person may not make this declaration for them.
        if ($request->session()->get('emulated_by_admin')) {
            throw ValidationException::withMessages([
                'conversion' => 'An account can only be converted by the person who owns it.',
            ]);
        }

        /*
         * 🚨 THE GATES ARE RE-CHECKED HERE, never trusted from the page. The page
         * hides the form when it is handed a blocker, and a hidden form is not a
         * gate — the POST is one curl away.
         *
         * ⚠️ NO HELP TICKET IS OPENED HERE, and that was a deliberate reversal:
         * `SupportTicketController::openHelp` refuses any account whose role is not
         * 1, so a GIFTER — which is every account that can reach this page — cannot
         * open or be given one. A ticket written server-side would be a conversation
         * the person cannot navigate to. The page offers live chat instead, with a
         * real `mailto:` behind it (`App\Support` has no route a role-0 account can
         * use). Reaching this branch at all means a hand-made POST, so the refusal
         * is a sentence rather than a route.
         */
        if (GifterToCreator::blockers($user) !== []) {
            throw ValidationException::withMessages([
                'conversion' => 'This account cannot be converted right now. Open the page again to see why.',
            ]);
        }

        /*
         * Mirrors the creator half of `RegisteredUserController::store`. The handle is
         * required because a creator already cannot go live without an approved one —
         * `ReviewSubmission::missing()` refuses the submit — so asking later only
         * moves the wall.
         */
        $validated = $request->validate([
            'social_platform' => ['required', Rule::in(SocialHandle::platforms())],
            'social_handle' => ['required', 'string', 'max:255'],
            'creator_category' => ['required', 'array', 'min:1', 'max:'.Badges::MAX_INTERESTS],
            'creator_category.*' => [Rule::in(Badges::interestSlugs())],
            'pride_badges' => ['nullable', 'array', 'max:'.Badges::MAX_PRIDE],
            'pride_badges.*' => [Rule::in(Badges::prideSlugs())],
            'referral' => ['nullable', 'string', 'max:255'],
            'country' => [Rule::requiredIf(fn () => blank($user->country)), 'nullable', 'string'],
            'country_code' => ['nullable', 'string', 'max:8'],
            /*
             * 🚨 BOTH REQUIRED, and deliberately not bundled into one box. The terms
             * are re-accepted because a gifter agreed to the SUPPORTER terms and
             * selling is a different relationship; the receipt acknowledgement is the
             * creator-only fact that their e-mail reaches supporters, and it writes
             * the same `creator_email_receipt_acknowledged_at` column signup does.
             *
             * ⚠️ There is no marketing consent here. That record already exists on
             * the account with its own timestamp, source and wording version, and
             * re-asking would overwrite the evidence of what they originally agreed
             * to (see App\Support\MarketingConsent).
             */
            'terms_accepted' => ['accepted'],
            'creator_email_receipt_ack' => ['accepted'],
        ], [
            'creator_category.required' => 'Pick at least one badge so supporters can find you.',
            'social_handle.required' => 'Add a social account so we can check you are really you.',
            'terms_accepted.accepted' => 'Please confirm you agree to the Terms & Conditions as a creator.',
            'creator_email_receipt_ack.accepted' => 'Please confirm you understand your creator e-mail address may appear on supporter transaction records and receipts.',
        ]);

        /*
         * ⚠️ Refused HERE, while the form is still in front of them — the same reason
         * signup checks it before the insert. A handle rejected afterwards can only be
         * dropped in silence, and the creator is then stuck on a review step asking
         * for something they believe they have given us.
         */
        if ($error = SocialHandle::errorFor($validated['social_platform'], $validated['social_handle'])) {
            throw ValidationException::withMessages(['social_handle' => $error]);
        }

        $converted = GifterToCreator::convert($user, [
            'social_platform' => $validated['social_platform'],
            'social_handle' => $validated['social_handle'],
            'creator_category' => $validated['creator_category'],
            'pride_badges' => $validated['pride_badges'] ?? [],
            'referral' => $validated['referral'] ?? null,
            'country' => $validated['country'] ?? null,
            'country_code' => $validated['country_code'] ?? null,
        ]);

        /*
         * `false` means somebody else already did it — a second tab, a double tap.
         * Land them on their dashboard either way: the account IS a creator account.
         */
        return redirect()
            ->route('user.show', $user->username)
            ->with(
                'success',
                $converted
                    ? 'You are a creator now. Add your photo and bio, then submit your profile for review.'
                    : 'Your account is already a creator account.',
            );
    }
}
