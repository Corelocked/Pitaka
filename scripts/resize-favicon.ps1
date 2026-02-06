Add-Type -AssemblyName System.Drawing
$in = 'public\budgetbook-logo.png'
$out = 'public\favicon-32.png'
$img = [System.Drawing.Image]::FromFile($in)
$thumb = New-Object System.Drawing.Bitmap 32,32
$g = [System.Drawing.Graphics]::FromImage($thumb)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img,0,0,32,32)
$thumb.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$thumb.Dispose()
$img.Dispose()
Write-Host "Wrote $out - $(Get-Item $out).Length bytes"
