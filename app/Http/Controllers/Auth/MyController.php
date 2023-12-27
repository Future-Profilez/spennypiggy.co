<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class MyController extends Controller
{

    public function getUsers()
    {
        // $users = User::where('name','naveen')->orderBy('created_at','DESC')->get();
        $users = User::where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->get();
        return Inertia::render('Lists', [
            'users' => $users
        ]);
    }
}
