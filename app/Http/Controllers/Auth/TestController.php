<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserDocuments;
use App\SumSubClient;
use GuzzleHttp;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use RuntimeException;
use Uploadcare\Api;
use Image;
use Uploadcare\AuthUrl\AuthUrlConfig;
use Uploadcare\AuthUrl\Token\AkamaiToken;
use Uploadcare\Configuration;

class TestController extends Controller
{

    protected $uploadcareApi;

    public function __construct()
    {
        $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken(env('UPLOADCARE_SECRET_KEY'), 300));
        $config = Configuration::create(env('UPLOADCARE_PUBLIC_KEY'), env('UPLOADCARE_SECRET_KEY'))->setAuthUrlConfig($authUrlConfig);
        $this->uploadcareApi = new Api($config);
    }

    public function createApplicant()
    {

        $user = User::where('id', Auth::id())->first();
        $externalUserId = $user->uuid; // Use your internal UserID instead in production code
        $levelName = 'basic-kyc-level';
        $email = $user->email;
        $type = 'company';


        $testObject = new SumSubClient(env('SUMSUB_APP_TOKEN'), env('SUMSUB_SECRET_KEY'));

        $applicantId = $testObject->createApplicant($externalUserId, $email, $type, $levelName);

        $user->applicant_id = $applicantId;
        $user->save();

        return response()->json([
            'status' => true,
            'message' => 'Applicant created successfully.',
            'applicant_id' => $applicantId,
        ]);
    }


    public function generateVerificationLink()
    {
        $user = User::where('id', Auth::id())->first();
        $externalUserId = $user->uuid; // Use your internal UserID instead in production code
        $levelName = 'basic-kyc-level';

        $testObject = new SumSubClient(env('SUMSUB_APP_TOKEN'), env('SUMSUB_SECRET_KEY'));

        $verificationLink = $testObject->generateWebSdkLink($externalUserId, $levelName);

        return Inertia::location($verificationLink);
    }

    public function reviewWebhook()
    {
        $payload = @file_get_contents('php://input');
        $payload = json_decode($payload);
        $user = User::where('uuid', $payload['externalUserId'])->first();

        $user->applicant_id = $payload['applicantId'];
        $user->inspection_id = $payload['inspectionId'];

        if ($payload['reviewResult']['reviewAnswer'] == 'GREEN') {
            $user->kyc_verification_status = 1;
        }

        $user->save();

        $docs = UserDocuments::where('user_id', $user->id)->first();
        if (empty($docs)) {
            $testObject = new SumSubClient(env('SUMSUB_APP_TOKEN'), env('SUMSUB_SECRET_KEY'));

            $image_obj = $testObject->getImagesObject($user->applicant_id);

            $docs = new UserDocuments();
            $docs->user_id = $user->id;
            $docs->doc_type = $image_obj['IDENTITY']['idDocType'];
            $docs->front = $image_obj['IDENTITY']['imageIds'][0] ?? null;
            $docs->back = $image_obj['IDENTITY']['imageIds'][1] ?? null;

            $docs->save();
        }

        return response()->json([
            'status' => true,
            'message' => 'Webhook received successfully.',
        ]);
    }

    public function testAiImage()
    {
        // $secret = "sk-proj-xeWrpSBSOhKdefzoGcKoT3BlbkFJ1O9PUxI8oztKVKhbzTBZ";
        // $secret = "sk-proj-avVTgUXvglqj7tbMzt3cT3BlbkFJJZ12yq7p4EnkY7egg1w0";

        // $data = [
        //     'model' => 'dall-e-3',
        //     'prompt' => 'A cute baby sea otter',
        //     'n' => 1,
        //     'size' => '1024x1024',
        // ];

        // $response = Http::withHeaders([
        //     'Content-Type' => 'application/json',
        //     'Authorization' => 'Bearer ' . $secret,
        // ])->post('https://api.openai.com/v1/images/generations', $data);


        // $resp = json_decode($response);
        // $url = $resp->data[0]->url;
        // echo $url;

        $url = "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Px97YlxnrOOVtlqgZxZvBOr3/user-r5eYFp7fjIIzFAp68uN8Ov6s/img-ZY5PzH29s9bphcpZe1q0lkgR.png?st=2024-07-04T10%3A02%3A17Z&se=2024-07-04T12%3A02%3A17Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-07-04T03%3A18%3A42Z&ske=2024-07-05T03%3A18%3A42Z&sks=b&skv=2023-11-03&sig=JJIIuxUdU5KIDIrF/1LDfzrYIyA0%2BQoC%2BdOSi2HSnJA%3D";
        $imageContent = file_get_contents($url);

        // Create image from content
        $image = Image::make($imageContent);

        $watermarkText = "Made With AI";

        $bottomLeftX = 20; // Adjust this value as needed
        $bottomLeftY = $image->height() - 20;
        // Add watermark text
        $image->text($watermarkText, $bottomLeftX, $bottomLeftY, function ($font) {
            $font->size(72);
            $font->color('#ffffff');
            $font->align('left');
            $font->valign('bottom');
            $font->angle(0);
        });

        // Encode the image to a string
        $encodedImage = (string) $image->encode();

        // Upload to Uploadcare
        $uploader = $this->uploadcareApi->uploader();
        $response = $uploader->fromContent($encodedImage, 'image/jpeg');

        return $response->getUrl();
        // if ($response->successful()) {
        //     // $result = $response->json();
        //     return response()->json([
        //         'status' => true,
        //         'result' => json_decode($response)
        //     ]);
        // } else {
        //     $error = $response->body();
        //     return response()->json([
        //         'status' => false,
        //         'error' => json_decode($error)->error
        //     ]);
        // }
    }

    public function manualPayout()
    {
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

        $balance = $stripe->balance->retrieve();

        $zar_balance = 0;
        foreach ($balance->available as $available) {
            if ($available->currency == 'cad') {
                $zar_balance = $available->amount;
                break;
            }
        }

        $payouts = $stripe->payouts->create([
            'amount' => $zar_balance,
            'currency' => 'zar',
        ]);
        return $payouts;
    }
}
