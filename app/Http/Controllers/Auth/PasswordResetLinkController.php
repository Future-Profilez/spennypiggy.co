<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\ForgotPassword;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    // public function store(Request $request): RedirectResponse {
    //     $request->validate([
    //         'email' => 'required|email',
    //     ]);

    //     try {
    //         $status = Password::sendResetLink(
    //             $request->only('email')
    //         );

    //         switch ($status) {
    //             case Password::RESET_LINK_SENT:
    //                 // Password reset link sent successfully
    //                 return back()->with('status', __($status));

    //             case Password::INVALID_USER:
    //                 // User with the provided email not found
    //                 return back()->with('error', 'Email address not found.');

    //             case Password::RESET_THROTTLED:
    //                 // Too many password reset requests for this email
    //                 return back()->with('error', 'Too many password reset requests. Please wait a while before trying again.');

    //             case Password::INVALID_TOKEN:
    //                 // Invalid or expired password reset token
    //                 return back()->with('error', 'Invalid or expired password reset token. Please request a new one.');

    //             default:
    //                 // Handle any other cases
    //                 throw new \Exception("Password reset failed with status: $status");
    //         }
    //     } catch (\Exception $e) {
    //         // dd($e);
    //         // Handle exceptions, log the error, and provide a generic error message to the user
    //         return back()->with('error', 'An error occurred during the password reset process. Please try again later.');
    //     }
    // }


    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);
        try {
            $email = $request->input('email');
            $user = User::where('email', $email)->first();
            if (!empty($user)) {
                ForgotPassword::dispatch($user);
                return back()->with('success', 'Please check your email inbox');
            } else {
                return back()->with('error', 'Email not match.');
            }
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred during the password reset process. Please try again later.');
        }
    }

    public function forgotPasswordPage($uuid)
    {
        try {
            return Inertia::render('Auth/ConfirmPassword', [
                'uuid' => $uuid,
            ]);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function changePassword(Request $request, $uuid)
    {
        $request->validate([
            'password' => 'required|min:6',
            'confirmpassword' => 'required|same:password|min:6',
        ]);
        try {
            $user = User::where('uuid', $uuid)->first();
            if (!empty($user)) {
                $user->password = Hash::make($request->password);
                $user->save();
                return redirect(route('login'))->with('success', 'Password updated successfully');
            } else {
                return back()->with('error', 'Unable to update password');
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }
}
