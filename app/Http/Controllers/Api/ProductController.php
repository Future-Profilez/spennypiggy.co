<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Product;


class ProductController extends Controller
{
    public function index()
    {
        Stripe::setApiKey(env('STRIPE_SECRET'));

        $products = Product::all();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        Stripe::setApiKey(env('STRIPE_SECRET'));

        $product = Product::create([
            'name' => $request->input('name'),
            'type' => 'service',
        ]);

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        Stripe::setApiKey(env('STRIPE_SECRET'));

        $product = Product::update($id, [
            'name' => $request->input('name'),
        ]);

        return response()->json($product);
    }
}
