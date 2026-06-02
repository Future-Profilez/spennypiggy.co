<?php

namespace App\Console\Commands;

use App\Mail\SendSuspendedMailForSubscription;
use App\Models\MonthlyCharge;
use App\Models\User;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class AutoSuspendAccount extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    // protected $signature = 'app:auto-suspend-account';
    protected $signature = 'app:auto-suspend-account';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {

            $user = MonthlyCharge::pluck('user_id')->unique()->toArray();

            $users = User::whereIn('id',$user)->get();
            foreach ($users as $key => $value) {
                $charge = MonthlyCharge::where('user_id',$value->id)->where('status','paid')->latest()->first();
                if(empty($charge)){
                    $value->suspended_account = 1;
                    $value->save();

                    Mail::to($value->email)
                    ->send(new SendSuspendedMailForSubscription());
                }
            }
            $this->info("Accounts suspended successfully.");

        } catch (Exception $e){
            $this->error("Failed to sync: ".$e->getMessage());
        }
    }
}
