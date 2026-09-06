$logPath = "C:\Users\Amaury\.gemini\antigravity\brain\f7eff51a-a96b-468e-84c4-fb3d081c89ab\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath

foreach ($line in $lines) {
    if ($line.Contains("style.css")) {
        try {
            $obj = ConvertFrom-Json $line
            if ($obj.tool_calls) {
                foreach ($tc in $obj.tool_calls) {
                    if ($tc.args.TargetFile -like "*style.css*" -or $tc.args.AbsolutePath -like "*style.css*") {
                        Write-Output "Step $($obj.step_index): Tool=$($tc.name) ArgsKeys=$($tc.args.PSObject.Properties.Name -join ',')"
                    }
                }
            }
        } catch {}
    }
}
