# Email-Verifizierung & OAuth Implementation - Zusammenfassung

## ✅ Implementierte Features

### 1. Email-Verifizierung
- ✅ Neue Benutzer erhalten Verifizierungs-Email nach Registrierung
- ✅ Email-Verifizierung erforderlich für Desktop-App Login
- ✅ Verifizierungs-Token sind 24 Stunden gültig
- ✅ Erneutes Senden der Verifizierungs-Email möglich
- ✅ Schöne UI für Verifizierungs-Seite

### 2. Google OAuth
- ✅ Google Login auf Website integriert
- ✅ OAuth-Benutzer automatisch verifiziert
- ✅ Account-Linking mit gleicher Email-Adresse
- ✅ Sichere Token-Speicherung in Datenbank

### 3. Desktop-App Kompatibilität
- ✅ `/api/auth/app/login` prüft Email-Verifizierung
- ✅ Klare Fehlermeldungen für unverifizierte Accounts
- ✅ OAuth-Accounts können Desktop-App nicht nutzen (nur Website)
- ✅ Bestehende Desktop-App-Funktionalität bleibt erhalten

## 📁 Geänderte/Neue Dateien

### Datenbank
- `website/prisma/schema.prisma` - Schema erweitert (User, Account, VerificationToken)

### Backend (API Routes)
- `website/app/api/auth/register/route.ts` - Sendet Verifizierungs-Email
- `website/app/api/auth/verify-email/route.ts` - **NEU**: Verifiziert Email
- `website/app/api/auth/resend-verification/route.ts` - **NEU**: Sendet Email erneut
- `website/app/api/auth/app/login/route.ts` - Prüft Email-Verifizierung

### Auth-Konfiguration
- `website/app/lib/auth.ts` - Google OAuth Provider hinzugefügt
- `website/types/next-auth.d.ts` - TypeScript-Typen erweitert

### Email-Templates
- `website/app/lib/email.ts` - `sendVerificationEmail()` hinzugefügt

### Frontend (UI)
- `website/app/login/page.tsx` - Google OAuth Button hinzugefügt
- `website/app/register/page.tsx` - Google OAuth Button hinzugefügt
- `website/app/verify-email/page.tsx` - **NEU**: Verifizierungs-Seite

### Dokumentation
- `website/EMAIL_VERIFICATION_OAUTH_SETUP.md` - **NEU**: Setup-Anleitung
- `website/IMPLEMENTATION_NOTES.md` - **NEU**: Diese Datei

## 🔧 Erforderliche Environment Variables

Füge diese zu deiner `.env` oder `.env.local` hinzu:

```env
# Google OAuth (NEU)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# NextAuth (bereits vorhanden, aber wichtig)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Email (bereits vorhanden)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

## 🚀 Nächste Schritte

### 1. Google OAuth einrichten
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle OAuth 2.0 Client ID
3. Füge Redirect URI hinzu: `http://localhost:3000/api/auth/callback/google`
4. Kopiere Client ID und Secret in `.env`

### 2. Datenbank aktualisieren
```bash
cd website
npx prisma db push
npx prisma generate
```

### 3. Dependencies installieren (falls nötig)
```bash
npm install @auth/prisma-adapter
```

### 4. Server neu starten
```bash
npm run dev
```

### 5. Testen
1. **Registrierung**: Neuen Account erstellen → Verifizierungs-Email erhalten
2. **Verifizierung**: Link in Email klicken → Account verifiziert
3. **Login**: Mit verifizierten Account einloggen
4. **Google OAuth**: "Sign in with Google" testen
5. **Desktop-App**: Login mit verifizierten Account testen

## 🔄 User Flow

### Neue Registrierung (Email/Passwort)
1. User registriert sich auf `/register`
2. Account wird erstellt mit `emailVerified = null`
3. Verifizierungs-Email wird gesendet
4. User klickt auf Link in Email
5. `/verify-email?token=...` setzt `emailVerified = NOW()`
6. User kann sich einloggen und Desktop-App nutzen

### Google OAuth Registrierung
1. User klickt "Sign up with Google" auf `/register`
2. Google OAuth Flow
3. Account wird erstellt mit `emailVerified = NOW()` (automatisch)
4. User ist sofort eingeloggt
5. User kann Website nutzen (aber NICHT Desktop-App)

### Desktop-App Login
1. User öffnet Desktop-App
2. Gibt Email/Passwort ein
3. API prüft `emailVerified`:
   - ✅ Verifiziert → Login erfolgreich
   - ❌ Nicht verifiziert → Fehlermeldung: "Bitte bestätigen Sie zuerst Ihre E-Mail"
   - ❌ OAuth-Account → Fehlermeldung: "Dieser Account verwendet OAuth-Login"

## ⚠️ Wichtige Hinweise

### Bestehende Benutzer
Bestehende Benutzer haben `emailVerified = null`. Optionen:

**Option 1: Manuell verifizieren (empfohlen für wenige User)**
```sql
UPDATE "User" SET "emailVerified" = NOW() WHERE "email" = 'user@example.com';
```

**Option 2: Alle bestehenden User verifizieren**
```sql
UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;
```

**Option 3: Verifizierungs-Email senden**
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### OAuth vs. Desktop-App
- OAuth-Accounts haben `password = null`
- Desktop-App funktioniert NUR mit Email/Passwort-Accounts
- OAuth ist nur für Website-Login gedacht
- Dies ist ein Sicherheits-Feature (OAuth-Tokens sollten nicht in Desktop-App gespeichert werden)

### Email-Versand
- Stelle sicher, dass `RESEND_API_KEY` und `EMAIL_FROM` korrekt sind
- Domain muss in Resend verifiziert sein
- Teste Email-Versand vor Production-Deployment

## 🐛 Bekannte Probleme & Lösungen

### Problem: Prisma Client Fehler nach Schema-Änderung
**Lösung**: 
```bash
npx prisma generate
# Server neu starten
```

### Problem: "EPERM: operation not permitted" bei Prisma Generate
**Lösung**: 
- Windows-Dateisperre, normalerweise harmlos
- Wenn Probleme: Dev-Server stoppen, dann `npx prisma generate`

### Problem: Google OAuth Redirect funktioniert nicht
**Lösung**:
- Überprüfe Redirect URI in Google Console
- Muss exakt sein: `http://localhost:3000/api/auth/callback/google`
- Keine trailing slashes!

## 📊 Datenbank-Schema-Änderungen

### User Table
```sql
ALTER TABLE "User" 
  ADD COLUMN "emailVerified" TIMESTAMP,
  ADD COLUMN "image" TEXT,
  ALTER COLUMN "password" DROP NOT NULL;
```

### Neue Tables
```sql
CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  UNIQUE("provider", "providerAccountId")
);

CREATE TABLE "VerificationToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "used" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## ✅ Testing Checklist

- [ ] Neue Registrierung mit Email/Passwort
- [ ] Verifizierungs-Email erhalten
- [ ] Email-Verifizierung über Link
- [ ] Login nach Verifizierung
- [ ] Desktop-App Login mit verifiziertem Account
- [ ] Desktop-App Login mit nicht-verifiziertem Account (sollte fehlschlagen)
- [ ] Google OAuth Registrierung
- [ ] Google OAuth Login
- [ ] Erneutes Senden der Verifizierungs-Email
- [ ] Abgelaufener Token (nach 24h)
- [ ] Bereits verwendeter Token

## 📚 Weitere Dokumentation

Siehe `EMAIL_VERIFICATION_OAUTH_SETUP.md` für:
- Detaillierte Setup-Anleitung
- API-Dokumentation
- Troubleshooting
- Production Deployment

