<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserDocuments;
use App\SumSubClient;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Stripe\StripeClient;
use Uploadcare\Api;
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

            $docs = new UserDocuments;
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

    public function manualPayout()
    {
        $stripe = new StripeClient(config('services.stripe.secret'));

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
