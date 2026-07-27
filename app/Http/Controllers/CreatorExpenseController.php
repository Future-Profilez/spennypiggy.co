<?php

namespace App\Http\Controllers;

use App\Models\CreatorExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CreatorExpenseController extends Controller
{
    public function index(Request $request)
    {
        $expenses = CreatorExpense::where('user_id', Auth::id())
            ->when($request->input('search'), function ($query, $search) {
                $query->where('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            })
            ->latest('expense_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Creator/Financial/Expenses', [
            'expenses' => $expenses,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'expense_date' => 'required|date',
            'description' => 'nullable|string|max:255',
            'receipt_url' => 'nullable|string|url',
        ]);

        $validated['currency'] = strtoupper(Auth::user()->default_currency ?? 'GBP');

        $expense = new CreatorExpense($validated);
        $expense->user_id = Auth::id();
        $expense->save();

        return back()->with('success', 'Expense logged successfully.');
    }

    public function update(Request $request, CreatorExpense $expense)
    {
        if ($expense->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'expense_date' => 'required|date',
            'description' => 'nullable|string|max:255',
            'receipt_url' => 'nullable|string|url',
        ]);

        $validated['currency'] = strtoupper(Auth::user()->default_currency ?? 'GBP');

        $expense->update($validated);

        return back()->with('success', 'Expense updated successfully.');
    }

    public function destroy(CreatorExpense $expense)
    {
        if ($expense->user_id !== Auth::id()) {
            abort(403);
        }

        $expense->delete();

        return back()->with('success', 'Expense deleted successfully.');
    }
}
