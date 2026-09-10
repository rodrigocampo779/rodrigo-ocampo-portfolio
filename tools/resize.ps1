Add-Type -AssemblyName System.Drawing

$src = "C:\Users\aylen\Desktop\rodrigo-ocampo-portfolio\assets\photos\source"
$dst = "C:\Users\aylen\Desktop\rodrigo-ocampo-portfolio\assets\img"

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)

function Resize-Image($inPath, $outPath, $maxW, $quality) {
  $img = [System.Drawing.Image]::FromFile($inPath)
  # Respect EXIF orientation
  if ($img.PropertyIdList -contains 0x0112) {
    $orientation = $img.GetPropertyItem(0x0112).Value[0]
    switch ($orientation) {
      3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
      6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
      8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }
  }
  $ratio = [Math]::Min(1.0, $maxW / $img.Width)
  $w = [int]($img.Width * $ratio)
  $h = [int]($img.Height * $ratio)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $w, $h)
  $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($outPath, $jpegCodec, $encParams)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  $size = (Get-Item $outPath).Length
  Write-Host "$([System.IO.Path]::GetFileName($outPath)): ${w}x${h} q$quality -> $([Math]::Round($size/1KB)) KB"
}

Resize-Image "$src\hero-rodrigo.jpg"   "$dst\hero-rodrigo.jpg"   1400 80
Resize-Image "$src\hero-camino.jpg"    "$dst\hero-camino.jpg"    1600 78
Resize-Image "$src\origen-mate.jpg"    "$dst\origen-mate.jpg"    1200 78
Resize-Image "$src\travel-playa.jpg"   "$dst\travel-playa.jpg"   1000 78
Resize-Image "$src\travel-verano.jpg"  "$dst\travel-verano.jpg"  1000 78
