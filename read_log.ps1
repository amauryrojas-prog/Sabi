$logPath = "C:\Users\Amaury\.gemini\antigravity\brain\f7eff51a-a96b-468e-84c4-fb3d081c89ab\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath

$maxLength = 0
$bestLine = $null

foreach ($line in $lines) {
    if ($line.Contains("style.css") -and $line.Contains("write_to_file")) {
        try {
            $obj = ConvertFrom-Json $line
            if ($obj.tool_calls) {
                foreach ($tc in $obj.tool_calls) {
                    if ($tc.name -eq "write_to_file" -and $tc.args.TargetFile -like "*style.css*") {
                        $len = $tc.args.CodeContent.Length
                        if ($len -gt $maxLength) {
                            $maxLength = $len
                            $bestLine = $line
                        }
                    }
                }
            }
        } catch {}
    }
}

if ($bestLine) {
    Write-Output "Found best write_to_file line with length $maxLength"
    $bestLine | Out-File -FilePath "recovered_raw_line.txt" -Encoding utf8
} else {
    Write-Output "No line found"
}
