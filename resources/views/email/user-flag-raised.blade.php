<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#111;">
    <strong>{{ $flagLabel }}</strong>
</p>

<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#333;">
    Account #{{ $userId }} has been flagged. Nothing has been blocked automatically —
    a flag records what the platform noticed, and a person decides what happens next.
</p>

@if (trim($reason) !== '')
    {{-- ⚠️ Already redacted on the way into the column by SecurityRedactor, so
         this is the same text an admin reads on the screen. --}}
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#333;border-left:3px solid #D11A2A;padding-left:12px;">
        {{ $reason }}
    </p>
@endif

<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;">
    <a href="{{ $flagsUrl }}">Open Flagged Accounts</a>
</p>
