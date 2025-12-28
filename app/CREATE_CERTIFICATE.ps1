# AutoLabel Self-Signed Certificate Creation Script
# Run this script as Administrator in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoLabel Self-Signed Certificate Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Create Self-Signed Certificate
Write-Host "Step 1: Creating Self-Signed Certificate..." -ForegroundColor Yellow
Write-Host ""

try {
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=AutoLabel" `
        -CertStoreLocation Cert:\CurrentUser\My `
        -KeyUsage DigitalSignature `
        -KeySpec Signature `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -NotAfter (Get-Date).AddYears(1)
    
    Write-Host "Certificate created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate Details:" -ForegroundColor Cyan
    Write-Host "  Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
    Write-Host "  Subject:    $($cert.Subject)" -ForegroundColor White
    Write-Host "  Valid From: $($cert.NotBefore)" -ForegroundColor White
    Write-Host "  Valid To:   $($cert.NotAfter)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "ERROR: Failed to create certificate!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Export Certificate as .pfx
Write-Host "Step 2: Exporting Certificate as .pfx..." -ForegroundColor Yellow
Write-Host ""

# Ensure certs directory exists
$certsDir = ".\certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
    Write-Host "Created certs directory" -ForegroundColor Green
}

# Get password for certificate export
Write-Host "Enter a password for the certificate export:" -ForegroundColor Cyan
Write-Host "(This password will be stored in .env file)" -ForegroundColor Gray
$password = Read-Host "Password" -AsSecureString
Write-Host ""

# Export certificate
$certPath = ".\certs\autolabel.pfx"
try {
    Export-PfxCertificate `
        -Cert $cert `
        -FilePath $certPath `
        -Password $password | Out-Null
    
    Write-Host "Certificate exported to: $certPath" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "ERROR: Failed to export certificate!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 3: Create .env file
Write-Host "Step 3: Creating .env file..." -ForegroundColor Yellow
Write-Host ""

# Convert SecureString to plain text for .env file
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# Create .env content as array
$envLines = @()
$envLines += "# Windows Code Signing Configuration"
$envLines += "# DO NOT COMMIT THIS FILE!"
$envLines += ""
$envLines += "# Path to your code signing certificate (.pfx file)"
$envLines += "WINDOWS_CERT_PATH=./certs/autolabel.pfx"
$envLines += ""
$envLines += "# Password for the certificate"
$envLines += "WINDOWS_CERT_PASSWORD=$plainPassword"
$envLines += ""
$envLines += "# Optional: Signing Hash Algorithm (default: sha256)"
$envLines += "WINDOWS_CERT_HASH_ALGORITHM=sha256"
$envLines += ""
$envLines += "# Optional: Certificate Subject Name (for validation)"
$envLines += "WINDOWS_CERT_SUBJECT=CN=AutoLabel"

try {
    $envLines | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host ".env file created successfully!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "ERROR: Failed to create .env file!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 4: Verify setup
Write-Host "Step 4: Verifying setup..." -ForegroundColor Yellow
Write-Host ""

$checksPass = $true

# Check if certificate file exists
if (Test-Path $certPath) {
    Write-Host "Certificate file exists: $certPath" -ForegroundColor Green
}
else {
    Write-Host "Certificate file not found: $certPath" -ForegroundColor Red
    $checksPass = $false
}

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host ".env file exists" -ForegroundColor Green
}
else {
    Write-Host ".env file not found" -ForegroundColor Red
    $checksPass = $false
}

# Check if certificate is in store
$certInStore = Get-ChildItem Cert:\CurrentUser\My | Where-Object {$_.Subject -eq "CN=AutoLabel"}
if ($certInStore) {
    Write-Host "Certificate is in Windows Certificate Store" -ForegroundColor Green
}
else {
    Write-Host "Certificate not found in Windows Certificate Store" -ForegroundColor Red
    $checksPass = $false
}

Write-Host ""

# Final Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($checksPass) {
    Write-Host "All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Install dependencies: npm install --save-dev dotenv cross-env" -ForegroundColor White
    Write-Host "2. Build signed installer: npm run make:signed" -ForegroundColor White
    Write-Host "3. Test installer on clean Windows system" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT:" -ForegroundColor Yellow
    Write-Host "- .env file is in .gitignore (DO NOT COMMIT!)" -ForegroundColor White
    Write-Host "- Certificate is valid for 1 year" -ForegroundColor White
    Write-Host "- Windows will show SmartScreen warning (normal for Self-Signed)" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Cyan
    Write-Host "- See SELF_SIGNED_CERTIFICATE.md for details" -ForegroundColor White
    Write-Host "- See certs/README.md for certificate management" -ForegroundColor White
}
else {
    Write-Host "Some checks failed!" -ForegroundColor Yellow
    Write-Host "Please review the errors above and try again." -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
