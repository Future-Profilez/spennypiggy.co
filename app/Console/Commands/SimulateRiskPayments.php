<?php

namespace App\Console\Commands;

use App\Services\Risk\RiskEngineService;
use Illuminate\Console\Command;

class SimulateRiskPayments extends Command
{
    protected $signature = 'risk:simulate-payments 
        {--email= : Email to simulate}
        {--device= : Device ID to simulate}
        {--ip=1.1.1.1 : IP to simulate}
        {--creator= : Creator UUID}
        {--amount=1000 : Amount in minor units (e.g. 1000 = £10.00)}
        {--count=3 : Number of attempts}
        {--guest=0 : Set to 1 to simulate guest}
        {--sleep=0 : Sleep seconds between attempts}';

    protected $description = 'Simulate risk decisions for repeated payment attempts without calling Stripe';

    public function handle(RiskEngineService $riskEngine): int
    {
        $email = (string) ($this->option('email') ?: 'tester@example.com');
        $device = (string) ($this->option('device') ?: 'device-sim');
        $ip = (string) ($this->option('ip') ?: '1.1.1.1');
        $creator = (string) ($this->option('creator') ?: '');
        $amount = (int) ($this->option('amount') ?: 1000);
        $count = (int) ($this->option('count') ?: 3);
        $isGuest = ((int) ($this->option('guest') ?: 0)) === 1;
        $sleep = (int) ($this->option('sleep') ?: 0);

        if (! $creator) {
            $this->error('Missing --creator UUID');

            return 1;
        }

        for ($i = 1; $i <= $count; $i++) {
            $context = [
                'amount' => $amount,
                'currency' => 'GBP',
                'creator_id' => $creator,
                'email' => $email,
                'ip' => $ip,
                'device_id' => $device,
                'is_guest' => $isGuest,
            ];

            $result = $riskEngine->evaluate($context);

            $this->line(json_encode([
                'attempt' => $i,
                'decision' => $result['decision'] ?? null,
                'reason_codes' => $result['reason_codes'] ?? [],
            ]));

            if ($sleep > 0 && $i < $count) {
                sleep($sleep);
            }
        }

        return 0;
    }
}
