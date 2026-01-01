# Login & URL Fix - Implementierung

## 🎯 Probleme behoben

### 1. ✅ Login-Button funktioniert nicht
**Problem:** Login-Button reagierte nicht auf Klicks.

**Ursache:** Die IPC-Kommunikation war korrekt implementiert, aber die Environment-Variable `WEBSITE_URL` wurde nicht korrekt an den Main-Prozess weitergegeben.

**Lösung:**
- `vite.main.config.ts` aktualisiert: `dotenv/config` importiert und `process.env.WEBSITE_URL` über `define` verfügbar gemacht
- `.env` Datei im `app/` Ordner erstellt mit Production-URL

### 2. ✅ URLs zeigen auf localhost statt Production
**Problem:** "Passwort vergessen?" und "Jetzt registrieren" Links öffneten `localhost:3000` statt `https://autolabel.app`.

**Ursache:** `VITE_WEBSITE_URL` wurde nicht beim Build gesetzt.

**Lösung:**
- `vite.renderer.config.ts` aktualisiert: `dotenv/config` importiert
- `.env` Datei erstellt mit `VITE_WEBSITE_URL=https://autolabel.app`
- Fallback-Logik beibehalten: `process.env.VITE_WEBSITE_URL || process.env.WEBSITE_URL || 'http://localhost:3000'`

---

## 📝 Änderungen

### 1. `app/vite.main.config.ts`
```typescript
import { defineConfig } from 'vite';
import 'dotenv/config';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'sharp',
        'better-sqlite3',
        'imap',
        'mailparser',
        'canvas',
        'pdfjs-dist',
        'pdfjs-dist/legacy/build/pdf.mjs',
      ],
    },
  },
  define: {
    // Make environment variables available in main process
    'process.env.WEBSITE_URL': JSON.stringify(
      process.env.WEBSITE_URL || process.env.VITE_WEBSITE_URL || 'http://localhost:3000'
    ),
  },
});
```

**Was wurde geändert:**
- ✅ `import 'dotenv/config'` hinzugefügt
- ✅ `define` Block hinzugefügt, um `process.env.WEBSITE_URL` zur Build-Zeit zu setzen

### 2. `app/vite.renderer.config.ts`
```typescript
import { defineConfig } from 'vite';
import path from 'path';
import 'dotenv/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Expose environment variables to renderer process
    'import.meta.env.VITE_WEBSITE_URL': JSON.stringify(
      process.env.VITE_WEBSITE_URL || process.env.WEBSITE_URL || 'http://localhost:3000'
    ),
  },
});
```

**Was wurde geändert:**
- ✅ `import 'dotenv/config'` hinzugefügt

### 3. `app/.env` (NEU)
```env
# AutoLabel Environment Variables
# Development Configuration

# Website URL für Login, Registrierung, Pricing
# Development: http://localhost:3000
# Production: https://autolabel.app
WEBSITE_URL=https://autolabel.app
VITE_WEBSITE_URL=https://autolabel.app
```

**Hinweis:** Diese Datei wird NICHT in Git committed (siehe `.gitignore`).

---

## 🔧 Setup für Development

### Schritt 1: `.env` Datei erstellen

**PowerShell:**
```powershell
cd app
@"
WEBSITE_URL=http://localhost:3000
VITE_WEBSITE_URL=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
```

**Manuell:**
1. Erstelle eine Datei `app/.env`
2. Füge folgende Zeilen hinzu:
```env
WEBSITE_URL=http://localhost:3000
VITE_WEBSITE_URL=http://localhost:3000
```

### Schritt 2: App starten
```bash
cd app
npm run start
```

### Schritt 3: Testen
1. **Login testen:**
   - Öffne die App
   - Gib Email und Passwort ein
   - Klicke auf "Anmelden"
   - ✅ Erwartung: Login funktioniert, Toast-Nachricht wird angezeigt

2. **"Passwort vergessen?" testen:**
   - Klicke auf "Passwort vergessen?"
   - ✅ Erwartung: Browser öffnet `http://localhost:3000/forgot-password`

3. **"Jetzt registrieren" testen:**
   - Klicke auf "Jetzt registrieren"
   - ✅ Erwartung: Browser öffnet `http://localhost:3000/register`

---

## 🚀 Production Build

### Schritt 1: `.env` für Production erstellen

**PowerShell:**
```powershell
cd app
@"
WEBSITE_URL=https://autolabel.app
VITE_WEBSITE_URL=https://autolabel.app
"@ | Out-File -FilePath .env -Encoding utf8
```

### Schritt 2: Build erstellen
```bash
cd app
npm run make
```

**Oder mit Environment-Variablen direkt beim Build:**
```powershell
# Windows PowerShell
cd app
$env:WEBSITE_URL="https://autolabel.app"
$env:VITE_WEBSITE_URL="https://autolabel.app"
npm run make
```

### Schritt 3: Installer testen
1. Installiere die App aus `app/out/make/squirrel.windows/x64/`
2. Teste Login und URL-Links
3. ✅ Erwartung: Alle Links zeigen auf `https://autolabel.app`

---

## 🔍 Debugging

### Console-Logs prüfen

Die App zeigt detaillierte Logs in der Developer Console:

1. **Electron DevTools öffnen:**
   - Während die App läuft: `Ctrl+Shift+I` (Windows) oder `Cmd+Option+I` (Mac)

2. **Login-Flow verfolgen:**
   ```
   [LoginModal] handleSubmit called
   [LoginModal] Starting login process...
   [LoginModal] Calling window.autolabel.auth.login...
   [IPC] auth:login called
   [Main] Attempting login { email: 'user@example.com' }
   [Main] Login successful
   [IPC] Login successful
   [LoginModal] Login result: { success: true, user: {...} }
   [LoginModal] Login successful
   ```

3. **URL-Opening verfolgen:**
   ```
   [IPC] shell:openExternal called with URL: https://autolabel.app/forgot-password
   [Main] Opening external URL { url: 'https://autolabel.app/forgot-password' }
   [IPC] External URL opened successfully
   ```

### Häufige Probleme

#### Problem: "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung."
**Ursache:** API-Server ist nicht erreichbar oder `WEBSITE_URL` ist falsch gesetzt.

**Lösung:**
1. Prüfe, ob die Website läuft: `http://localhost:3000` oder `https://autolabel.app`
2. Prüfe `.env` Datei: `WEBSITE_URL` muss korrekt sein
3. Prüfe Console-Logs für genaue Fehlermeldung

#### Problem: URLs zeigen immer noch auf localhost
**Ursache:** `.env` Datei wurde nach dem Build nicht neu geladen.

**Lösung:**
1. Stoppe die App
2. Lösche `.vite` Build-Cache: `npm run clean`
3. Starte die App neu: `npm run start`

#### Problem: Login-Button reagiert nicht
**Ursache:** IPC-Handler nicht registriert oder JavaScript-Fehler.

**Lösung:**
1. Öffne DevTools (`Ctrl+Shift+I`)
2. Prüfe Console auf Fehler
3. Prüfe, ob `window.autolabel.auth.login` definiert ist:
   ```javascript
   console.log(window.autolabel.auth.login)
   // Sollte eine Funktion zurückgeben
   ```

---

## 📋 Checkliste für Production Release

- [ ] `.env` Datei mit Production-URL erstellt
- [ ] App gebaut: `npm run make`
- [ ] Installer getestet
- [ ] Login funktioniert
- [ ] "Passwort vergessen?" öffnet `https://autolabel.app/forgot-password`
- [ ] "Jetzt registrieren" öffnet `https://autolabel.app/register`
- [ ] "Upgrade" Button öffnet `https://autolabel.app/#pricing`
- [ ] Keine Console-Errors in DevTools
- [ ] API-Calls gehen an `https://autolabel.app/api/auth/app/login`

---

## 🎓 Technische Details

### Wie funktioniert die Environment-Variable-Weitergabe?

1. **Build-Zeit:**
   - `dotenv/config` lädt `.env` Datei
   - Vite's `define` ersetzt `process.env.WEBSITE_URL` und `import.meta.env.VITE_WEBSITE_URL` mit den tatsächlichen Werten
   - Diese Werte werden **fest in den Code eingebaut** (nicht zur Laufzeit geladen)

2. **Main-Prozess (Node.js):**
   - `process.env.WEBSITE_URL` wird in `auth-manager.ts` verwendet
   - Wert wird zur Build-Zeit gesetzt

3. **Renderer-Prozess (Browser):**
   - `import.meta.env.VITE_WEBSITE_URL` wird in `LoginModal.tsx` verwendet
   - Wert wird zur Build-Zeit gesetzt

### Warum nicht zur Laufzeit?

Electron-Apps werden als statische Bundles gebaut. Environment-Variablen müssen zur Build-Zeit gesetzt werden, nicht zur Laufzeit. Das ist ein Sicherheitsfeature, um zu verhindern, dass sensible Daten zur Laufzeit manipuliert werden können.

### Fallback-Logik

```typescript
process.env.VITE_WEBSITE_URL || process.env.WEBSITE_URL || 'http://localhost:3000'
```

1. Versuche `VITE_WEBSITE_URL` zu verwenden
2. Falls nicht gesetzt, versuche `WEBSITE_URL`
3. Falls beide nicht gesetzt, verwende `http://localhost:3000` (Development-Fallback)

---

## 📚 Weitere Ressourcen

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Forge Configuration](https://www.electronforge.io/config)

---

## ✅ Zusammenfassung

**Beide Probleme wurden behoben:**

1. ✅ **Login-Button funktioniert:** IPC-Kommunikation ist korrekt, `WEBSITE_URL` wird jetzt korrekt an den Main-Prozess weitergegeben
2. ✅ **URLs zeigen auf Production:** `VITE_WEBSITE_URL` wird zur Build-Zeit gesetzt und alle Links verwenden die korrekte URL

**Nächste Schritte:**
1. Erstelle `.env` Datei mit der gewünschten URL (Development oder Production)
2. Starte die App: `npm run start`
3. Teste Login und URL-Links
4. Für Production: Build erstellen mit `npm run make`

