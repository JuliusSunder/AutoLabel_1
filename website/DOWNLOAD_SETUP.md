# Download Setup - AutoLabel

## Problem: Download funktioniert nicht

Wenn der Download-Button zu "Not Found" führt, liegt das daran, dass die `APP_DOWNLOAD_URL` Environment Variable nicht korrekt gesetzt ist.

## Lösung: Environment Variable setzen

### Option 1: CDN oder File Hosting (Empfohlen für Production)

Lade die `AutoLabel-Setup.exe` auf einen File-Hosting-Service hoch:

**Empfohlene Services:**
- **AWS S3** - Professionell, skalierbar
- **Cloudflare R2** - Günstig, schnell
- **DigitalOcean Spaces** - Einfach zu nutzen
- **Vercel Blob** - Integriert mit Vercel

**Dann in `.env.local` setzen:**
```env
APP_DOWNLOAD_URL="https://your-cdn.com/downloads/AutoLabel-Setup.exe"
```

### Option 2: GitHub Releases (Kostenlos, einfach)

1. **Release erstellen:**
   ```bash
   # In deinem GitHub Repository
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Auf GitHub:**
   - Gehe zu "Releases" → "Create a new release"
   - Wähle den Tag `v1.0.0`
   - Lade `AutoLabel-Setup.exe` hoch
   - Veröffentliche das Release

3. **Environment Variable setzen:**
   ```env
   APP_DOWNLOAD_URL="https://github.com/your-username/autolabel/releases/latest/download/AutoLabel-Setup.exe"
   ```

### Option 3: Lokaler Development (Nur für Testing)

Für lokales Testing kannst du die Datei im `public` Ordner ablegen:

1. **Datei kopieren:**
   ```bash
   mkdir -p website/public/downloads
   cp AutoLabel-Setup.exe website/public/downloads/
   ```

2. **Environment Variable setzen:**
   ```env
   APP_DOWNLOAD_URL="http://localhost:3000/downloads/AutoLabel-Setup.exe"
   ```

**WICHTIG:** Diese Option ist nur für Development! Die .exe Datei sollte nicht ins Git-Repository committed werden.

Füge zur `.gitignore` hinzu:
```
website/public/downloads/*.exe
```

## Aktuellen Status prüfen

Überprüfe ob die Environment Variable gesetzt ist:

```bash
cd website
node -e "console.log(process.env.APP_DOWNLOAD_URL)"
```

Wenn `undefined` ausgegeben wird, ist die Variable nicht gesetzt.

## Server neu starten

Nach dem Setzen der Environment Variable musst du den Development Server neu starten:

```bash
# Server stoppen (Ctrl+C)
# Dann neu starten
npm run dev
```

## Download testen

1. Öffne das Dashboard: `http://localhost:3000/dashboard`
2. Klicke auf "Jetzt herunterladen"
3. Der Download sollte automatisch starten

## Troubleshooting

### "Not Found" Fehler

**Ursache:** `APP_DOWNLOAD_URL` ist nicht gesetzt oder zeigt auf eine nicht existierende Datei.

**Lösung:**
1. Überprüfe `.env.local` oder `.env`
2. Stelle sicher, dass die URL korrekt ist
3. Teste die URL direkt im Browser
4. Server neu starten

### Download startet nicht

**Ursache:** Browser blockiert den Download oder CORS-Problem.

**Lösung:**
1. Überprüfe Browser-Konsole (F12)
2. Stelle sicher, dass CORS-Header gesetzt sind (bei externen URLs)
3. Teste mit einem anderen Browser

### "Download-URL nicht verfügbar"

**Ursache:** API gibt keine `downloadUrl` zurück.

**Lösung:**
1. Überprüfe Server-Logs
2. Stelle sicher, dass `APP_DOWNLOAD_URL` in der Environment gesetzt ist
3. Überprüfe `/api/download/app/route.ts`

## Production Deployment

### Vercel

1. **Environment Variable setzen:**
   - Gehe zu Vercel Dashboard
   - Projekt auswählen → Settings → Environment Variables
   - Füge `APP_DOWNLOAD_URL` hinzu
   - Redeploy

2. **Empfohlene Struktur:**
   ```
   APP_DOWNLOAD_URL=https://cdn.autolabel.com/downloads/AutoLabel-Setup.exe
   ```

### Andere Hosting-Plattformen

Setze die Environment Variable in den Projekt-Einstellungen:
- **Netlify:** Site settings → Environment variables
- **Railway:** Project → Variables
- **Render:** Environment → Environment Variables

## Sicherheitshinweise

1. **Keine sensiblen Daten in der URL:** Die Download-URL ist öffentlich sichtbar
2. **HTTPS verwenden:** Immer HTTPS für Production
3. **Signierte URLs:** Für zusätzliche Sicherheit verwende signierte URLs (z.B. AWS S3 Presigned URLs)
4. **Rate Limiting:** Implementiere Rate Limiting um Missbrauch zu verhindern

## Automatisierung

Du kannst den Upload automatisieren:

```bash
# Beispiel: Upload zu AWS S3
aws s3 cp AutoLabel-Setup.exe s3://your-bucket/downloads/AutoLabel-Setup.exe --acl public-read

# Beispiel: Upload zu GitHub Release (mit GitHub CLI)
gh release create v1.0.0 AutoLabel-Setup.exe --title "AutoLabel v1.0.0"
```

## Zusammenfassung

1. ✅ Wähle einen File-Hosting-Service
2. ✅ Lade `AutoLabel-Setup.exe` hoch
3. ✅ Setze `APP_DOWNLOAD_URL` in `.env.local`
4. ✅ Server neu starten
5. ✅ Download testen

Der Download sollte jetzt funktionieren! 🚀

