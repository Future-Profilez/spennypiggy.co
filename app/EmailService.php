<?php

namespace App;

use App\Mail\Checkout;
use App\Mail\CheckoutToUser;
use App\Mail\ForgotPassEmail;
use App\Mail\MemberMail;
use App\Mail\RenewMail;
use App\Mail\SendAdminIntroMail;
use App\Mail\SendAvatarRestrictionMail;
use App\Mail\SendCoverRestrictionMail;
use App\Mail\SendRestrictionMail;
use App\Mail\SendTipJarMailToUser;
use App\Mail\ShopBuyedMail;
use App\Mail\ShopBuyedMailUser;
use App\Mail\SubscriptionFailedMail;
use App\Mail\SubscriptionMail;
use App\Mail\SubsMail;
use App\Mail\ThankYouMailAdmin;
use App\Mail\ThankyouUser;
use App\Mail\TipJarMail;
use App\Mail\VerifyEmail;
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

    public static function checkOutUser($data, $anon, $surprise, $message, $anonname,$symbol)
    {
        try {
            $emailData = [
                'to' => $data->payment->owner->email,
                'name' => $data->payment->owner->name,
                'username' => $data->payment->owner->username,
                'phone' => $data->payment->owner->phone,
                'email' => $data->payment->owner->email,
                'uuid' => $data->payment->owner->uuid,
            ];

            Mail::to($emailData['to'])
                ->send(new Checkout($data, $anon, $surprise, $message, $anonname,$symbol));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function shopBuyed($data, $anon,$symbol)
    {
        try {
            $emailData = [
                'to' => $data->shop->user->email,
                'name' => $data->shop->user->name,
                'username' => $data->shop->user->username,
                'phone' => $data->shop->user->phone,
                'email' => $data->shop->user->email,
                'uuid' => $data->shop->user->uuid,
            ];

            Mail::to($emailData['to'])
                ->send(new ShopBuyedMail($data, $anon,$symbol));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function checkOutToUser($data,$curr)
    {
        try {
            $emailData = [
                'to' => $data->user->email,
                'name' => $data->user->name,
                'username' => $data->user->username,
                'phone' => $data->user->phone,
                'email' => $data->user->email,
                'uuid' => $data->user->uuid,
            ];
            Mail::to($emailData['to'])
                ->send(new CheckoutToUser($data,$curr));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function shopBuyedUser($data,$curr)
    {
        try {
            $emailData = [
                'to' => $data->user->email,
                'name' => $data->user->name,
                'username' => $data->user->username,
                'phone' => $data->user->phone,
                'email' => $data->user->email,
                'uuid' => $data->user->uuid,
            ];
            Mail::to($emailData['to'])
                ->send(new ShopBuyedMailUser($data,$curr));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    public static function sendSubscriptionMail($value)
    {
        try {

            $data = [
                'to' => $value->user->email,
                'name' => $value->user->name,
                'username' => $value->user->username,
                'phone' => $value->user->phone,
                'email' => $value->user->email,
                'uuid' => $value->user->uuid,
            ];

            Mail::to($data['to'])
                ->send(new SubscriptionMail($value));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    public static function verifyUserEmail($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new VerifyEmail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function ForgotPassword($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new ForgotPassEmail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function thankyouUser($payment)
    {
        try {
            $emailData = [
                'to' => $payment->payment->user->email,
                'name' => $payment->payment->user->name,
                'username' => $payment->payment->user->username,
                'phone' => $payment->payment->user->phone,
                'email' => $payment->payment->user->email,
                'uuid' => $payment->payment->user->uuid,
            ];
            Mail::to($emailData['to'])->send(new ThankyouUser($payment));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendRenewMail($data,$type,$module)
    {
        try {

            Mail::to($data['email'])->send(new RenewMail($data,$type,$module));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendSubscribedMail($data)
    {
        try {

            Mail::to($data->wish_item->user->email)->send(new SubsMail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    public static function sendMembershipMail($data)
    {
        try {

            Mail::to($data->membership->user->email)->send(new MemberMail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendTipJarSubscribedMail($data,$symbol)
    {
        try {
            Mail::to($data->tipGoal->user->email)->send(new TipJarMail($data,$symbol));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendTipJarToUser($data,$symbol,$amount)
    {
        try {
            Mail::to($data->guest_email)->send(new SendTipJarMailToUser($data,$symbol,$amount));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function subscriptionFailed($sub)
    {
        try {
            Mail::to($sub->guest_email)->send(new SubscriptionFailedMail($sub));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendRestrictionMail($wish)
    {
        try {
            Mail::to($wish->user->email)->send(new SendRestrictionMail($wish));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    public static function sendAvatarRestrictionMail($email)
    {
        try {
            Mail::to($email)->send(new SendAvatarRestrictionMail());
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendCoverRestrictionMail($email)
    {
        try {
            Mail::to($email)->send(new SendCoverRestrictionMail());
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendIntroApprovingMailAdmin($intro)
    {
        try {
            Mail::to("jack@spennypiggy.co")->send(new SendAdminIntroMail($intro));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendThankyouAdmin($pay)
    {
        try {
            Mail::to("jack@spennypiggy.co")->send(new ThankYouMailAdmin($pay));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }
}
