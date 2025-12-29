# Environment Variables Setup - Schnellanleitung

## Problem gelöst ✅

1. **Button-Text war nicht sichtbar** → Jetzt mit korrektem Styling (blauer Text auf weißem Hintergrund)
2. **Download führte zu "Not Found"** → Jetzt direkter Download + bessere Fehlermeldung

## Was du jetzt tun musst:

### Schritt 1: `.env.local` Datei erstellen

Erstelle eine Datei `website/.env.local` mit folgendem Inhalt:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dein-geheimer-schlüssel-hier"

# Stripe (deine existierenden Werte)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PLUS_MONTHLY="price_..."
STRIPE_PRICE_ID_PLUS_YEARLY="price_..."
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."

# WICHTIG: Download URL setzen
APP_DOWNLOAD_URL="http://localhost:3000/downloads/AutoLabel-Setup.exe"

# Website URL
WEBSITE_URL="http://localhost:3000"
```

### Schritt 2: Download-Datei bereitstellen

**Für lokales Testing:**

```bash
# Im website Ordner
mkdir -p public/downloads

# Kopiere deine AutoLabel-Setup.exe in diesen Ordner
# (Die Datei wird dann unter http://localhost:3000/downloads/AutoLabel-Setup.exe verfügbar sein)
```

**Wichtig:** Füge zur `.gitignore` hinzu:
```
website/public/downloads/*.exe
```

### Schritt 3: Server neu starten

```bash
cd website
# Server stoppen (Ctrl+C falls er läuft)
npm run dev
```

### Schritt 4: Testen

1. Öffne `http://localhost:3000/dashboard`
2. Klicke auf "Jetzt herunterladen"
3. Der Download sollte automatisch starten

## Für Production (später)

Wenn du die App deployen willst, solltest du einen richtigen File-Hosting-Service verwenden:

### Option A: GitHub Releases (Kostenlos, einfach)

1. Erstelle ein GitHub Release
2. Lade die .exe Datei hoch
3. Setze in Vercel/Production:
   ```env
   APP_DOWNLOAD_URL="https://github.com/dein-username/autolabel/releases/latest/download/AutoLabel-Setup.exe"
   ```

### Option B: CDN (Professionell)

1. Lade die Datei auf AWS S3, Cloudflare R2, oder ähnliches hoch
2. Setze die URL:
   ```env
   APP_DOWNLOAD_URL="https://cdn.autolabel.com/downloads/AutoLabel-Setup.exe"
   ```

## Was wurde geändert?

### 1. Dashboard Button (website/app/dashboard/page.tsx)

**Vorher:**
```tsx
<Button className="bg-white text-blue-600 hover:bg-gray-100">
  Jetzt herunterladen
</Button>
```
❌ Problem: Button-Komponente überschrieb die Farben

**Nachher:**
```tsx
<button className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200">
  Jetzt herunterladen
</button>
```
✅ Lösung: Direktes `<button>` Element mit korrekten Farben

### 2. Download Handler

**Vorher:**
```tsx
window.location.href = data.downloadUrl;
```
❌ Problem: Navigiert zur URL (zeigt "Not Found" wenn URL falsch)

**Nachher:**
```tsx
const link = document.createElement('a');
link.href = data.downloadUrl;
link.download = 'AutoLabel-Setup.exe';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```
✅ Lösung: Direkter Download ohne Navigation

## Troubleshooting

### Button ist immer noch weiß?

- Browser-Cache leeren (Ctrl+Shift+R)
- Development Server neu starten

### Download funktioniert nicht?

1. Überprüfe ob `.env.local` existiert und `APP_DOWNLOAD_URL` gesetzt ist
2. Überprüfe ob die Datei unter der URL erreichbar ist (öffne die URL direkt im Browser)
3. Schaue in die Browser-Konsole (F12) für Fehler
4. Schaue in die Server-Logs

### "Download-URL nicht verfügbar"?

Die `APP_DOWNLOAD_URL` Environment Variable ist nicht gesetzt oder der Server wurde nicht neu gestartet.

## Nächste Schritte

1. ✅ `.env.local` erstellen mit `APP_DOWNLOAD_URL`
2. ✅ Download-Datei bereitstellen
3. ✅ Server neu starten
4. ✅ Testen

Danach sollte alles funktionieren! 🎉

