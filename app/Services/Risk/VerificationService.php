<?php

namespace App\Services\Risk;

use App\Models\ConfirmationLog;
use App\Models\RiskIdentity;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class VerificationService
{
    private string $otpStore = 'file';

    /**
     * Generate and send OTP for a payment/identity context.
     * For now, we'll simulate sending (log it) or use a simple mailer if available.
     * In prod, integrate with SMS/Email provider.
     */
    public function sendOtp(RiskIdentity $identity, $context = [])
    {
        // Simple 6-digit OTP
        $otp = rand(100000, 999999);
        
        // Store in Cache with 10 min expiry
        // Key: risk_otp_{identity_id}
        $key = 'risk_otp_' . $identity->id;
        Cache::store($this->otpStore)->put($key, $otp, 600);
        
        $email = $context['email'] ?? auth()->user()?->email;
        if (!$email) {
            Log::warning('Risk OTP send skipped (missing email)', [
                'risk_identity_id' => $identity->id,
            ]);
            return false;
        }

        try {
            Mail::send('email.risk-otp', ['otp' => $otp], function ($message) use ($email) {
                $message->to($email)
                    ->from(env('MAIL_FROM_ADDRESS', 'Noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'SPENNY PIGGY'))
                    ->subject('Confirm Your Payment - OTP Code');
            });
            Log::info('Risk OTP email sent', [
                'risk_identity_id' => $identity->id,
            ]);
            return true;
        } catch (\Throwable $e) {
            Log::error('Risk OTP email failed', [
                'risk_identity_id' => $identity->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Verify OTP and log the confirmation.
     */
    public function verifyOtp(RiskIdentity $identity, $otp, $typedConfirmation, $paymentId = null)
    {
        $otp = trim((string) $otp);
        $key = 'risk_otp_' . $identity->id;
        $cachedOtp = Cache::store($this->otpStore)->get($key);
        
        if (!$cachedOtp) {
            return ['ok' => false, 'error' => 'OTP expired. Please request a new code.'];
        }

        if ((string) $cachedOtp !== (string) $otp) {
            return ['ok' => false, 'error' => 'Incorrect OTP. Please try again.'];
        }
        
        // Clear OTP after success to prevent replay
        Cache::store($this->otpStore)->forget($key);
        
        // Create Confirmation Log
        $log = ConfirmationLog::create([
            'payment_id' => $paymentId, // Optional, might be null if pre-check
            'risk_identity_id' => $identity->id,
            'ip_hash' => $identity->ip_hash,
            'device_id_hash' => $identity->device_id_hash,
            'otp_verified' => true,
            'typed_confirmation' => $typedConfirmation,
            'spend_snapshot' => $identity->rollup ? $identity->rollup->toArray() : [],
        ]);
        
        return ['ok' => true, 'log' => $log];
    }
}
