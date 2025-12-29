#!/bin/bash

# AutoLabel Website Setup Script
echo "🚀 AutoLabel Website Setup"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local nicht gefunden. Erstelle aus .env.local.example..."
    cp .env.local.example .env.local
    echo "✅ .env.local erstellt. Bitte füllen Sie die Werte aus!"
    echo ""
    echo "Erforderliche Werte:"
    echo "  - DATABASE_URL"
    echo "  - NEXTAUTH_SECRET (generieren mit: openssl rand -base64 32)"
    echo "  - NEXTAUTH_URL"
    echo "  - Stripe Keys"
    echo "  - Resend API Key"
    echo "  - APP_DOWNLOAD_URL"
    echo ""
    read -p "Drücken Sie Enter, wenn Sie die Werte ausgefüllt haben..."
fi

# Install dependencies
echo "📦 Installiere Dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generiere Prisma Client..."
npx prisma generate

# Push Database Schema
echo "🗄️  Erstelle Datenbank..."
npx prisma db push

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "  1. Stripe Products und Prices erstellen"
echo "  2. Stripe Webhook einrichten"
echo "  3. Resend Domain verifizieren"
echo "  4. npm run dev - Development Server starten"
echo ""
echo "Weitere Informationen: siehe SETUP.md"

