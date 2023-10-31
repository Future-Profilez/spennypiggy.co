<?php 
namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MyController extends Controller {

  public function getName(){ 
    return Inertia::render('Auth/ResetPassword');
  } 
}


