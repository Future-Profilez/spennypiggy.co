@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 296px; width: 100%; text-align: center;">
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img style="max-width: 200px; margin:20px 0;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img"></td>
                 </tr>
                 <tr>
                     <td
                         style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        <span style="color:#F94F97; font-weight: bold;">
                            Thank you for granting {{ isset($data->owner) && isset($data->owner->name) ? $data->owner->name : 'their' }}'s wish!
                        </span><br><br>
                        <span style="color:#141414;">
                            @php
                                // Set default values with comprehensive error handling
                                $convertedAmount = 0;
                                $decimalPlaces = 2;
                                $currencySymbol = '£'; // Default currency symbol
                                
                                try {
                                    // Get amount from various possible sources
                                    if (isset($data->amount_subtotal) && is_numeric($data->amount_subtotal)) {
                                        $convertedAmount = $data->amount_subtotal;
                                    } elseif (isset($data->amount) && is_numeric($data->amount)) {
                                        $convertedAmount = $data->amount;
                                    } elseif (isset($data->amount_total) && is_numeric($data->amount_total)) {
                                        $convertedAmount = $data->amount_total;
                                    }
                                    
                                    // Handle currency symbol
                                    if (isset($curr) && !empty($curr)) {
                                        $currencySymbol = $curr;
                                        // Try to get currency details for formatting
                                        try {
                                            $displayCurrency = \App\Models\Currency::where('symbol', $curr)->first();
                                            if ($displayCurrency && isset($displayCurrency->ISOdigits) && is_numeric($displayCurrency->ISOdigits)) {
                                                $decimalPlaces = $displayCurrency->ISOdigits;
                                            }
                                            
                                            // Convert amount if needed
                                            if ($displayCurrency && isset($data->currency) && $displayCurrency->ISO !== $data->currency) {
                                                $convertedAmount = \App\Helpers::priceFormat($data->currency, $convertedAmount, $displayCurrency->ISO);
                                            }
                                        } catch (\Exception $e) {
                                            // If currency conversion fails, use default values
                                            \Log::warning('Currency conversion failed in email template', ['error' => $e->getMessage()]);
                                        }
                                    }
                                    
                                    // Ensure amount is positive
                                    $convertedAmount = max(0, $convertedAmount);
                                    
                                } catch (\Exception $e) {
                                    \Log::error('Error processing email template data', ['error' => $e->getMessage()]);
                                    $convertedAmount = 0;
                                    $decimalPlaces = 2;
                                    $currencySymbol = '£';
                                }
                            @endphp
                            Your generous gift of {{ $currencySymbol }}{{ number_format($convertedAmount, $decimalPlaces) }} has made their day brighter 🎁✨
                        </span>
                     </td>
                 </tr>
                 <tr>
                     <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                         Go to <a href="https://spennypiggy.co/">Spenny Piggy</a>  and discover more creators wishes to fulfil! Check out their profile Intros, memberships and more! </td>
                     </tr>
                @php
                     // Get content deliverables and certificates for this payment
                     $contentDeliverables = [];
                     $certificateDeliverables = [];
                     try {
                         // First check if consolidated deliverables are passed directly (new approach)
                         if (isset($data->consolidated_email) && $data->consolidated_email && isset($data->deliverables)) {
                             $allDeliverables = collect($data->deliverables);
                             $contentDeliverables = $allDeliverables->filter(function($d) {
                                 return !empty($d->deliverable_url) && $d->deliverable_type !== 'email';
                             });
                             $certificateDeliverables = $allDeliverables->filter(function($d) {
                                 return !empty($d->certificate_url);
                             });
                             \Log::info('Email template: Using consolidated deliverables', [
                                 'content_count' => $contentDeliverables->count(),
                                 'certificate_count' => $certificateDeliverables->count()
                             ]);
                         } else {
                             // Fallback to database query (legacy approach)
                             if (isset($data->id)) {
                                 $contentDeliverables = \App\Models\Deliverable::where('session_id', $data->session_id ?? null)
                                     ->where('deliverable_type', '!=', 'email')
                                     ->where('status', 'delivered')
                                     ->whereNotNull('deliverable_url')
                                     ->get();
                                 $certificateDeliverables = \App\Models\Deliverable::where('session_id', $data->session_id ?? null)
                                     ->where('status', 'delivered')
                                     ->whereNotNull('certificate_url')
                                     ->get();
                                 \Log::info('Email template: Using database query deliverables', [
                                     'content_count' => $contentDeliverables->count(),
                                     'certificate_count' => $certificateDeliverables->count()
                                 ]);
                             }
                         }
                     } catch (\Exception $e) {
                         \Log::warning('Email template: Failed to load deliverables', ['error' => $e->getMessage()]);
                         $contentDeliverables = collect();
                         $certificateDeliverables = collect();
                     }
                 @endphp
                 
                 @if($contentDeliverables && count($contentDeliverables) > 0)
                 <tr>
                     <td style="padding: 20px 0; border-top: 1px solid #eee;">
                         <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #F94F97; text-align: center; margin-bottom: 15px;">🎁 Your Content is Ready!</h3>
                         <p style="font-family: Arial; font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">Click the links below to access your exclusive content:</p>
                         
                         @foreach($contentDeliverables as $deliverable)
                             @php
                                 // Handle both consolidated deliverables (objects) and legacy deliverables (models)
                                 if (is_object($deliverable) && isset($deliverable->metadata)) {
                                     $metadata = is_array($deliverable->metadata) ? $deliverable->metadata : json_decode($deliverable->metadata, true);
                                 } else {
                                     $metadata = [];
                                 }
                                 
                                 // Get wish name - try multiple sources
                                 $wishName = 'Digital Content';
                                 if (isset($deliverable->wish_item) && $deliverable->wish_item->wishname) {
                                     $wishName = $deliverable->wish_item->wishname;
                                 } elseif (isset($metadata['wish_name'])) {
                                     $wishName = $metadata['wish_name'];
                                 }
                                 
                                 // Get media type information
                                 $mediaType = $metadata['media_type'] ?? $metadata['content_file_type'] ?? 'file';
                                 $fileName = $metadata['content_file_name'] ?? null;
                                 $contentSource = $metadata['content_source'] ?? 'unknown';
                                 
                                 // Determine content type and icon
                                 $contentIcon = '📄';
                                 $contentDescription = 'Digital File';
                                 
                                 if (!empty($mediaType)) {
                                     if (strpos($mediaType, 'video/') === 0) {
                                         $contentIcon = '🎬';
                                         $contentDescription = 'Video Content';
                                     } elseif (strpos($mediaType, 'image/') === 0) {
                                         $contentIcon = '🖼️';
                                         $contentDescription = 'Image Content';
                                     } elseif (strpos($mediaType, 'audio/') === 0) {
                                         $contentIcon = '🎵';
                                         $contentDescription = 'Audio Content';
                                     } elseif ($mediaType == 'application/pdf') {
                                         $contentIcon = '📋';
                                         $contentDescription = 'PDF Document';
                                     }
                                 }
                                 
                                 // Get deliverable URL
                                 $contentUrl = $deliverable->deliverable_url ?? '#';
                             @endphp
                             <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF;">
                                 <p style="font-family: Arial; font-size: 16px; font-weight: bold; color: #333; margin: 0 0 5px 0;">{{ $wishName }}</p>
                                 <p style="font-family: Arial; font-size: 14px; color: #666; margin: 0 0 8px 0;">
                                     {{ $contentIcon }} {{ $contentDescription }}
                                     @if(!empty($fileName))
                                         <br><span style="font-size: 12px; color: #999;">📁 {{ $fileName }}</span>
                                     @endif
                                 </p>
                                 <a href="{{ $contentUrl }}" 
                                    style="display: inline-block; padding: 10px 20px; background-color: #8C52FF; color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold; transition: background-color 0.3s;"
                                    target="_blank">🎁 Access Your Content</a>
                             </div>
                         @endforeach
                     </td>
                 </tr>
                 @endif
                 
                 @if($certificateDeliverables && count($certificateDeliverables) > 0)
                 <tr>
                     <td style="padding: 20px 0; border-top: 1px solid #eee;">
                         <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #8C52FF; text-align: center; margin-bottom: 15px;">🏆 Certificate of Authenticity</h3>
                         <p style="font-family: Arial; font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">Your purchase comes with an official certificate of authenticity for your records:</p>
                         
                         @foreach($certificateDeliverables as $deliverable)
                             @php
                                 // Handle both consolidated deliverables (objects) and legacy deliverables (models)
                                 if (is_object($deliverable) && isset($deliverable->metadata)) {
                                     $metadata = is_array($deliverable->metadata) ? $deliverable->metadata : json_decode($deliverable->metadata, true);
                                 } else {
                                     $metadata = [];
                                 }
                                 
                                 // Get wish name for certificate
                                 $itemName = 'Digital Purchase';
                                 if (isset($deliverable->wish_item) && $deliverable->wish_item->wishname) {
                                     $itemName = $deliverable->wish_item->wishname;
                                 } elseif (isset($metadata['wish_name'])) {
                                     $itemName = $metadata['wish_name'];
                                 }
                                 
                                 // Get certificate URL
                                 $certificateUrl = $deliverable->certificate_url ?? '#';
                                 $certificateId = isset($deliverable->uuid) ? substr($deliverable->uuid, 0, 8) : 'N/A';
                             @endphp
                             <div style="margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; text-align: center;">
                                 <p style="font-family: Arial; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">🎊 {{ $itemName }}</p>
                                 <p style="font-family: Arial; font-size: 12px; margin: 0 0 15px 0; opacity: 0.9;">Certificate ID: {{ $certificateId }}...</p>
                                 <a href="{{ $certificateUrl }}" 
                                    style="display: inline-block; padding: 12px 25px; background-color: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s;"
                                    target="_blank">📜 Download Certificate</a>
                             </div>
                         @endforeach
                         
                         <p style="font-family: Arial; font-size: 12px; color: #999; text-align: center; margin-top: 15px;">
                             💡 <strong>What's this?</strong> Your certificate serves as proof of authentic purchase and content delivery. Keep it safe for your records!
                         </p>
                     </td>
                 </tr>
                 @endif
                 
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center;">
                       <a href="{{ env('APP_URL') . '/' . (isset($data->owner) && isset($data->owner->username) ? $data->owner->username : '') }}" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Send more surprises</a>
                     </td>
                 </tr>
                 <tr style="line-height: 20px; height: 20px;">
                  <td></td>
                 </tr>
             </table>
         </td>
     </tr>
@endsection
