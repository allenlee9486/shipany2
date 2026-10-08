$h = Get-Content -Raw -Path "home_check.html"
Write-Output ("len=" + $h.Length)
Write-Output ("occurrences Rumpelstiltskin: " + ([regex]::Matches($h, 'Rumpelstiltskin')).Count)
Write-Output ("occurrences ShipAny: " + ([regex]::Matches($h, 'ShipAny')).Count)
$title = [regex]::Match($h, '<title>(.*?)</title>')
Write-Output ("title: " + $title.Groups[1].Value)
$desc = [regex]::Match($h, '<meta name="description" content="(.*?)"')
Write-Output ("description: " + $desc.Groups[1].Value)
$kw = [regex]::Match($h, '<meta name="keywords" content="(.*?)"')
Write-Output ("keywords: " + $kw.Groups[1].Value)
$h1 = [regex]::Match($h, '<h1[^>]*>(?s).*?</h1>')
Write-Output ("h1: " + ($h1.Value -replace '<[^>]+>', ' ' -replace '\s+', ' '))
foreach ($m in [regex]::Matches($h, '.{60}ShipAny.{60}')) {
  Write-Output ("SHIPANY-CTX: " + $m.Value)
}
