$line = Get-Content -Raw -Path recovered_raw_line.txt
$obj = ConvertFrom-Json $line

if ($obj.tool_calls) {
    foreach ($tc in $obj.tool_calls) {
        if ($tc.name -eq "write_to_file") {
            $code = $tc.args.CodeContent
            $code | Set-Content -NoNewline -Path style.css
            Write-Output "Successfully restored style.css! Length: $($code.Length)"
        }
    }
}
