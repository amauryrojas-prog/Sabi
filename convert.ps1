$json = Get-Content -Raw -Path "c:\Users\Amaury\Downloads\lotto\winning_history.json"
$jsContent = "const LOTTO_DRAWS = " + $json + ";"
[System.IO.File]::WriteAllText("c:\Users\Amaury\Downloads\lotto\draws_data.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Success"
