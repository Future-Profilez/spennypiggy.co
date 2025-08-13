<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CriticalCssService;
use Illuminate\Support\Facades\Process;

class GenerateCriticalCss extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'css:critical {--template=* : Specific templates to generate critical CSS for}';

    /**
     * The console command description.
     */
    protected $description = 'Generate critical CSS files for templates using Penthouse or Critters';

    /**
     * Execute the console command.
     */
    public function handle(CriticalCssService $criticalCssService): int
    {
        $this->info('🚀 Generating critical CSS files...');

        $templates = $this->option('template') ?: ['home', 'dashboard', 'profile', 'login', 'register'];

        foreach ($templates as $template) {
            $this->info("📝 Processing template: {$template}");
            
            try {
                // Use Node.js script for advanced critical CSS extraction
                $this->generateAdvancedCriticalCss($template);
                $this->line("✅ Critical CSS generated for {$template}");
            } catch (\Exception $e) {
                $this->error("❌ Failed to generate critical CSS for {$template}: " . $e->getMessage());
                
                // Fallback to PHP service
                $this->info("🔄 Using fallback PHP extraction for {$template}");
                $criticalCssService->generateCriticalCssFiles();
            }
        }

        $this->info('🎉 Critical CSS generation completed!');
        return 0;
    }

    /**
     * Generate critical CSS using Node.js tools
     */
    private function generateAdvancedCriticalCss(string $template): void
    {
        $scriptPath = base_path('scripts/generate-critical-css.js');
        $templateUrl = config('app.url') . "/{$template}";
        $outputDir = storage_path('app/critical-css');

        if (!file_exists($scriptPath)) {
            $this->createCriticalCssScript($scriptPath);
        }

        $command = [
            'node',
            $scriptPath,
            '--template=' . $template,
            '--url=' . $templateUrl,
            '--output=' . $outputDir,
            '--css=' . public_path('build/assets/app.css')
        ];

        $result = Process::run(implode(' ', $command));

        if (!$result->successful()) {
            throw new \Exception($result->errorOutput());
        }
    }

    /**
     * Create the Node.js script for critical CSS generation
     */
    private function createCriticalCssScript(string $scriptPath): void
    {
        $scriptContent = <<<'JS'
#!/usr/bin/env node

const penthouse = require('penthouse');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .option('--template <template>', 'Template name')
  .option('--url <url>', 'Template URL')
  .option('--output <output>', 'Output directory')
  .option('--css <css>', 'CSS file path');

program.parse();

const options = program.opts();

async function generateCriticalCSS() {
  try {
    console.log(`Generating critical CSS for template: ${options.template}`);
    
    const criticalCSS = await penthouse({
      url: options.url,
      css: options.css,
      width: 1300,
      height: 900,
      timeout: 30000,
      forceInclude: [
        '.btn-*',
        '.heading*', 
        '.font-*',
        '.shadow-*',
        '.profile-*',
        '.landing-*',
        '[data-aos]',
        '.funpart',
        '.wish-item-box'
      ],
      blockJSRequests: false,
      renderWaitTime: 100
    });

    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }

    const outputPath = path.join(options.output, `${options.template}.css`);
    fs.writeFileSync(outputPath, criticalCSS);
    
    console.log(`✅ Critical CSS saved to: ${outputPath}`);
    console.log(`📊 Critical CSS size: ${criticalCSS.length} bytes`);
    
  } catch (error) {
    console.error('❌ Error generating critical CSS:', error);
    process.exit(1);
  }
}

generateCriticalCSS();
JS;

        // Ensure directory exists
        if (!file_exists(dirname($scriptPath))) {
            mkdir(dirname($scriptPath), 0755, true);
        }

        file_put_contents($scriptPath, $scriptContent);
        chmod($scriptPath, 0755);
    }
}
