<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class GitPush extends Command
{
    /**
     * Usage:
     *
     * php artisan git:push
     * php artisan git:push "Fixed checkout bug"
     * php artisan git:push "Fixed checkout bug" dev
     * php artisan git:push "Merge latest changes" master
     */
    protected $signature = 'git:push
                            {message? : Commit message}
                            {branch? : Branch name (default: prem)}';

    protected $description = 'Automatically add, commit and push changes to Git';

    public function handle()
    {
        $branch = $this->argument('branch') ?: 'prem';
        $message = $this->argument('message');

        if (!$message) {
            $message = $this->ask('Enter commit message', 'Update code');
        }

        $this->newLine();
        $this->info("Checking git status...");

        $status = Process::path(base_path())->run('git status --porcelain');

        if (!$status->successful()) {
            $this->error($status->errorOutput());

            return self::FAILURE;
        }

        if (trim($status->output()) === '') {
            $this->warn('Working tree is clean.');
            $this->info('Nothing to commit.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->line($status->output());

        if (!$this->confirm("Push these changes to '{$branch}' branch?", true)) {
            $this->warn('Operation cancelled.');

            return self::SUCCESS;
        }

        $commands = [
            'git add .',
            'git commit -m "' . addslashes($message) . '"',
            "git push origin {$branch}",
        ];

        foreach ($commands as $command) {

            $this->newLine();
            $this->info("> {$command}");

            $result = Process::path(base_path())->run($command);

            if ($result->output()) {
                $this->line($result->output());
            }

            if (!$result->successful()) {
                $this->error($result->errorOutput());

                return self::FAILURE;
            }
        }

        $this->newLine();
        $this->info('====================================');
        $this->info("Successfully pushed to '{$branch}'");
        $this->info("Commit Message: {$message}");
        $this->info('====================================');

        return self::SUCCESS;
    }
}
