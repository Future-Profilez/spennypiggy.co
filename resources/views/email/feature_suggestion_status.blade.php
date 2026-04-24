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
                <td style="padding-bottom: 20px; text-align: center;">
                    @if($suggestion->status === 'accepted' || $suggestion->status === 'planned')
                        <h1 style="font-family: Arial, sans-serif; font-size: 22px; font-weight: 700; color: #141414; margin: 0 0 8px 0;">
                            🚀 Your idea has been accepted!
                        </h1>
                        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 0;">
                            Hi {{ $suggestion->name ?? 'there' }}, great news — your idea is on our roadmap!
                        </p>
                    @elseif($suggestion->status === 'under_review')
                        <h1 style="font-family: Arial, sans-serif; font-size: 22px; font-weight: 700; color: #141414; margin: 0 0 8px 0;">
                            🔍 Your idea is under review
                        </h1>
                        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 0;">
                            Hi {{ $suggestion->name ?? 'there' }}, our team is actively looking into your suggestion.
                        </p>
                    @elseif($suggestion->status === 'rejected')
                        <h1 style="font-family: Arial, sans-serif; font-size: 22px; font-weight: 700; color: #141414; margin: 0 0 8px 0;">
                            💬 An update on your suggestion
                        </h1>
                        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 0;">
                            Hi {{ $suggestion->name ?? 'there' }}, thank you for sharing your idea with us.
                        </p>
                    @endif
                </td>
            </tr>
        </table>
    </td>
</tr>

{{-- Message body --}}
<tr>
    <td style="padding: 0 24px 20px 24px; background-color: #ffffff;">
        @if($suggestion->status === 'accepted' || $suggestion->status === 'planned')
            <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0;">
                We loved your feature idea and it is now on our product roadmap. We will be working on bringing it to life — stay tuned for updates!
            </p>
        @elseif($suggestion->status === 'under_review')
            <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0;">
                Our team is actively reviewing your feature suggestion. We will keep you posted as things progress.
            </p>
        @elseif($suggestion->status === 'rejected')
            <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0;">
                After careful review, we have decided not to move forward with this suggestion at this time. We truly appreciate your input and encourage you to keep the ideas coming!
            </p>
        @endif
    </td>
</tr>

{{-- Original suggestion --}}
<tr>
    <td style="padding: 0 24px 20px 24px; background-color: #ffffff;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 10px; border-left: 4px solid #8C52FF;">
            <tr>
                <td style="padding: 16px 20px;">
                    <p style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; color: #8C52FF; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0;">
                        Your Suggestion
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">{{ $suggestion->suggestion }}</p>
                </td>
            </tr>
        </table>
    </td>
</tr>

{{-- Admin notes --}}
@if($suggestion->admin_notes)
<tr>
    <td style="padding: 0 24px 20px 24px; background-color: #ffffff;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FBF0F5; border-radius: 10px;">
            <tr>
                <td style="padding: 16px 20px;">
                    <p style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; color: #F94F97; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0;">
                        Note from our team
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0;">{{ $suggestion->admin_notes }}</p>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endif

{{-- Closing --}}
<tr>
    <td style="padding: 0 24px 30px 24px; background-color: #ffffff;">
        <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 6px 0;">
            Thank you for helping shape the future of Spenny Piggy. We read every suggestion.
        </p>
        <p style="font-family: Arial, sans-serif; font-size: 15px; color: #333; margin: 0;">
            — The Spenny Piggy Team
        </p>
    </td>
</tr>

@endsection
