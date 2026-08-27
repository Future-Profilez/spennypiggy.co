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
use Sentry\State\Scope;
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
    /**
     * Request attribute key the per-request reference is memoised under.
     */
    protected const REFERENCE_KEY = 'sp_error_reference';

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
                // 🚨 The reference is attached HERE, not in render(), because
                // report() runs first — a Sentry event captured without the tag
                // can never be found by the string the user is holding.
                \Sentry\configureScope(function (Scope $scope) {
                    $scope->setTag('reference', $this->reference());
                });

                app('sentry')->captureException($e);
            }
        });
    }

    /**
     * The support reference shown on the error page.
     *
     * 🚨 IT IS GENERATED HERE, ON THE SERVER, AND NOWHERE ELSE. The page used to
     * build its own in the browser, so the only trace of it was the pixels the
     * user was looking at — a person who copied it and emailed support handed
     * over a string that appears in no log and no Sentry event, and support had
     * nothing to search. Generating it server-side puts the same value in three
     * places at once: the log line, the Sentry tag, and the page.
     *
     * Memoised per request — one fault, one reference. report() and render()
     * must not produce two different strings for the same exception.
     *
     * 🚨 THE MEMO LIVES ON THE REQUEST, NOT ON $this. This class is resolved as
     * a SINGLETON, and Vapor reuses a warm Lambda container across invocations,
     * so a property would have pinned the FIRST reference for every later error
     * that container served — different users, different faults, one string,
     * and support looking at whichever exception happened to be first. Locally
     * it would never reproduce: one request per process, always correct.
     */
    protected function reference(): string
    {
        $request = request();

        if (! $request->attributes->has(self::REFERENCE_KEY)) {
            $request->attributes->set(self::REFERENCE_KEY, sprintf(
                'SP-%s-%s-%s',
                now()->format('ymd'),
                now()->format('Hi'),
                strtoupper(bin2hex(random_bytes(2)))
            ));
        }

        return $request->attributes->get(self::REFERENCE_KEY);
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

        $e = $this->prepareException($e);

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

        $reference = $this->reference();

        /*
         * A 4xx IS THE CALLER'S FAULT, NOT THE APP'S, AND MUST NOT BE AN ALERT.
         *
         * Everything rendered here used to be logged at error level. That was
         * harmless while the logs went nowhere - but with the `sentry` channel in
         * the stack, every 405 from a bot POSTing to `/`, every 403, every expired
         * CSRF token becomes an issue in the stream, and those arrive constantly
         * and forever. The one 500 that matters would sit among them.
         *
         * 5xx keeps error level: that IS the app failing. 4xx drops to warning, so
         * it is still in the log with its reference and status - just not something
         * anyone gets woken for.
         */
        $context = [
            'reference' => $reference,
            'status' => $status,
            'exception_message' => $e->getMessage(),
            'exception' => $e,
        ];

        if ($status >= 500) {
            Log::error('Unhandled exception', $context);
        } else {
            Log::warning('Client error response', $context);
        }

        if ($request->header('X-Inertia')) {
            try {
                return Inertia::render('ErrorPage', [
                    'status' => $status,
                    'message' => $message,
                    'consoleMessage' => $consoleMessage,
                    'reference' => $reference,
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
                    'reference' => $reference,
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
