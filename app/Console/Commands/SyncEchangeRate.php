<?php

namespace App\Console\Commands;

use App\CurrencyExchange;
use App\Models\Currency;
use Exception;
use Illuminate\Console\Command;

class SyncEchangeRate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-echange-rate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Syncing Currency Exchange Rate...';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        /** For updating Currency Exchange rates */

        try {

            $resp = CurrencyExchange::getRates();
            if($resp["success"] && !empty($resp['data']['conversion_rates']))
            {
                foreach($resp['data']['conversion_rates'] as $iso => $rate) {
                    // $rate = str_replace(',', '', (string)$rate);
                    // $rate = number_format((float)$rate, 4);
                    Currency::where('ISO', $iso)->update(['conversion_rate' => $rate]);
                }
            }

            $this->info("Exchange rates synced successfuly.");

        } catch (Exception $e){
            $this->error("Failed to sync: ".$e->getMessage());
        }
    }
}
