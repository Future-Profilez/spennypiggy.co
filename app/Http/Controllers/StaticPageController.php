<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class StaticPageController extends Controller
{
    public function terms()
    {
        return Inertia::render('Legal/TermsOfService');
    }

    public function creatorAgreement()
    {
        return Inertia::render('Legal/CreatorAgreement');
    }

    public function supporterTerms()
    {
        return Inertia::render('Legal/SupporterTerms');
    }

    public function creatorSupporterContract()
    {
        return Inertia::render('Legal/CreatorSupporterContract');
    }

    public function morAgreement()
    {
        return Inertia::render('Legal/MorAgreement');
    }

    public function paymentsPolicy()
    {
        return Inertia::render('Legal/PaymentsPolicy');
    }

    public function paidTasksTerms()
    {
        return Inertia::render('Legal/PaidTasksTerms');
    }

    public function returnPolicy()
    {
        return Inertia::render('Legal/ReturnPolicy');
    }

    public function acceptTerms(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->terms_accepted_at = now();
            $user->save();
        }
        return response()->json(['success' => true]);
    }
}
