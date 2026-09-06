$logPath = "C:\Users\Amaury\.gemini\antigravity\brain\f7eff51a-a96b-468e-84c4-fb3d081c89ab\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath

foreach ($line in $lines) {
    if ($line.Contains("style.css") -and $line.Contains("VIEW_FILE")) {
        try {
            $obj = ConvertFrom-Json $line
            if ($obj.content -and $obj.content.Length -gt 1000) {
                Write-Output "Step $($obj.step_index): content length $($obj.content.Length)"
                $obj.content | Out-File -FilePath "style_view_$($obj.step_index).txt" -Encoding utf8
            }
        } catch {}
    }
}
