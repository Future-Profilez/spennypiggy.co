<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Post;
use App\Models\TipGoalsPayment;
use App\Services\SocialImageGenerator;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class RegenerateThankYouImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'posts:regenerate-thank-you-images 
                            {--dry-run : Show what would be updated without making changes}
                            {--force : Regenerate images even if they already exist}
                            {--limit=50 : Maximum number of posts to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Regenerate images for thank you posts that have null images';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');
        $limit = (int) $this->option('limit');
        
        $this->info('Starting regeneration of thank you post images...');
        
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        if ($force) {
            $this->warn('FORCE MODE - Will regenerate images even if they already exist');
        }
        
        // Find posts that are likely thank you posts
        $postsQuery = Post::query();
        
        // If not forcing, only get posts with null images
        if (!$force) {
            $postsQuery->whereNull('image');
        }
        
        $postsQuery->where(function($query) {
                $query->where('title', 'like', '%thank you%')
                      ->orWhere('title', 'like', '%Thank You%')
                      ->orWhere('title', 'like', '%THANK YOU%')
                      ->orWhere('content', 'like', '%tip%')
                      ->orWhere('content', 'like', '%support%');
            })
            ->orderBy('created_at', 'desc');
            
        if ($limit > 0) {
            $postsQuery->limit($limit);
        }
        
        $posts = $postsQuery->get();
        
        $imageStatus = $force ? 'posts (including those with existing images)' : 'posts with null images';
        $this->info("Found {$posts->count()} {$imageStatus}");
        
        if ($posts->isEmpty()) {
            $this->info('No posts found that need image regeneration.');
            return 0;
        }
        
        $progressBar = $this->output->createProgressBar($posts->count());
        $progressBar->start();
        
        $successCount = 0;
        $failureCount = 0;
        $imageGenerator = new SocialImageGenerator();
        
        foreach ($posts as $post) {
            try {
                // Try to find associated tip payment
                $tipPayment = TipGoalsPayment::where('created_at', '>=', $post->created_at->subMinutes(5))
                    ->where('created_at', '<=', $post->created_at->addMinutes(5))
                    ->where('creator_id', $post->user_id)
                    ->first();
                
                $imageData = $this->prepareImageData($post, $tipPayment);
                
                if (!$dryRun) {
                    // Prefer Node.js HTML-based generator for updated design
                    $imagePath = $this->generateImageViaNode($imageData);
                    
                    // Fallback to legacy PHP GD generator if Node fails
                    if (!$imagePath) {
                        $imagePath = $imageGenerator->generateThankYouImage($imageData);
                    }
                    
                    // Final fallback to default image
                    if (!$imagePath) {
                        $imagePath = $imageGenerator->generateDefaultThankYouImage();
                    }
                    
                    if ($imagePath && file_exists($imagePath)) {
                        // Upload to Uploadcare
                        $imageUuid = $this->uploadToUploadcare($imagePath);
                        
                        if ($imageUuid) {
                            $post->update(['image' => $imageUuid]);
                            $successCount++;
                            
                            Log::info('Regenerated image for post', [
                                'post_id' => $post->id,
                                'image_uuid' => $imageUuid
                            ]);
                        } else {
                            $failureCount++;
                            Log::warning('Failed to upload regenerated image', ['post_id' => $post->id]);
                        }
                        
                        // Clean up temp file
                        @unlink($imagePath);
                    } else {
                        $failureCount++;
                        Log::error('Failed to generate image for post', ['post_id' => $post->id]);
                    }
                } else {
                    // Dry run - just show what would be processed
                    $this->line("\nWould regenerate image for post ID: {$post->id}");
                    $this->line("  Title: {$post->title}");
                    $this->line("  Created: {$post->created_at}");
                    if ($tipPayment) {
                        $this->line("  Associated tip: {$tipPayment->amount} {$tipPayment->currency}");
                    }
                    $successCount++;
                }
                
            } catch (\Exception $e) {
                $failureCount++;
                Log::error('Error processing post for image regeneration', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage()
                ]);
                
                if (!$dryRun) {
                    $this->error("\nFailed to process post ID {$post->id}: {$e->getMessage()}");
                }
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine(2);
        
        if ($dryRun) {
            $this->info("DRY RUN COMPLETE:");
            $this->info("  Posts that would be processed: {$successCount}");
            $this->info("  Posts that would fail: {$failureCount}");
        } else {
            $this->info("REGENERATION COMPLETE:");
            $this->info("  Successfully processed: {$successCount}");
            $this->info("  Failed: {$failureCount}");
        }
        
        return 0;
    }
    
    /**
     * Generate image using Node.js HTML renderer and return local temp file path
     */
    private function generateImageViaNode(array $data): ?string
    {
        try {
            // Build payload expected by Node script
            $payload = [
                'creator' => [
                    'name' => $data['creator']['name'] ?? '',
                    'username' => $data['creator']['username'] ?? '',
                    'avatar' => $data['creator']['avatar'] ?? null,
                ],
                'supporterName' => $data['supporterName'] ?? 'Anonymous',
                'amount' => (float)($data['amount'] ?? 0),
                'currency' => $data['currency'] ?? 'GBP',
                'isAnonymous' => (bool)($data['isAnonymous'] ?? false),
                'message' => $data['message'] ?? null,
            ];

            // Validate avatar presence (Node script requires it)
            if (empty($payload['creator']['avatar'])) {
                Log::warning('Node generator skipped: creator avatar missing');
                return null;
            }

            $nodeScriptPath = base_path('resources/node/renderSupportImage.js');
            if (!file_exists($nodeScriptPath)) {
                Log::error('Node.js script not found', ['path' => $nodeScriptPath]);
                return null;
            }

            $payloadJson = json_encode($payload);

            // Resolve node executable
            $nodeCommand = 'node';
            $nodeCheck = shell_exec('which node 2>/dev/null');
            if (empty(trim($nodeCheck))) {
                foreach (['/usr/local/bin/node', '/usr/bin/node', '/opt/homebrew/bin/node'] as $candidate) {
                    if (file_exists($candidate)) { $nodeCommand = $candidate; break; }
                }
            }

            Log::info('Running Node generator', [
                'node' => $nodeCommand,
                'script' => $nodeScriptPath,
            ]);

            $process = new Process([$nodeCommand, $nodeScriptPath, $payloadJson]);
            $process->setTimeout(40);
            $process->run();

            if (!$process->isSuccessful()) {
                Log::error('Node process failed', ['stderr' => $process->getErrorOutput()]);
                return null;
            }

            $output = $process->getOutput();
            if (preg_match('/IMAGE_PATH:(.+)/', $output, $m)) {
                $imagePath = trim($m[1]);
                if ($imagePath && file_exists($imagePath)) {
                    Log::info('Node image generated', ['path' => $imagePath]);
                    return $imagePath;
                }
                Log::error('Node image path invalid', ['path' => $imagePath]);
                return null;
            }

            Log::error('Node output missing IMAGE_PATH marker', ['output' => $output]);
            return null;

        } catch (\Exception $e) {
            Log::error('Exception generating image via Node', ['error' => $e->getMessage()]);
            return null;
        }
    }
    
    /**
     * Prepare image data from post and tip payment
     */
    private function prepareImageData($post, $tipPayment = null): array
    {
        $user = $post->user;
        
        // Extract data from tip payment if available, otherwise use defaults
        if ($tipPayment) {
            return [
                'creator' => [
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar
                ],
                'supporterName' => $tipPayment->sender_name ?? 'Anonymous',
                'amount' => (float) $tipPayment->amount,
                'currency' => $tipPayment->currency ?? 'GBP',
                'isAnonymous' => empty($tipPayment->sender_name),
                'message' => $tipPayment->message
            ];
        }
        
        // Fallback data when no tip payment found
        return [
            'creator' => [
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar
            ],
            'supporterName' => 'Supporter',
            'amount' => 0.0,
            'currency' => 'GBP',
            'isAnonymous' => false,
            'message' => 'Thank you for your support!'
        ];
    }
    
    /**
     * Upload image to Uploadcare
     */
    private function uploadToUploadcare(string $imagePath): ?string
    {
        try {
            $uploadcareApiKey = config('services.uploadcare.public', env('UPLOADCARE_PUBLIC_KEY'));
            if (empty($uploadcareApiKey)) {
                $uploadcareApiKey = getenv('UPLOADCARE_PUBLIC_KEY') ?: $_ENV['UPLOADCARE_PUBLIC_KEY'] ?? null;
            }
            
            if (!$uploadcareApiKey) {
                Log::warning('Uploadcare public key not configured');
                return null;
            }
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, [
                'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                'UPLOADCARE_STORE' => '1',
                'file' => new \CURLFile($imagePath, 'image/png', 'regenerated-thank-you.png')
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($response && $httpCode === 200) {
                $responseData = json_decode($response, true);
                if (isset($responseData['file'])) {
                    return $responseData['file'];
                }
            }
            
            Log::warning('Uploadcare upload failed', [
                'response' => $response,
                'http_code' => $httpCode
            ]);
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('Error uploading to Uploadcare', ['error' => $e->getMessage()]);
            return null;
        }
    }
}