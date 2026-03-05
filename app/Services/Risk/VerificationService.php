<?php

namespace App\Services\Risk;

use App\Models\ConfirmationLog;
use App\Models\Payment;
use App\Models\RiskIdentity;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VerificationService
{
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
        Cache::put($key, $otp, 600);
        
        // Log for debugging/development (remove in prod or use safe logging)
        Log::info("Generated OTP for Identity {$identity->id}: {$otp}");
        
        // TODO: Send via Email/SMS based on available contact info in Identity or User linked
        // If guest, we might need email passed in context
        $email = $context['email'] ?? null;
        if ($email) {
            // \Mail::to($email)->send(new \App\Mail\RiskOtpMail($otp));
            Log::info("Simulating OTP email to {$email}");
        }
        
        return true;
    }

    /**
     * Verify OTP and log the confirmation.
     */
    public function verifyOtp(RiskIdentity $identity, $otp, $typedConfirmation, $paymentId = null)
    {
        $key = 'risk_otp_' . $identity->id;
        $cachedOtp = Cache::get($key);
        
        if (!$cachedOtp || (string)$cachedOtp !== (string)$otp) {
            return false;
        }
        
        // Clear OTP after success to prevent replay
        Cache::forget($key);
        
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
        
        return $log;
    }
}
