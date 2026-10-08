$h = Get-Content -Raw -Path "home_check.html"
Write-Output ("h1 count: " + ([regex]::Matches($h, '<h1')).Count)
Write-Output ("header tag count: " + ([regex]::Matches($h, '<header')).Count)
Write-Output ("id=hero count: " + ([regex]::Matches($h, 'id="hero"')).Count)
Write-Output ("id=showcases count: " + ([regex]::Matches($h, 'id="showcases"')).Count)
Write-Output ("id=introduce count: " + ([regex]::Matches($h, 'id="introduce"')).Count)
Write-Output ("id=faq count: " + ([regex]::Matches($h, 'id="faq"')).Count)
Write-Output ("id=cta count: " + ([regex]::Matches($h, 'id="cta"')).Count)
Write-Output ("Good to Know count: " + ([regex]::Matches($h, 'Good to Know')).Count)
Write-Output ("One Photo. Three Steps. count: " + ([regex]::Matches($h, 'One Photo. Three Steps')).Count)
Write-Output ("id=footer count: " + ([regex]::Matches($h, '<footer')).Count)
# find all section ids in order
$ids = [regex]::Matches($h, '<section[^>]*id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
Write-Output ("section id order: " + ($ids -join ", "))
