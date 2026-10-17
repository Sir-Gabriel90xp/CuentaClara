Add-Type -AssemblyName System.Drawing
$ogRoot = Split-Path -Parent $PSScriptRoot
$ogDirectory = Join-Path $ogRoot 'public/og'
New-Item -ItemType Directory -Force $ogDirectory | Out-Null
$bitmap = [System.Drawing.Bitmap]::new(1200,630)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#FBFAF7'))
$primary = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#0F4C5C'))
$muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#5A6570'))
$accent = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#E0A100'))
$brandFont = [System.Drawing.Font]::new('Arial',[single]30,[System.Drawing.FontStyle]::Bold)
$titleFont = [System.Drawing.Font]::new('Georgia',[single]58)
$subtitleFont = [System.Drawing.Font]::new('Georgia',[single]36)
$smallFont = [System.Drawing.Font]::new('Arial',[single]20)
$graphics.FillRectangle($primary,0,0,1200,18)
$graphics.DrawString('cuenta clara.',$brandFont,$primary,76,65)
$graphics.DrawString('Las cuentas claras.',$titleFont,$primary,70,190)
$graphics.DrawString('La vida, un poco más sencilla.',$subtitleFont,$primary,75,290)
$graphics.DrawString('Remesas  /  Crédito  /  Ahorro  /  Presupuesto',$smallFont,$muted,80,420)
$graphics.FillRectangle($accent,80,505,130,6)
$bitmap.Save((Join-Path $ogDirectory 'cover.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose()
$primary.Dispose(); $muted.Dispose(); $accent.Dispose()
$brandFont.Dispose(); $titleFont.Dispose(); $subtitleFont.Dispose(); $smallFont.Dispose()
