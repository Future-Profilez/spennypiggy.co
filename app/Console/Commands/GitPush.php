<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class GitPush extends Command
{
    protected $signature = 'git:push {message=Update code}';

    protected $description = 'Run git status, add, commit and push';

    public function handle()
    {
        $commands = [
            'git status',
            'git add .',
            'git commit -m "' . addslashes($this->argument('message')) . '"',
            'git push origin prem',
        ];

        foreach ($commands as $command) {
            $this->info("Running: {$command}");

            $result = Process::path(base_path())->run($command);

            $this->line($result->output());

            if (! $result->successful()) {
                $this->error($result->errorOutput());

                return self::FAILURE;
            }
        }

        $this->info('Git push completed successfully.');

        return self::SUCCESS;
    }
}
