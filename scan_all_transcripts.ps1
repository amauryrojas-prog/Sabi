$brainDir = "C:\Users\Amaury\.gemini\antigravity\brain"
$subdirs = Get-ChildItem -Path $brainDir -Directory

$maxLength = 0
$bestText = $null
$bestSource = ""

foreach ($dir in $subdirs) {
    $logPath = Join-Path $dir.FullName ".system_generated\logs\transcript.jsonl"
    if (Test-Path $logPath) {
        Write-Output "Scanning $($dir.Name)..."
        $lines = Get-Content -Path $logPath
        foreach ($line in $lines) {
            # Search for write_to_file or replace_file_content targetting style.css
            if ($line.Contains("style.css")) {
                try {
                    $obj = ConvertFrom-Json $line
                    # Check for tool_calls in MODEL action
                    if ($obj.tool_calls) {
                        foreach ($tc in $obj.tool_calls) {
                            if ($tc.name -in @("write_to_file", "replace_file_content") -and $tc.args.TargetFile -like "*style.css*") {
                                $code = $tc.args.CodeContent
                                if (!$code) {
                                    $code = $tc.args.ReplacementContent
                                }
                                if ($code -and $code.Length -gt $maxLength) {
                                    $maxLength = $code.Length
                                    $bestText = $code
                                    $bestSource = "$($dir.Name) step $($obj.step_index) ($($tc.name))"
                                }
                            }
                        }
                    }
                } catch {}
            }
        }
    }
}

if ($bestText) {
    Write-Output "Found best style.css content from $bestSource with length $maxLength"
    $bestText | Out-File -FilePath "recovered_best_style.txt" -Encoding utf8
} else {
    Write-Output "No content found"
}
