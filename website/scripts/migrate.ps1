# Migration script for Vercel (PowerShell)
if ($env:DATABASE_URL) {
    Write-Host "Running database migrations..."
    npx prisma migrate deploy
} else {
    Write-Host "DATABASE_URL not set, skipping migrations"
}

