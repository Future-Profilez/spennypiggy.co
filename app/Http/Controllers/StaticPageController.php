<?php

namespace App\Http\Controllers;

use App\Support\Incentives;
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

    /**
     * 🚨 A PUBLISHED TERMS PAGE NEVER 404s, EVEN WHEN ITS SCHEME IS RETIRED
     * (11 Sep 2026, simplification programme §6 — the terms-page exception).
     *
     * Anybody who agreed to these is entitled to read what they agreed to, and
     * a dead link in somebody's e-mail is not acceptable. The WORDING is never
     * rewritten — it states what was agreed on the day. What is added is a
     * dated CLOSED notice above it, from `closed_on` in the scheme's own
     * config, so the reader knows the programme is shut without the terms
     * themselves changing.
     *
     * ⚠️ `closedOn()` returns null while the scheme is live, and the page draws
     * no notice — so switching a scheme back on removes it with no edit here.
     */
    public function fastStartBonusTerms()
    {
        return Inertia::render('Legal/FastStartBonusTerms', [
            'closedOn' => Incentives::closedOn('fast_start'),
        ]);
    }

    public function growthBonusTerms()
    {
        return Inertia::render('Legal/GrowthBonusTerms', [
            'closedOn' => Incentives::closedOn('growth_bonus'),
        ]);
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
