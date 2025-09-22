<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
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

        $status = 500;
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
        }

        // Use the new enhanced 404 page for 404 errors
        if ($status === 404) {
            $errorController = new \App\Http\Controllers\ErrorController();
            return $errorController->show404();
        }

        // Render Inertia ErrorPage for Inertia requests
        if ($request->header('X-Inertia')) {
            return Inertia::render('ErrorPage', [
                'status' => $status,
                'message' => $e->getMessage()
            ])
                ->toResponse($request)
                ->setStatusCode($status);
        }

        // Render Inertia ErrorPage even for full-page browser loads
        if ($request->isMethod('GET') && $request->acceptsHtml()) {
            return Inertia::render('ErrorPage', [
                'status' => $status,
                'message' => $e->getMessage()
            ])
                ->toResponse($request)
                ->setStatusCode($status);
        }
        // Fallback for API or JSON
        return parent::render($request, $e ?? 'Something went wrong');
    }



}
