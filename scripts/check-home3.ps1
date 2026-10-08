$h = Get-Content -Raw -Path "home_check2.html"
Write-Output ("len=" + $h.Length)
$title = [regex]::Match($h, '<title>(.*?)</title>')
Write-Output ("title: " + $title.Groups[1].Value)
$kw = [regex]::Match($h, '<meta name="keywords" content="(.*?)"')
Write-Output ("keywords: " + $kw.Groups[1].Value)
$ids = [regex]::Matches($h, '<section[^>]*id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
Write-Output ("section ids: " + ($ids -join ", "))
Write-Output ("video tags: " + ([regex]::Matches($h, '<video')).Count)
Write-Output ("r2.dev refs: " + ([regex]::Matches($h, 'pub-6ab1450befe34972b47f82c99ea0b190\.r2\.dev')).Count)
Write-Output ("Coming Soon: " + ([regex]::Matches($h, 'Coming Soon')).Count)
Write-Output ("dark class on html: " + ($h -match 'class="[^"]*dark'))
Write-Output ("Get Started old cta: " + ([regex]::Matches($h, 'Get Started')).Count)
Write-Output ("Pricing nav: " + ([regex]::Matches($h, '"/pricing"')).Count)
