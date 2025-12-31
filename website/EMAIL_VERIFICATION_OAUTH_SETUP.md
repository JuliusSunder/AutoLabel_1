# Email-Verifizierung & Google OAuth Setup

Diese Anleitung erklärt, wie Sie das neue Email-Verifizierungs-System und Google OAuth für AutoLabel einrichten.

## 🎯 Was wurde implementiert?

### 1. Email-Verifizierung
- **Registrierung**: Neue Benutzer erhalten eine Verifizierungs-Email
- **Verifizierungs-Link**: 24 Stunden gültig
- **Desktop-App Schutz**: Nur verifizierte Accounts können sich in der Desktop-App einloggen
- **Erneutes Senden**: API-Endpoint zum erneuten Senden der Verifizierungs-Email

### 2. Google OAuth Login
- **Website-Login**: Benutzer können sich mit Google anmelden
- **Auto-Verifizierung**: OAuth-Benutzer sind automatisch verifiziert
- **Account-Linking**: Accounts mit gleicher Email werden verknüpft
- **Desktop-App**: Nutzt weiterhin Email/Passwort über `/api/auth/app/login`

## 📋 Datenbank-Änderungen

Das Schema wurde erweitert um:

```prisma
model User {
  emailVerified DateTime?  // Email-Verifizierungs-Zeitstempel
  image         String?     // Profilbild von OAuth
  password      String?     // Optional für OAuth-User
  
  accounts             Account[]
  verificationTokens   VerificationToken[]
}

model Account {
  // OAuth-Accounts (Google, etc.)
  provider          String
  providerAccountId String
  access_token      String?
  refresh_token     String?
  // ...
}

model VerificationToken {
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
}
```

## 🔧 Setup-Schritte

### 1. Google OAuth einrichten

#### A. Google Cloud Console

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die **Google+ API**
4. Gehe zu **APIs & Services** → **Credentials**
5. Klicke auf **Create Credentials** → **OAuth 2.0 Client ID**
6. Wähle **Web application**
7. Füge hinzu:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (Development)
     - `https://yourdomain.com` (Production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (Development)
     - `https://yourdomain.com/api/auth/callback/google` (Production)
8. Kopiere **Client ID** und **Client Secret**

#### B. Environment Variables

Füge zu deiner `.env` oder `.env.local` hinzu:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # Production: https://yourdomain.com
NEXTAUTH_SECRET="your-nextauth-secret"  # Generiere mit: openssl rand -base64 32

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Database
DATABASE_URL="postgresql://..."
```

### 2. Datenbank migrieren

```bash
cd website
npx prisma db push
# oder für Production:
npx prisma migrate deploy
```

### 3. Prisma Client neu generieren

```bash
npx prisma generate
```

### 4. Server neu starten

```bash
npm run dev
```

## 🧪 Testen

### Email-Verifizierung testen

1. **Registrierung**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test1234","name":"Test User"}'
   ```

2. **Verifizierungs-Email prüfen**: Überprüfe dein Email-Postfach

3. **Verifizierungs-Link klicken**: Format: `/verify-email?token=...`

4. **Desktop-App Login testen**:
   - Vor Verifizierung: Fehlermeldung
   - Nach Verifizierung: Erfolgreich

### Google OAuth testen

1. Gehe zu `/login`
2. Klicke auf "Sign in with Google"
3. Wähle dein Google-Konto
4. Nach erfolgreicher Anmeldung: Automatisch verifiziert

## 📡 API-Endpoints

### POST `/api/auth/register`
Registriert einen neuen Benutzer und sendet Verifizierungs-Email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "message": "Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail...",
  "user": { "id": "...", "email": "...", "name": "..." },
  "requiresVerification": true
}
```

### GET `/api/auth/verify-email?token=...`
Verifiziert die Email-Adresse eines Benutzers.

**Response:**
```json
{
  "success": true,
  "message": "E-Mail erfolgreich bestätigt..."
}
```

### POST `/api/auth/resend-verification`
Sendet die Verifizierungs-Email erneut.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verifizierungs-E-Mail wurde gesendet..."
}
```

### POST `/api/auth/app/login` (Desktop-App)
**Wichtig**: Prüft jetzt Email-Verifizierung!

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "uuid-v4",
  "deviceName": "AutoLabel Desktop"
}
```

**Response (nicht verifiziert):**
```json
{
  "error": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse..."
}
```
Status: `403 Forbidden`

**Response (verifiziert):**
```json
{
  "success": true,
  "accessToken": "jwt-token",
  "refreshToken": "uuid",
  "user": { "id": "...", "email": "...", "name": "..." },
  "subscription": { "plan": "free", "status": "active" }
}
```

## 🔐 Sicherheits-Features

### Email-Verifizierung
- ✅ Tokens sind 24 Stunden gültig
- ✅ Tokens können nur einmal verwendet werden
- ✅ Unverifizierte Accounts können Desktop-App nicht nutzen
- ✅ Verifizierungs-Emails können erneut angefordert werden

### OAuth
- ✅ OAuth-Accounts sind automatisch verifiziert
- ✅ Account-Linking mit gleicher Email
- ✅ Sichere Token-Speicherung in Datenbank
- ✅ Refresh-Token-Rotation

### Desktop-App
- ✅ Nur verifizierte Accounts erlaubt
- ✅ OAuth-Accounts können Desktop-App nicht nutzen (nur Website)
- ✅ Klare Fehlermeldungen für Benutzer

## 🎨 UI-Änderungen

### Login-Seite (`/login`)
- ✅ Google OAuth Button hinzugefügt
- ✅ Fehlermeldung bei nicht-verifizierter Email
- ✅ Erfolgsmeldung nach Email-Verifizierung

### Registrierungs-Seite (`/register`)
- ✅ Google OAuth Button hinzugefügt
- ✅ Hinweis auf Email-Verifizierung
- ✅ Redirect zu Login mit Verifizierungs-Hinweis

### Neue Seite: Email-Verifizierung (`/verify-email`)
- ✅ Automatische Verifizierung beim Öffnen des Links
- ✅ Erfolgs- und Fehler-Anzeige
- ✅ Auto-Redirect zu Login nach Erfolg

## 🚀 Production Deployment

### 1. Environment Variables setzen

Stelle sicher, dass alle Environment Variables in Production gesetzt sind:

```env
GOOGLE_CLIENT_ID="production-client-id"
GOOGLE_CLIENT_SECRET="production-client-secret"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
DATABASE_URL="postgresql://..."
```

### 2. Google OAuth Redirect URIs aktualisieren

Füge in Google Cloud Console die Production-URL hinzu:
- `https://yourdomain.com/api/auth/callback/google`

### 3. Datenbank migrieren

```bash
npx prisma migrate deploy
```

### 4. Build & Deploy

```bash
npm run build
npm run start
```

## 🐛 Troubleshooting

### Problem: "Email nicht verifiziert" in Desktop-App

**Lösung**: 
1. Überprüfe Email-Postfach für Verifizierungs-Email
2. Klicke auf Verifizierungs-Link
3. Versuche erneut einzuloggen

### Problem: Google OAuth funktioniert nicht

**Lösung**:
1. Überprüfe `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET`
2. Stelle sicher, dass Redirect URI korrekt ist
3. Prüfe Google Cloud Console für Fehler
4. Stelle sicher, dass Google+ API aktiviert ist

### Problem: Verifizierungs-Email kommt nicht an

**Lösung**:
1. Überprüfe `RESEND_API_KEY` und `EMAIL_FROM`
2. Prüfe Spam-Ordner
3. Überprüfe Resend Dashboard für Fehler
4. Stelle sicher, dass Domain verifiziert ist
5. Nutze `/api/auth/resend-verification` zum erneuten Senden

### Problem: "Token ist abgelaufen"

**Lösung**:
1. Nutze `/api/auth/resend-verification` für neuen Token
2. Token sind 24 Stunden gültig

## 📝 Hinweise für Entwickler

### Bestehende Benutzer

Bestehende Benutzer in der Datenbank haben `emailVerified = null`. Sie müssen:
1. Entweder manuell in der Datenbank verifiziert werden:
   ```sql
   UPDATE "User" SET "emailVerified" = NOW() WHERE "email" = 'user@example.com';
   ```
2. Oder eine neue Verifizierungs-Email anfordern über `/api/auth/resend-verification`

### Migration Script (Optional)

Für bestehende Benutzer kannst du ein Script erstellen:

```typescript
// scripts/verify-existing-users.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Verifiziere alle bestehenden Benutzer
  await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() },
  });
  
  console.log('All existing users verified');
}

main();
```

## ✅ Checkliste

- [ ] Google OAuth Client ID & Secret erhalten
- [ ] Environment Variables gesetzt
- [ ] Datenbank migriert (`npx prisma db push`)
- [ ] Prisma Client generiert (`npx prisma generate`)
- [ ] Server neu gestartet
- [ ] Email-Verifizierung getestet
- [ ] Google OAuth getestet
- [ ] Desktop-App Login getestet (verifiziert & nicht-verifiziert)
- [ ] Production Redirect URIs in Google Console hinzugefügt
- [ ] Bestehende Benutzer migriert (falls nötig)

## 📚 Weitere Ressourcen

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Resend Email API](https://resend.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

