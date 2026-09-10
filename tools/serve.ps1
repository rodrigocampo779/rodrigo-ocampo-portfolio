param([int]$Port = 8792)
$root = Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName System.Net.HttpListener -ErrorAction SilentlyContinue
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"

$mime = @{
  ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript";
  ".json"="application/json"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg";
  ".png"="image/png"; ".webp"="image/webp"; ".svg"="image/svg+xml";
  ".ico"="image/x-icon"; ".woff"="font/woff"; ".woff2"="font/woff2";
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = $req.Url.AbsolutePath.TrimStart("/")
    if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
    $full = Join-Path $root $path
    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full)
      $ct = $mime[$ext]
      if (-not $ct) { $ct = "application/octet-stream" }
      $res.ContentType = $ct
      $res.Headers.Add("Cache-Control", "no-cache")
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
