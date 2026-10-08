# Generates branded placeholder PNGs for the AI Rumpelstiltskin homepage.
# ASCII-only on purpose: PowerShell 5.1 reads BOM-less files as ANSI.
param([string]$OutDir = ".\public\imgs\rumpelstiltskin")

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

function New-Card {
  param(
    [string]$OutPath,
    [int]$W,
    [int]$H,
    [string]$BigText,
    [string]$SmallText
  )

  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'

  # dark-to-gold vertical gradient background
  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 24, 18, 6),
    [System.Drawing.Color]::FromArgb(255, 82, 60, 12),
    90)
  $g.FillRectangle($brush, $rect)

  # gold accent bar on top edge
  $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 176, 32))
  $g.FillRectangle($goldBrush, 0, 0, $W, [int]($H * 0.018))

  # inner gold frame
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 200, 90), 2)
  $g.DrawRectangle($pen, 14, 14, $W - 28, $H - 28)

  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $fmt.LineAlignment = 'Center'

  # big headline, auto-shrink for long lines
  $bigSize = [int]($W * 0.085)
  if ($BigText.Length -gt 14) { $bigSize = [int]($W * 0.058) }
  $bigFont = New-Object System.Drawing.Font('Arial Black', $bigSize, [System.Drawing.FontStyle]::Bold)
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 250, 244, 225))
  $midRect = New-Object System.Drawing.RectangleF(40, ($H * 0.22), ($W - 80), ($H * 0.38))
  $g.DrawString($BigText, $bigFont, $whiteBrush, $midRect, $fmt)

  # small caption
  $smallFont = New-Object System.Drawing.Font('Arial', [int]($W * 0.026), [System.Drawing.FontStyle]::Regular)
  $goldText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 196, 64))
  $smallRect = New-Object System.Drawing.RectangleF(40, ($H * 0.62), ($W - 80), ($H * 0.14))
  $g.DrawString($SmallText, $smallFont, $goldText, $smallRect, $fmt)

  # bottom watermark tag
  $tagFont = New-Object System.Drawing.Font('Arial', [int]($W * 0.02), [System.Drawing.FontStyle]::Bold)
  $dimBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 240, 230, 200))
  $tagRect = New-Object System.Drawing.RectangleF(40, ($H * 0.86), ($W - 80), ($H * 0.08))
  $g.DrawString('AI RUMPELSTILTSKIN', $tagFont, $dimBrush, $tagRect, $fmt)

  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Output "saved $OutPath"
}

New-Card -OutPath (Join-Path $OutDir 'showcase-1.png') -W 1024 -H 640 -BigText 'GRANDMA MEETS THE GNOME' -SmallText 'Two generations. One tiny dancer.'
New-Card -OutPath (Join-Path $OutDir 'showcase-2.png') -W 1024 -H 640 -BigText 'CAT x THE LITTLE GUY' -SmallText 'Pets get a turn at the spinning wheel.'
New-Card -OutPath (Join-Path $OutDir 'showcase-3.png') -W 1024 -H 640 -BigText 'THE OFFICE TIP-TOE' -SmallText 'Your boss never saw it coming.'
New-Card -OutPath (Join-Path $OutDir 'what-is.png') -W 1200 -H 800 -BigText 'STRAW IN. GOLD OUT.' -SmallText 'One photo becomes a meme the whole feed quotes.'
