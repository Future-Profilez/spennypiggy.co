@extends('email.default-2')

@section('content')
@php
$bio = $updatedFields['bio'] ?? false;
$social = $updatedFields['social'] ?? false;

// Check if bio was updated AND user has content in bio
$hasBioContent = !empty($user->bio);

if ($bio && $hasBioContent) {
    $updateText = 'Bio';
} elseif ($social) {
    $updateText = 'Social Media handle';
} else {
    // Fallback - shouldn't happen with our controller fix, but defensive programming
    $updateText = 'Profile';
}
@endphp


<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') }}">
            <img alt="" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px;">
        <table width="100%" style="max-width: 500px; text-align: center;">
            <tr>
                <td style="font-family: Arial; font-weight: bold; font-size: 18px; color:#000; line-height: 26px;">
                    {{ $user->name }} has updated their <span style="color: #8C52FF">{{ $updateText }}</span>.
                </td>
            </tr>
            <tr>
                <td style="font-family: Arial; font-size: 14px; color: #4D4D4D; line-height: 20px; padding: 15px 0;">
                    Please review and approve the changes so the user can use their profile fully.
                </td>
            </tr>
            <tr>
                <td style="padding:20px 0;">
                    <a href="{{ env('APP_URL') }}/{{ $user->username }}"
                        style="background-color: #f94f97; color: #ffffff; padding: 13px 25px; border-radius: 30px; text-decoration: none; font-family: Arial; font-weight: bold; font-size: 15px;">
                        Review Profile
                    </a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
