<?php

namespace App\Http\Controllers\Debug;

use App\Http\Controllers\Controller;
use App\Services\SocialImageGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class SupportImageTestController extends Controller
{
    public function run(Request $request)
    {
        try {
            $payload = [
                'creator' => [
                    'name' => 'Debug Creator',
                    'username' => 'debuguser',
                    'avatar' => null, // avatar optional for PHP fallback
                ],
                'supporterName' => 'Anonymous Supporter',
                'amount' => 25.0,
                'currency' => 'USD',
                'isAnonymous' => true,
                'message' => 'Thank you for your support!',
            ];

            $nodeScriptPath = base_path('resources/node/renderSupportImage.js');
            if (! file_exists($nodeScriptPath)) {
                return response()->json([
                    'ok' => false,
                    'error' => 'Node script not found',
                    'path' => $nodeScriptPath,
                ], 500);
            }

            $nodeCommand = 'node';
            $nodeCheck = shell_exec('which node 2>/dev/null');
            if (empty(trim($nodeCheck))) {
                foreach (['/usr/local/bin/node', '/usr/bin/node', '/opt/homebrew/bin/node'] as $candidate) {
                    if (file_exists($candidate)) {
                        $nodeCommand = $candidate;
                        break;
                    }
                }
            }

            $payloadJson = json_encode($payload);
            $process = new Process([$nodeCommand, $nodeScriptPath, $payloadJson]);
            $process->setTimeout(40);
            $process->run();

            $node_ok = $process->isSuccessful();
            $stdout = $process->getOutput();
            $stderr = $process->getErrorOutput();

            $image_path = null;
            if (preg_match('/IMAGE_PATH:(.+)/', $stdout, $m)) {
                $image_path = trim($m[1]);
            }

            $node_result = [
                'ok' => $node_ok,
                'stdout' => $stdout,
                'stderr' => $stderr,
                'image_path' => $image_path,
                'exists' => $image_path ? file_exists($image_path) : false,
                'filesize' => ($image_path && file_exists($image_path)) ? filesize($image_path) : null,
            ];

            // Attempt Uploadcare upload if we have a generated image
            $uploadcare = [
                'attempted' => false,
                'uuid' => null,
                'cdn_url' => null,
                'http_code' => null,
                'response' => null,
                'error' => null,
            ];
            if ($image_path && file_exists($image_path)) {
                $uploadcareApiKey = config('services.uploadcare.public', env('UPLOADCARE_PUBLIC_KEY'));
                if (empty($uploadcareApiKey)) {
                    $uploadcareApiKey = getenv('UPLOADCARE_PUBLIC_KEY') ?: ($_ENV['UPLOADCARE_PUBLIC_KEY'] ?? null);
                }
                $uploadcare['attempted'] = true;
                if ($uploadcareApiKey) {
                    try {
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, [
                            'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                            'file' => new \CURLFile($image_path, 'image/png', 'support-social-debug.png'),
                        ]);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                        $resp = curl_exec($ch);
                        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);
                        @unlink($image_path);
                        $uploadcare['http_code'] = $code;
                        $uploadcare['response'] = $resp;
                        if ($resp && $code === 200) {
                            $data = json_decode($resp, true);
                            if (isset($data['file'])) {
                                $uploadcare['uuid'] = $data['file'];
                                $uploadcare['cdn_url'] = 'https://ucarecdn.com/'.$data['file'].'/';
                            }
                        }
                    } catch (\Exception $e) {
                        $uploadcare['error'] = $e->getMessage();
                    }
                } else {
                    $uploadcare['error'] = 'UPLOADCARE_PUBLIC_KEY not configured';
                    @unlink($image_path);
                }
            }

            // If node failed, exercise the PHP fallback path used by RegenerateThankYouImages
            $php_fallback = null;
            if (! $node_ok || ! $image_path || ! file_exists($image_path)) {
                try {
                    $generator = new SocialImageGenerator;
                    // Prefer the richer thank you image generator which uses text and decorations
                    $php_image = $generator->generateThankYouImage($payload);
                    if (! $php_image || ! file_exists($php_image)) {
                        $php_image = $generator->generateDefaultThankYouImage();
                    }
                    $php_fallback = [
                        'path' => $php_image,
                        'exists' => $php_image ? file_exists($php_image) : false,
                        'filesize' => ($php_image && file_exists($php_image)) ? filesize($php_image) : null,
                    ];

                    // If Node failed and PHP fallback image exists, attempt Uploadcare upload
                    if ($php_image && file_exists($php_image) && empty($uploadcare['uuid'])) {
                        $uploadcareApiKey = config('services.uploadcare.public', env('UPLOADCARE_PUBLIC_KEY'));
                        if (empty($uploadcareApiKey)) {
                            $uploadcareApiKey = getenv('UPLOADCARE_PUBLIC_KEY') ?: ($_ENV['UPLOADCARE_PUBLIC_KEY'] ?? null);
                        }
                        $uploadcare['attempted'] = true;
                        if ($uploadcareApiKey) {
                            try {
                                $ch = curl_init();
                                curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
                                curl_setopt($ch, CURLOPT_POST, true);
                                curl_setopt($ch, CURLOPT_POSTFIELDS, [
                                    'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                                    'UPLOADCARE_STORE' => '1',
                                    'file' => new \CURLFile($php_image, 'image/png', 'support-social-fallback.png'),
                                ]);
                                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                                $resp = curl_exec($ch);
                                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                                curl_close($ch);
                                @unlink($php_image);
                                $uploadcare['http_code'] = $code;
                                $uploadcare['response'] = $resp;
                                if ($resp && $code === 200) {
                                    $data = json_decode($resp, true);
                                    if (isset($data['file'])) {
                                        $uploadcare['uuid'] = $data['file'];
                                        $uploadcare['cdn_url'] = 'https://ucarecdn.com/'.$data['file'].'/';
                                    }
                                }
                            } catch (\Exception $e) {
                                $uploadcare['error'] = $e->getMessage();
                            }
                        } else {
                            $uploadcare['error'] = 'UPLOADCARE_PUBLIC_KEY not configured';
                            @unlink($php_image);
                        }
                    }
                } catch (\Exception $e) {
                    $php_fallback = [
                        'error' => $e->getMessage(),
                    ];
                }
            }

            return response()->json([
                'ok' => true,
                'node' => $node_result,
                'uploadcare' => $uploadcare,
                'php_fallback' => $php_fallback,
                'tmp_dir_writable' => is_writable('/tmp'),
                'env' => env('APP_ENV'),
            ]);
        } catch (\Exception $e) {
            Log::error('SupportImageTestController error', ['error' => $e->getMessage()]);

            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
