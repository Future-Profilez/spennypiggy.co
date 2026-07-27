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

    public function usAddendum()
    {
        return Inertia::render('Legal/UsAddendum');
    }

    public function copyrightPolicy()
    {
        return Inertia::render('Legal/CopyrightPolicy');
    }

    public function fastStartBonusTerms()
    {
        return Inertia::render('Legal/FastStartBonusTerms');
    }

    public function contentPaymentFramework()
    {
        return Inertia::render('Legal/ContentPaymentFramework');
    }

    public function howSpennyPiggyWorks()
    {
        return Inertia::render('howitworks/HowSpennyPiggyWorks');
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
