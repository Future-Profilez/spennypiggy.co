<?php

namespace App\Exceptions;

use App\Http\Controllers\ErrorController;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if (app()->bound('sentry') && ! app()->environment('local', 'testing')) {
                app('sentry')->captureException($e);
            }
        });
    }

    /**
     * A list of error messages
     *
     * @var array<int, string>
     */
    protected $messages = [
        500 => 'Something went wrong',
        503 => 'Service unavailable',
        404 => 'Not found',
        403 => 'Not authorized',
    ];

    /**
     * Render an exception into an HTTP response.
     *
     * @param  Request  $request
     * @return Response
     *
     * @throws Throwable
     */
    public function render($request, Throwable $e)
    {
        // Ensure ErrorPage renders even if APP_DEBUG is true for specific cases or all production-like errors

        if ($e instanceof ValidationException || $e instanceof AuthenticationException) {
            return parent::render($request, $e);
        }

        // CSRF token mismatch (419): the page's token went stale (expired session,
        // another local app overwrote the XSRF cookie, old tab). Redirect back —
        // Inertia reloads the page with a fresh token so the user can just retry —
        // instead of dead-ending on the ErrorPage.
        if ($e instanceof TokenMismatchException) {
            return redirect()->back()
                ->withInput($request->except(['_token', 'password', 'password_confirmation']))
                ->with('error', 'Your session expired — please try again.');
        }

        $status = 500;
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
        }

        if ($status === 404) {
            $errorController = new ErrorController;

            return $errorController->show404();
        }

        $message = $this->messages[$status] ?? $this->messages[500];

        // Pass actual error message to view for console logging in debug mode or if requested
        $consoleMessage = $e->getMessage();

        Log::error('Unhandled exception', [
            'status' => $status,
            'exception_message' => $e->getMessage(),
            'exception' => $e,
        ]);

        if ($request->header('X-Inertia')) {
            try {
                return Inertia::render('ErrorPage', [
                    'status' => $status,
                    'message' => $message,
                    'consoleMessage' => $consoleMessage,
                ])
                    ->toResponse($request)
                    ->setStatusCode($status);
            } catch (Throwable $t) {
                Log::error('Failed to render Inertia ErrorPage (X-Inertia)', ['error' => $t->getMessage()]);
            }
        }

        if ($request->isMethod('GET') && $request->acceptsHtml()) {
            try {
                return Inertia::render('ErrorPage', [
                    'status' => $status,
                    'message' => $message,
                    'consoleMessage' => $consoleMessage,
                ])
                    ->toResponse($request)
                    ->setStatusCode($status);
            } catch (Throwable $t) {
                Log::error('Failed to render Inertia ErrorPage (HTML)', ['error' => $t->getMessage()]);
            }
        }

        return parent::render($request, $e);
    }
}
