<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');
        if (is_string($email)) {
            $this->merge([
                'email' => Str::lower(trim($email)),
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException|\Illuminate\Http\Exceptions\HttpResponseException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $userData = $this->only('email', 'password');
        // if ($this->getHttpHost() == "uk.spennypiggy.co") {
        //     $userData['country']    =   "GB";
        // } else if (!in_array($this->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000'])) {
        //     $userData[] = fn (Builder $query) => $query->where('country', '!=', 'GB');
        // }
        if (!Auth::attempt($userData, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            // If this is a JSON request (e.g., from frontend expecting JSON response)
            if ($this->expectsJson()) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => trans('auth.failed'),
                        'errors' => [
                            'email' => [trans('auth.failed')]
                        ]
                    ], 422)
                );
            }

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException|\Illuminate\Http\Exceptions\HttpResponseException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());
        $throttleMessage = trans('auth.throttle', [
            'seconds' => $seconds,
            'minutes' => ceil($seconds / 60),
        ]);

        // If this is a JSON request (e.g., from frontend expecting JSON response)
        if ($this->expectsJson()) {
            throw new HttpResponseException(
                response()->json([
                    'message' => $throttleMessage,
                    'errors' => [
                        'email' => [$throttleMessage]
                    ]
                ], 429)
            );
        }

        throw ValidationException::withMessages([
            'email' => $throttleMessage,
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')) . '|' . $this->ip());
    }
}
