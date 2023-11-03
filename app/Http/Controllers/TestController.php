<?php

namespace App\Http\Controllers;

use App\StripeControl;
use Illuminate\Http\Request;

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
}
