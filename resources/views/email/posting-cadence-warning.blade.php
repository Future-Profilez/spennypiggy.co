@extends('email.default-2')
@section('content')
{{--
    Sent BEFORE subscriptions are paused. The pause and resume emails only ever arrived
    after the creator's recurring income had already stopped, which is too late to act on.

    Content-first copy only: no tip/donation/fundraise wording.
    Use &#64; for @.
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">
            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;line-height:1.3;padding-bottom:12px;">
                    Your subscriber posts are running low
                </td>
            </tr>
            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.6;padding-bottom:16px;">
                    Hi {{ $creatorName }}, you have published
                    <strong>{{ $posts }} of {{ $required }}</strong> subscriber posts in the last
                    {{ $windowDays }} days.
                </td>
            </tr>
            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.6;padding-bottom:16px;">
                    Your members are paying for content, so if this stays below
                    {{ $required }} we pause collection on your memberships and subscriptions —
                    no new charges are taken until you post again. Nothing is cancelled, and
                    it reverses the moment you are back up to {{ $required }}.
                </td>
            </tr>
            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;line-height:1.6;padding-bottom:24px;">
                    Publishing {{ max(1, $required - $posts) }} more
                    {{ $required - $posts === 1 ? 'post' : 'posts' }} keeps everything running.
                </td>
            </tr>
            <tr>
                <td align="center" style="padding-bottom:8px;">
                    <a href="{{ $dashboardUrl }}" target="_blank"
                       style="display:inline-block;background:#FF007F;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:20px;">
                        Write a post
                    </a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
