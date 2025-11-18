# Test Upload and Stream Audio
Write-Host "Testing Audio Upload and Streaming..." -ForegroundColor Green
Write-Host ""

# Step 1: Login as admin
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        password = "admin123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/login" -Method POST -ContentType "application/json" -Body $loginBody
    
    if ($response.StatusCode -eq 200) {
        $content = $response.Content | ConvertFrom-Json
        $token = $content.token
        Write-Host "✅ Admin login successful" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Admin login failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create a test audio file (simple text file for testing)
Write-Host ""
Write-Host "2. Creating test audio file..." -ForegroundColor Yellow
$testAudioPath = "test-audio.txt"
"Test audio content" | Out-File -FilePath $testAudioPath -Encoding UTF8
Write-Host "✅ Test file created: $testAudioPath" -ForegroundColor Green

# Step 3: Upload audio file
Write-Host ""
Write-Host "3. Uploading audio file..." -ForegroundColor Yellow
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"title`"",
        "",
        "Test Audio Clip",
        "--$boundary",
        "Content-Disposition: form-data; name=`"password`"",
        "",
        "test123",
        "--$boundary",
        "Content-Disposition: form-data; name=`"audio`"; filename=`"test-audio.txt`"",
        "Content-Type: text/plain",
        "",
        "Test audio content",
        "--$boundary--",
        ""
    ) -join $LF
    
    $headers = @{
        'x-auth-token' = $token
        'Content-Type' = "multipart/form-data; boundary=$boundary"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/upload" -Method POST -Headers $headers -Body $bodyLines
    
    if ($response.StatusCode -eq 201) {
        $uploadResult = $response.Content | ConvertFrom-Json
        $clipId = $uploadResult.clip.id
        Write-Host "✅ Audio uploaded successfully" -ForegroundColor Green
        Write-Host "   Clip ID: $clipId" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Upload failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
}

# Step 4: Test password verification
Write-Host ""
Write-Host "4. Testing password verification..." -ForegroundColor Yellow
try {
    $verifyBody = @{
        password = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/audio/verify/$clipId" -Method POST -ContentType "application/json" -Body $verifyBody
    
    if ($response.StatusCode -eq 200) {
        $verifyResult = $response.Content | ConvertFrom-Json
        $streamToken = $verifyResult.streamToken
        Write-Host "✅ Password verification successful" -ForegroundColor Green
        Write-Host "   Stream Token: $streamToken" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Password verification failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test audio streaming
Write-Host ""
Write-Host "5. Testing audio streaming..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/audio/stream/$clipId/$streamToken" -Method GET
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Audio streaming successful" -ForegroundColor Green
        Write-Host "   Content Length: $($response.Headers.'Content-Length')" -ForegroundColor Cyan
        Write-Host "   Content Type: $($response.Headers.'Content-Type')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Audio streaming failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
Write-Host ""
Write-Host "6. Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path $testAudioPath -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup completed" -ForegroundColor Green

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green
Write-Host ""
Write-Host "If streaming works, the issue might be in the frontend." -ForegroundColor Cyan
Write-Host "Check browser console for errors when accessing the share link." -ForegroundColor Cyan







