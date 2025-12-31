# Erforderliche Environment Variables

## 🆕 Neu hinzugefügt für Email-Verifizierung & OAuth

Diese Environment Variables müssen zu deiner `.env` oder `.env.local` Datei hinzugefügt werden:

### Google OAuth (NEU - ERFORDERLICH)
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Wo bekomme ich diese?**
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein Projekt oder wähle ein bestehendes
3. Gehe zu "APIs & Services" → "Credentials"
4. Erstelle "OAuth 2.0 Client ID"
5. Wähle "Web application"
6. Füge Redirect URI hinzu:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

## ✅ Bereits vorhanden (aber wichtig zu prüfen)

### NextAuth
```env
NEXTAUTH_URL="http://localhost:3000"  # Production: https://yourdomain.com
NEXTAUTH_SECRET="your-secret-key-here"
```

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

### Email Service (Resend)
```env
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@yourdomain.com"
```

**Wichtig**: 
- Domain muss in Resend verifiziert sein
- Siehe `RESEND_SETUP.md` für Details

### Database
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### JWT (für Desktop-App)
```env
JWT_SECRET="your-jwt-secret"
```

### Stripe (Payment)
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### App Download
```env
APP_DOWNLOAD_URL="https://yourdomain.com/download"
WEBSITE_URL="http://localhost:3000"
```

## 📋 Vollständige .env Vorlage

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth (NEU)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service (Resend)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@yourdomain.com"

# Stripe (Payment Processing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# App Download URL
APP_DOWNLOAD_URL="https://yourdomain.com/download"

# JWT Secret (for Desktop App)
JWT_SECRET="your-jwt-secret-for-desktop-app"

# Website URL (used by Desktop App)
WEBSITE_URL="http://localhost:3000"
```

## 🚨 Wichtige Hinweise

### Development vs. Production

**Development (.env.local):**
- `NEXTAUTH_URL="http://localhost:3000"`
- `WEBSITE_URL="http://localhost:3000"`
- Google Redirect URI: `http://localhost:3000/api/auth/callback/google`

**Production (.env):**
- `NEXTAUTH_URL="https://yourdomain.com"`
- `WEBSITE_URL="https://yourdomain.com"`
- Google Redirect URI: `https://yourdomain.com/api/auth/callback/google`

### Secrets Generieren

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# JWT_SECRET
openssl rand -base64 32
```

### Überprüfung

Nach dem Setzen der Environment Variables:

```bash
# Server neu starten
npm run dev

# Überprüfe ob alle Variablen geladen sind
# In der Browser-Konsole (nur für öffentliche Variablen):
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
```

## ❌ Häufige Fehler

### "GOOGLE_CLIENT_ID is not defined"
**Lösung**: 
- Stelle sicher, dass `.env.local` existiert
- Variablen müssen ohne Anführungszeichen sein (außer bei Leerzeichen)
- Server neu starten nach Änderungen

### "Invalid redirect_uri"
**Lösung**:
- Überprüfe Google Cloud Console
- Redirect URI muss EXAKT übereinstimmen
- Keine trailing slashes!
- HTTP vs HTTPS beachten

### "Email service is not configured"
**Lösung**:
- `RESEND_API_KEY` und `EMAIL_FROM` setzen
- Domain in Resend verifizieren
- Siehe `RESEND_SETUP.md`

## ✅ Checkliste

- [ ] `GOOGLE_CLIENT_ID` gesetzt
- [ ] `GOOGLE_CLIENT_SECRET` gesetzt
- [ ] `NEXTAUTH_SECRET` generiert und gesetzt
- [ ] `NEXTAUTH_URL` korrekt für Environment
- [ ] `RESEND_API_KEY` gesetzt
- [ ] `EMAIL_FROM` gesetzt (verifizierte Domain)
- [ ] `DATABASE_URL` gesetzt
- [ ] `JWT_SECRET` gesetzt
- [ ] Alle Stripe-Keys gesetzt (falls Payment verwendet)
- [ ] Server neu gestartet
- [ ] Google OAuth getestet
- [ ] Email-Versand getestet

