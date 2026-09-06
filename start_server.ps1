# Sabí Local Development Server
# Run this file with PowerShell to launch Sabí on localhost:8080

$port = 8089
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

# Stop existing listener if any
if ($listener.IsListening) {
    $listener.Stop()
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   ⚡ SABÍ SUPER-APP LOCAL WEB SERVER ⚡" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting server on http://localhost:$port/ ..." -ForegroundColor Green

try {
    $listener.Start()
    Write-Host "Server started successfully!" -ForegroundColor Green
    Write-Host "Opening http://localhost:$port/ in your default browser..." -ForegroundColor Yellow
    Write-Host "Keep this window open. Press Ctrl+C in this console to stop the server." -ForegroundColor Red
    
    # Auto-open browser
    Start-Process "http://localhost:$port/"
    
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $path = $request.Url.LocalPath
            if ($path -eq "/" -or $path -eq "") {
                $path = "/index.html"
            }
            
            # Replace forward slashes with backward slashes for Windows path joining
            $relativePath = $path.TrimStart('/').Replace('/', '\')
            $filePath = Join-Path $PSScriptRoot $relativePath
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                
                # Resolve content types
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".ico"  { "image/x-icon" }
                    ".svg"  { "image/svg+xml" }
                    ".json" { "application/json" }
                    ".mp4"  { "video/mp4" }
                    default { "application/octet-stream" }
                }
                
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            }
            $response.Close()
        }
        catch {
            Write-Host "Error processing request: $_" -ForegroundColor DarkYellow
            try { $response.Close() } catch {}
        }
    }
}
catch {
    Write-Host "Error running server: $_" -ForegroundColor Red
}
finally {
    if ($null -ne $listener) {
        $listener.Stop()
    }
}
