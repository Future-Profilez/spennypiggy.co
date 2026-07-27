<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Stripe\Product;
use Stripe\Stripe;

class ProductController extends Controller
{
    public function index()
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $products = Product::all();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $product = Product::create([
            'name' => $request->input('name'),
            'type' => 'service',
        ]);

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $product = Product::update($id, [
            'name' => $request->input('name'),
        ]);

        return response()->json($product);
    }
}
