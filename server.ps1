$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "PowerShell HTTP Server listening on http://127.0.0.1:8080/ ..."
try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
            if ($localPath -eq "/") { $localPath = "/index.html" }
            
            # Strip leading slash
            $relPath = $localPath.Substring(1)
            $filePath = Join-Path "C:\Users\Stanley\.gemini\antigravity\scratch\lifeguard-project" $relPath
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "application/octet-stream"
                if ($ext -eq ".html" -or $ext -eq ".htm") { $contentType = "text/html; charset=utf-8" }
                elseif ($ext -eq ".css") { $contentType = "text/css" }
                elseif ($ext -eq ".js") { $contentType = "application/javascript" }
                elseif ($ext -eq ".png") { $contentType = "image/png" }
                elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
                elseif ($ext -eq ".gif") { $contentType = "image/gif" }
                elseif ($ext -eq ".mp4") { $contentType = "video/mp4" }
                elseif ($ext -eq ".mov") { $contentType = "video/quicktime" }
                elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
                
                $response.ContentType = $contentType
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "200: $localPath ($contentType)"
            } else {
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentType = "text/plain"
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                Write-Host "404: $localPath"
            }
            $response.Close()
        } catch {
            Write-Host "Request error: $_"
        }
    }
} finally {
    $listener.Stop()
}
