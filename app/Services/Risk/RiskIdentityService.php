<?php

namespace App\Services\Risk;

use App\Models\RiskIdentity;

class RiskIdentityService
{
    /**
     * Resolve or create a RiskIdentity based on provided context.
     * The logic here is simplified: if any strong identifier matches, we link it.
     * In reality, this might be more complex (fuzzy matching, etc.), but for now exact match on hashes.
     * Prioritize: Card Fingerprint > Device ID > Email > IP (IP is weak, maybe don't link solely on IP).
     *
     * @param  array  $context  [email, ip, device_id, card_fingerprint]
     */
    public function resolveIdentity(array $context): RiskIdentity
    {
        $cardFingerprint = $context['card_fingerprint'] ?? null;
        $emailHash = isset($context['email']) ? $this->hash($context['email']) : null;
        $deviceIdHash = isset($context['device_id']) ? $this->hash($context['device_id']) : null;
        $ipHash = isset($context['ip']) ? $this->hash($context['ip']) : null;

        // Try to find existing identity by strong signals
        $identity = null;

        if ($cardFingerprint) {
            $identity = RiskIdentity::where('card_fingerprint', $cardFingerprint)->first();
        }

        if (! $identity && $deviceIdHash) {
            $identity = RiskIdentity::where('device_id_hash', $deviceIdHash)->first();
        }

        if (! $identity && $emailHash) {
            $identity = RiskIdentity::where('email_hash', $emailHash)->first();
        }

        // IP is too broad to link identities solely on it usually, but for guest throttling it might be used.
        // For now, let's treat IP as a weak signal. If we don't find any identity, we create a new one.
        // If we find an identity by IP, do we link? Maybe not for "account takeover" risk, but for "velocity" risk yes.
        // The spec implies we track "identity" which might be a device/IP combo.
        // Let's stick to: if no strong signal, check IP.
        if (! $identity && $ipHash) {
            $identity = RiskIdentity::where('ip_hash', $ipHash)->first();
        }

        if (! $identity) {
            $identity = RiskIdentity::create([
                'card_fingerprint' => $cardFingerprint,
                'email_hash' => $emailHash,
                'device_id_hash' => $deviceIdHash,
                'ip_hash' => $ipHash,
                'is_guest' => $context['is_guest'] ?? true,
            ]);

            // Create empty rollup
            $identity->rollup()->create([]);
        } else {
            // Update missing fields if we found an identity
            // e.g. if we found by email but now have a card fingerprint, add it.
            // This "merging" logic is critical.
            $updates = [];
            if ($cardFingerprint && ! $identity->card_fingerprint) {
                $updates['card_fingerprint'] = $cardFingerprint;
            }
            if ($emailHash && ! $identity->email_hash) {
                $updates['email_hash'] = $emailHash;
            }
            if ($deviceIdHash && ! $identity->device_id_hash) {
                $updates['device_id_hash'] = $deviceIdHash;
            }
            if ($ipHash && ! $identity->ip_hash) {
                $updates['ip_hash'] = $ipHash;
            } // Always update IP? or just fill if empty?
            if (($context['is_guest'] ?? null) === false && ($identity->is_guest ?? true) === true) {
                $updates['is_guest'] = false;
            }
            // IP changes frequently, so maybe we don't "lock" it. But the spec says "store hashes".
            // Let's just fill if empty for now to build the profile.

            if (! empty($updates)) {
                $identity->update($updates);
            }
        }

        return $identity;
    }

    private function hash($value)
    {
        return hash('sha256', strtolower(trim($value)));
    }
}
