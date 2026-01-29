<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Illuminate\Validation\ValidationException;
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
            //
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
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */


    public function render($request, Throwable $e){
        // Ensure ErrorPage renders even if APP_DEBUG is true for specific cases or all production-like errors
        
        if ($e instanceof ValidationException) {
            return parent::render($request, $e);
        }

        $status = 500;
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
        }

        if ($status === 404) {
            $errorController = new \App\Http\Controllers\ErrorController();
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
                    'consoleMessage' => $consoleMessage
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
                    'consoleMessage' => $consoleMessage
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
