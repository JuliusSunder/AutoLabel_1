# Account-basierte Authentifizierung - Implementierung Abgeschlossen

## ✅ Implementierungsstatus

Alle geplanten Features wurden erfolgreich implementiert:

- ✅ Prisma Schema erweitert (Device, RefreshToken, Usage)
- ✅ JWT Helper Library erstellt
- ✅ 6 neue API Endpoints implementiert
- ✅ Auth Middleware für Token-Validierung
- ✅ Device Manager (UUID generieren/speichern)
- ✅ Token Storage mit electron-store (encrypted)
- ✅ Auth Manager mit login/refresh/validate
- ✅ Automatischer Token-Refresh Service
- ✅ Auth IPC Handler
- ✅ Labels IPC Handler angepasst (server-seitige Validierung)
- ✅ Alte License-System Dateien entfernt
- ✅ Types aktualisiert
- ✅ Preload API erweitert
- ✅ Login Modal Component
- ✅ Auth Guard Component
- ✅ Account Status Component
- ✅ Bestehende UI angepasst

## 🚀 Nächste Schritte (Deployment)

### 1. Environment Variables konfigurieren

**Website (.env.local):**
```bash
# Generiere ein starkes JWT Secret (z.B. mit: openssl rand -base64 32)
JWT_SECRET="dein-super-sicheres-secret-hier"
WEBSITE_URL="http://localhost:3000"  # In Production: https://autolabel.com
```

**Desktop App (.env):**
```bash
WEBSITE_URL="http://localhost:3000"  # In Production: https://autolabel.com
```

### 2. Datenbank Migration ausführen

```bash
cd website
npx prisma migrate dev --name add_device_auth_system
npx prisma generate
```

### 3. Dependencies installieren

**Website:**
```bash
cd website
npm install
# jsonwebtoken und @types/jsonwebtoken wurden bereits installiert
```

**Desktop App:**
```bash
cd app
npm install
# electron-store wurde bereits installiert
```

### 4. Testen

**Lokales Testing:**

1. **Website starten:**
   ```bash
   cd website
   npm run dev
   ```

2. **Desktop App starten:**
   ```bash
   cd app
   npm run start
   ```

3. **Test-Ablauf:**
   - Desktop App öffnet sich mit Login-Screen
   - Mit existierendem Account einloggen (oder neuen auf Website erstellen)
   - Nach erfolgreichem Login: App-Funktionen testen
   - Label-Erstellung testet automatisch server-seitige Validierung
   - Settings öffnen → Account-Status wird angezeigt

### 5. Production Deployment

**Website:**
1. JWT_SECRET in Production-Environment setzen
2. WEBSITE_URL auf Production-Domain setzen
3. Database Migration ausführen
4. Deploy

**Desktop App:**
1. WEBSITE_URL in Build-Config setzen
2. App neu bauen: `npm run make`
3. Signieren und verteilen

## 📋 Neue API Endpoints

### 1. POST /api/auth/app/login
Authentifiziert User und registriert Device.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "uuid-v4",
  "deviceName": "AutoLabel Desktop"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "jwt-token",
  "refreshToken": "uuid-v4",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "subscription": {
    "plan": "plus",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59Z"
  },
  "deviceId": "uuid-v4"
}
```

### 2. POST /api/auth/app/refresh
Erneuert Access Token.

**Request:**
```json
{
  "refreshToken": "uuid-v4"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "new-jwt-token",
  "refreshToken": "new-uuid-v4",
  "expiresIn": 900,
  "subscription": {
    "plan": "plus",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### 3. GET /api/auth/app/session
Gibt aktuelle Session-Info zurück.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "subscription": {
    "plan": "plus",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59Z"
  },
  "device": {
    "id": "uuid-v4",
    "registeredAt": "2024-01-01T00:00:00Z",
    "lastSeen": "2024-01-15T12:00:00Z"
  }
}
```

### 4. POST /api/auth/app/validate-label-creation
Validiert Label-Erstellung und incrementiert Usage.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "labelCount": 5
}
```

**Response (Allowed):**
```json
{
  "allowed": true,
  "remaining": 55,
  "limit": 60
}
```

**Response (Denied):**
```json
{
  "allowed": false,
  "reason": "Monatslimit erreicht. Sie haben 60 von 60 Labels verwendet.",
  "remaining": 0,
  "limit": 60
}
```

### 5. POST /api/auth/app/register-device
Registriert neues Device (max. 3 pro Account).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "deviceId": "uuid-v4",
  "deviceName": "Laptop"
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "uuid-v4",
  "deviceCount": 2
}
```

### 6. DELETE /api/auth/app/device/:deviceId
Entfernt Device-Registrierung.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Gerät erfolgreich entfernt"
}
```

## 🔒 Sicherheitsfeatures

### Token-Sicherheit
- **Access Token:** 15 Minuten Gültigkeit, JWT-signiert
- **Refresh Token:** 30 Tage Gültigkeit, einmalig verwendbar (Token Rotation)
- **Tokens werden verschlüsselt gespeichert** (electron-store mit Encryption)

### Device-Binding
- **Eindeutige Device-ID:** UUID v4, einmalig generiert, nie geändert
- **Max. 3 Geräte pro Account**
- **Server validiert:** Account + Device-ID Kombination bei jeder Anfrage

### Rate Limiting
- **Login:** 5 Versuche/Minute
- **Refresh:** 10 Versuche/Minute
- **Label-Validation:** 100 Requests/Minute

### Offline-Policy
- **Strikte Policy:** Keine Label-Erstellung ohne Server-Verbindung
- **Klare Fehlermeldung:** "Keine Verbindung zum Server. Label-Erstellung nicht möglich."

## 📁 Neue Dateien

### Website (Backend)
- `website/app/lib/jwt.ts` - JWT Token Management
- `website/app/lib/auth-middleware.ts` - Auth Helper Functions
- `website/app/api/auth/app/login/route.ts` - Login Endpoint
- `website/app/api/auth/app/refresh/route.ts` - Token Refresh Endpoint
- `website/app/api/auth/app/session/route.ts` - Session Info Endpoint
- `website/app/api/auth/app/validate-label-creation/route.ts` - Label Validation Endpoint
- `website/app/api/auth/app/register-device/route.ts` - Device Registration Endpoint
- `website/app/api/auth/app/device/[deviceId]/route.ts` - Device Deletion Endpoint

### Desktop App (Main Process)
- `app/src/main/auth/device-manager.ts` - Device ID Management
- `app/src/main/auth/token-storage.ts` - Encrypted Token Storage
- `app/src/main/auth/auth-manager.ts` - Authentication Logic
- `app/src/main/auth/token-refresher.ts` - Automatic Token Refresh
- `app/src/main/ipc/auth.ts` - Auth IPC Handlers

### Desktop App (Renderer)
- `app/src/renderer/components/LoginModal.tsx` - Login UI
- `app/src/renderer/components/AuthGuard.tsx` - Route Protection
- `app/src/renderer/components/AccountStatus.tsx` - Account Info Display

## 🗑️ Entfernte Dateien
- `app/src/main/ipc/license.ts` (ersetzt durch auth.ts)
- `app/src/main/license/license-manager.ts` (ersetzt durch auth-manager.ts)

## 🔄 Geänderte Dateien

### Website
- `website/prisma/schema.prisma` - Device, RefreshToken, Usage Models hinzugefügt

### Desktop App
- `app/src/shared/types.ts` - Auth-Types hinzugefügt, License-Types entfernt
- `app/src/preload.ts` - auth API statt license API
- `app/src/main/ipc/handlers.ts` - registerAuthHandlers statt registerLicenseHandlers
- `app/src/main/ipc/labels.ts` - Server-seitige Validierung statt lokale
- `app/src/renderer.ts` - AuthGuard integriert
- `app/src/renderer/components/SettingsModal.tsx` - AccountStatus hinzugefügt

## 🎯 Funktionsweise

### Login-Flow
1. User öffnet Desktop App
2. AuthGuard prüft Authentifizierung
3. Wenn nicht authentifiziert: LoginModal wird angezeigt
4. User gibt Email/Password ein
5. App sendet Login-Request mit Device-ID an Server
6. Server validiert Credentials, registriert Device, generiert Tokens
7. App speichert Tokens verschlüsselt
8. Token-Refresher startet automatisch
9. App zeigt Hauptansicht

### Label-Erstellung-Flow
1. User wählt Sales aus und klickt "Prepare"
2. App ruft `auth:validateLabelCreation(count)` auf
3. Auth Manager sendet Request an Server mit Access Token
4. Server validiert Token + Device-ID
5. Server prüft Usage-Limits
6. Wenn erlaubt: Server incrementiert Usage Counter
7. App erhält Erlaubnis und erstellt Labels
8. Wenn verweigert: Fehlermeldung mit Grund wird angezeigt

### Token-Refresh-Flow
1. Token-Refresher läuft alle 10 Minuten
2. Prüft ob Token in < 2 Minuten abläuft
3. Wenn ja: Sendet Refresh-Request mit Refresh Token
4. Server validiert Refresh Token
5. Server markiert alten Token als "used" (Token Rotation)
6. Server generiert neue Tokens
7. App speichert neue Tokens
8. Prozess wiederholt sich automatisch

## 📊 Plan-Limits

```typescript
const USAGE_LIMITS = {
  free: {
    labelsPerMonth: 10,
    batchPrinting: true,
    customFooter: false,
    maxDevices: 1,
  },
  plus: {
    labelsPerMonth: 60,
    batchPrinting: true,
    customFooter: true,
    maxDevices: 3,
  },
  pro: {
    labelsPerMonth: -1, // Unlimited
    batchPrinting: true,
    customFooter: true,
    maxDevices: 3,
  },
};
```

## 🐛 Troubleshooting

### "JWT_SECRET environment variable is not set"
- Füge JWT_SECRET zu `.env.local` hinzu
- Generiere mit: `openssl rand -base64 32`

### "Ungültiger oder fehlender Token"
- Token ist abgelaufen → Automatischer Refresh sollte funktionieren
- Wenn nicht: Logout und erneut einloggen

### "Maximale Anzahl an Geräten erreicht"
- User hat bereits 3 Geräte registriert
- Lösung: Gerät auf Website im Dashboard entfernen

### "Keine Verbindung zum Server"
- WEBSITE_URL in .env prüfen
- Server läuft?
- Netzwerkverbindung OK?

## 📝 Wichtige Hinweise

1. **JWT_SECRET muss stark sein** - Mindestens 32 Zeichen, zufällig generiert
2. **Tokens nie loggen** - Weder Access noch Refresh Tokens
3. **HTTPS in Production** - Alle API-Requests müssen über HTTPS laufen
4. **Device-ID ist anonym** - Keine Hardware-Informationen, nur UUID
5. **Rate Limiting ist aktiv** - In-Memory Maps, in Production Redis verwenden
6. **Prisma Migration nicht vergessen** - Vor dem ersten Start ausführen

## 🎉 Erfolg!

Das Account-basierte Authentifizierungssystem ist vollständig implementiert und einsatzbereit!

**Vorteile:**
- ✅ Moderne, sichere Authentifizierung
- ✅ Device-Binding verhindert Multi-Account-Ausnutzung
- ✅ Server-seitige Usage-Validierung (Source of Truth)
- ✅ Automatische Feature-Aktivierung
- ✅ Keine manuellen License Keys mehr nötig
- ✅ Bessere User Experience
- ✅ Einfachere Verwaltung für Admins

