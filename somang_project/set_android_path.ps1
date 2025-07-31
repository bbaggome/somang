$currentPath = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
$androidPaths = 'C:\Users\cjw92\AppData\Local\Android\Sdk\platform-tools;C:\Users\cjw92\AppData\Local\Android\Sdk\tools;C:\Users\cjw92\AppData\Local\Android\Sdk\tools\bin'

if (-not $currentPath.Contains('Android')) {
    $newPath = $currentPath + ';' + $androidPaths
    [System.Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
    Write-Host "Android SDK paths added to PATH"
} else {
    Write-Host "Android SDK paths already in PATH"
}