<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TestSchedulerWrite extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:scheduler-write';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test writing to cache from CLI';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting scheduler write test...');
        
        $driver = config('cache.default');
        $this->info("Current Cache Driver: {$driver}");

        try {
            // 1. Write to default cache
            $key = 'scheduler_test_write_' . time();
            $value = 'test_value_' . time();
            
            Cache::put($key, $value, 60);
            $this->info("Written to default cache: {$key} => {$value}");
            
            $readBack = Cache::get($key);
            $this->info("Read back from default cache: " . ($readBack === $value ? 'SUCCESS' : 'FAILED'));

            // 2. Write to DynamoDB specifically if configured
            if (config('cache.stores.dynamodb')) {
                $this->info('DynamoDB store is configured. Attempting specific write...');
                $dynamoKey = 'scheduler_test_dynamodb_' . time();
                Cache::store('dynamodb')->put($dynamoKey, $value, 60);
                $this->info("Written to dynamodb store: {$dynamoKey} => {$value}");
                
                $readBackDynamo = Cache::store('dynamodb')->get($dynamoKey);
                $this->info("Read back from dynamodb store: " . ($readBackDynamo === $value ? 'SUCCESS' : 'FAILED'));
            } else {
                $this->warn('DynamoDB store is NOT configured in config/cache.php');
            }

            // 3. Force write to scheduler_last_run keys
            $now = now()->toDateTimeString();
            Cache::put('scheduler_last_run', $now, 600);
            if (config('cache.stores.dynamodb')) {
                Cache::store('dynamodb')->put('scheduler_last_run_dynamodb', $now, 600);
            }
            $this->info("Forced update of scheduler_last_run keys to: {$now}");

            return 0;
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }
}
