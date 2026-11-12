Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'apps/toss/assets/branding/app-logo-light-600-v1.png'
$resourceRoot = Join-Path $projectRoot 'apps/mobile/android/app/src/main/res'
$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
    foreach ($entry in @(@('mdpi', 48, 108), @('hdpi', 72, 162), @('xhdpi', 96, 216), @('xxhdpi', 144, 324), @('xxxhdpi', 192, 432))) {
        $directory = Join-Path $resourceRoot ('mipmap-' + $entry[0])
        foreach ($name in @('ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground')) {
            $foreground = $name -eq 'ic_launcher_foreground'
            $size = if ($foreground) { [int]$entry[2] } else { [int]$entry[1] }
            $bitmap = New-Object System.Drawing.Bitmap($size, $size)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.Clear([System.Drawing.Color]::White)
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                # The original logo already has whitespace; add adaptive-mask safety margin.
                $drawSize = if ($foreground) { [int][Math]::Round($size * 8 / 9) } else { $size }
                $offset = [int][Math]::Floor(($size - $drawSize) / 2)
                $graphics.DrawImage($source, $offset, $offset, $drawSize, $drawSize)
                $bitmap.Save((Join-Path $directory ($name + '.png')), [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                $graphics.Dispose()
                $bitmap.Dispose()
            }
        }
    }
} finally {
    $source.Dispose()
}
Write-Output 'Android launcher icons prepared: 15 PNG files.'
