# AutoLabel Website Setup Script (PowerShell)
Write-Host "🚀 AutoLabel Website Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-Not (Test-Path .env.local)) {
    Write-Host "⚠️  .env.local nicht gefunden. Erstelle aus .env.local.example..." -ForegroundColor Yellow
    Copy-Item .env.local.example .env.local
    Write-Host "✅ .env.local erstellt. Bitte füllen Sie die Werte aus!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Erforderliche Werte:"
    Write-Host "  - DATABASE_URL"
    Write-Host "  - NEXTAUTH_SECRET (generieren mit: openssl rand -base64 32)"
    Write-Host "  - NEXTAUTH_URL"
    Write-Host "  - Stripe Keys"
    Write-Host "  - Resend API Key"
    Write-Host "  - APP_DOWNLOAD_URL"
    Write-Host ""
    Read-Host "Drücken Sie Enter, wenn Sie die Werte ausgefüllt haben"
}

# Install dependencies
Write-Host "📦 Installiere Dependencies..." -ForegroundColor Cyan
npm install

# Generate Prisma Client
Write-Host "🔧 Generiere Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# Push Database Schema
Write-Host "🗄️  Erstelle Datenbank..." -ForegroundColor Cyan
npx prisma db push

Write-Host ""
Write-Host "✅ Setup abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "Nächste Schritte:"
Write-Host "  1. Stripe Products und Prices erstellen"
Write-Host "  2. Stripe Webhook einrichten"
Write-Host "  3. Resend Domain verifizieren"
Write-Host "  4. npm run dev - Development Server starten"
Write-Host ""
Write-Host "Weitere Informationen: siehe SETUP.md"

