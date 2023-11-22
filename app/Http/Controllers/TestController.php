<?php

namespace App\Http\Controllers;

use App\Mail\Welcome;
use App\Models\User;
use App\StripeControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class TestController extends Controller
{

    /**
     * Search Stripe Customer
     *
     * @return mixed
     */
    public function stripeSearch(){
        $query = "email:'pradeep@fpdemo.com'";
        $search = StripeControl::searchCustomer($query);
        return response()->json($search);
    }

    public function testEmail(){
        $user = User::find(1);
        $resp = Mail::to($user)->send(new Welcome([
            "name" => $user->name,
            "uuid" => $user->uuid
        ]));
        // $resp = $user->update(["password" => Hash::make("Mega-000")]);
        return response()->json([
            "success" => true,
            "resp" => $resp
        ]);
    }
}
