<?php

namespace App;

use App\Mail\Checkout;
use App\Mail\verifyEmail;
use App\Mail\Welcome;
use App\Mail\Wishlist;
use App\Models\AppService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Exception\TransportException;

class EmailService
{


    /**
     * Send welcome email to new users
     * @param array $data Email Dynamic Data
     * @return void
     */
    public static function welcome($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new Welcome($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function saveWishlist($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new Wishlist($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function checkOutUser($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new Checkout($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public function verifyUserEmail($data)
    {
        try {
            \Log::info('3');

            Mail::to($data['to'])
                ->send(new verifyEmail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }
}
