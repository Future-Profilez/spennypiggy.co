<?php

namespace App\Http\Controllers;

class AppController extends Controller
{
    public function appCheck()
    {
        return response()->json(['status' => 'ok']);
    }
}
