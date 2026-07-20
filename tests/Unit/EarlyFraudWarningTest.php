<?php

namespace Tests\Unit;

use App\Models\EarlyFraudWarning;
use Tests\TestCase;

class EarlyFraudWarningTest extends TestCase
{
    public function test_it_generates_a_uuid_id_when_the_creating_event_runs(): void
    {
        $warning = new class extends EarlyFraudWarning {
            public function triggerCreatingEvent(): void
            {
                $this->fireModelEvent('creating');
            }
        };

        $warning->stripe_efw_id = 'efw_123';
        $warning->stripe_charge_id = 'ch_123';
        $warning->triggerCreatingEvent();

        $this->assertNotNull($warning->id);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $warning->id);
    }
}
