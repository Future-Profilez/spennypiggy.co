@extends('email.default-2')
@section('content')

<tr>
    <td style="padding: 30px 24px 10px 24px; background-color: #ffffff;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="padding-bottom: 20px; text-align: center;">
                    <img src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" alt="Spenny Piggy" width="119" style="border: none;">
                </td>
            </tr>
            <tr>
                <td style="padding-bottom: 16px;">
                    <h1 style="font-family: Arial, sans-serif; font-size: 22px; font-weight: 700; color: #141414; margin: 0 0 6px 0; text-align: center;">
                        💡 New Feature Suggestion
                    </h1>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 0; text-align: center;">
                        A user has shared an idea for Spenny Piggy
                    </p>
                </td>
            </tr>
        </table>
    </td>
</tr>

{{-- Suggestion block --}}
<tr>
    <td style="padding: 0 24px 20px 24px; background-color: #ffffff;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 10px; border-left: 4px solid #8C52FF;">
            <tr>
                <td style="padding: 16px 20px;">
                    <p style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; color: #8C52FF; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0;">
                        The Suggestion
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">{{ $data['suggestion'] }}</p>
                </td>
            </tr>
        </table>
    </td>
</tr>

{{-- Reference image --}}
@if(!empty($data['image_url']))
<tr>
    <td style="padding: 0 24px 20px 24px; background-color: #ffffff;">
        <p style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0;">
            Reference Image
        </p>
        <img src="{{ $data['image_url'] }}" alt="Reference" style="max-width: 100%; border-radius: 8px; border: 1px solid #eee;">
    </td>
</tr>
@endif

{{-- User details --}}
<tr>
    <td style="padding: 0 24px 30px 24px; background-color: #ffffff;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FBF0F5; border-radius: 10px;">
            <tr>
                <td style="padding: 16px 20px;">
                    <p style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; color: #F94F97; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0;">
                        Submitted By
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 0 0 4px 0;">
                        <strong>Name:</strong> {{ $data['name'] ?? $data['user_name'] ?? 'Guest' }}
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 0 0 4px 0;">
                        <strong>Email:</strong> {{ $data['email'] ?? $data['user_email'] ?? 'Not provided' }}
                    </p>
                    @if(isset($data['user_id']))
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 0;">
                        <strong>User ID:</strong> {{ $data['user_id'] }}
                    </p>
                    @endif
                </td>
            </tr>
        </table>
    </td>
</tr>

{{-- CTA --}}
<tr>
    <td style="padding: 0 24px 30px 24px; background-color: #ffffff; text-align: center;">
        <a href="{{ env('ADMIN_URL', 'http://localhost:8001') }}/feature-suggestions"
           style="display: inline-block; background-color: #F94F97; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-family: Arial, sans-serif; font-size: 15px; font-weight: 600;">
            View in Admin Dashboard
        </a>
    </td>
</tr>

@endsection
