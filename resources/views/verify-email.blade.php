<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Email</title>
    <style>
      html,body{background:#000;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
      .btn{display:inline-block;padding:10px 16px;border-radius:12px;border:2px solid #000;background:#F94F97;color:#fff;text-transform:uppercase;font-weight:700;letter-spacing:.5px}
    </style>
  </head>
  <body>
    <form action="{{ route('verify.email') }}" method="post">
        @csrf
        <input type="hidden" name="id" value="{{ $id }}">
        <input type="submit" value="Verify Email" class="btn">
    </form>
  </body>
</html>
