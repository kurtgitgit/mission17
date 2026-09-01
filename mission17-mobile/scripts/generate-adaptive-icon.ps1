Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot '..\assets\adaptive-icon.png'
$outputPath = Join-Path $PSScriptRoot '..\assets\adaptive-icon.generated.png'

$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $sourcePath))
$output = New-Object System.Drawing.Bitmap 1080, 1080, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($output)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Keep only the symbol (people, leaf, and infinity loop), excluding the wordmark.
$sourceRectangle = New-Object System.Drawing.Rectangle 330, 335, 420, 305
$destinationRectangle = New-Object System.Drawing.Rectangle 210, 295, 660, 480
$graphics.DrawImage($source, $destinationRectangle, $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)

$graphics.Dispose()
$source.Dispose()
$output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$output.Dispose()
