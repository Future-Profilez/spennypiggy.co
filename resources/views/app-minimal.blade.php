<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    
    {{-- 🚨 Nonced. Ziggy's `@routes` emits an inline <script>, which a source scan
         for `<script` cannot see — see the note in the admin app's own
         app.blade.php. The group must be passed as null to reach the second
         parameter of `BladeRouteGenerator::generate($group, $nonce)`. --}}
    @routes(null, $cspNonce ?? '')
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
