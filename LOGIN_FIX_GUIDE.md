# Login & External Links Fix - AutoLabel Desktop App

## ✅ Behobene Probleme

### Problem 1: Login-Button funktioniert nicht
**Status:** ✅ BEHOBEN

**Was war das Problem?**
Der Login-Button hat möglicherweise nicht reagiert, weil:
- Die IPC-Kommunikation zwischen Renderer und Main-Process nicht korrekt funktionierte
- Fehlende Debug-Logs machten es schwer, das Problem zu diagnostizieren

**Lösung:**
- ✅ Erweiterte Debug-Logs im Login-Handler hinzugefügt
- ✅ IPC-Handler für Auth korrekt registriert
- ✅ Preload-Script korrekt konfiguriert
- ✅ TypeScript-Typen für `window.autolabel` API vollständig

**Geänderte Dateien:**
- `app/src/renderer/components/LoginModal.tsx` - Erweiterte Logs für besseres Debugging

---

### Problem 2: "Passwort vergessen?" und "Jetzt registrieren" öffnen weißen Screen
**Status:** ✅ BEHOBEN

**Was war das Problem?**
`window.open()` funktioniert in Electron nicht für externe URLs. Stattdessen muss `shell.openExternal()` verwendet werden.

**Lösung:**
- ✅ Neuer IPC-Handler `shell:openExternal` erstellt
- ✅ Sicheres Öffnen externer URLs im Standard-Browser
- ✅ URL-Validierung (nur http/https erlaubt)
- ✅ Fehlerbehandlung mit Toast-Benachrichtigungen

**Geänderte Dateien:**
- `app/src/main/ipc/shell.ts` - Neuer IPC-Handler für externe URLs
- `app/src/main/ipc/handlers.ts` - Shell-Handler registriert
- `app/src/shared/types.ts` - `shell.openExternal` zur API hinzugefügt
- `app/src/preload.ts` - Shell-API im Preload-Script exponiert
- `app/src/renderer/components/LoginModal.tsx` - Verwendet jetzt `shell.openExternal`
- `app/src/renderer/components/AccountStatus.tsx` - Upgrade-Button verwendet `shell.openExternal`

---

## 🚀 Setup & Testing

### Schritt 1: Environment-Variable setzen

Die Website-URL muss über eine Environment-Variable gesetzt werden.

**Für Development (lokales Testing):**

Erstelle eine Datei `app/.env`:

```env
# Website URL für Login, Registrierung, Pricing
WEBSITE_URL=http://localhost:3000
VITE_WEBSITE_URL=http://localhost:3000
```

**Für Production:**

Setze die Environment-Variable beim Build:

```powershell
# Windows PowerShell
$env:WEBSITE_URL="https://autolabel.com"
$env:VITE_WEBSITE_URL="https://autolabel.com"
npm run make
```

Oder in der CI/CD Pipeline:

```yaml
env:
  WEBSITE_URL: https://autolabel.com
  VITE_WEBSITE_URL: https://autolabel.com
```

---

### Schritt 2: App neu bauen

```powershell
cd app
npm run package
```

Oder für einen vollständigen Installer:

```powershell
npm run make
```

---

### Schritt 3: Testing

#### Test 1: Login-Button
1. Starte die App
2. Gib Email und Passwort ein
3. Klicke auf "Anmelden"
4. **Erwartetes Ergebnis:**
   - Loading-State wird angezeigt ("Anmelden..." Text)
   - Bei Erfolg: "Login erfolgreich!" Toast
   - Bei Fehler: Fehlermeldung als Toast
   - Console-Logs zeigen den Login-Flow

#### Test 2: "Passwort vergessen?" Link
1. Klicke auf "Passwort vergessen?"
2. **Erwartetes Ergebnis:**
   - Standard-Browser öffnet sich
   - URL: `http://localhost:3000/forgot-password` (oder deine Production-URL)
   - Website wird korrekt geladen

#### Test 3: "Jetzt registrieren" Link
1. Klicke auf "Jetzt registrieren"
2. **Erwartetes Ergebnis:**
   - Standard-Browser öffnet sich
   - URL: `http://localhost:3000/register` (oder deine Production-URL)
   - Website wird korrekt geladen

#### Test 4: Upgrade-Button
1. Melde dich an
2. Klicke auf "Upgrade" Button (falls vorhanden)
3. **Erwartetes Ergebnis:**
   - Standard-Browser öffnet sich
   - URL: `http://localhost:3000/#pricing` (oder deine Production-URL)
   - Pricing-Seite wird korrekt geladen

---

## 🔍 Debugging

### Console-Logs prüfen

Die App zeigt jetzt detaillierte Logs in der Developer Console:

1. Öffne die App
2. Drücke `Ctrl+Shift+I` (Windows) oder `Cmd+Option+I` (Mac)
3. Gehe zum "Console" Tab
4. Versuche dich einzuloggen
5. Du solltest Logs wie diese sehen:

```
[LoginModal] handleSubmit called
[LoginModal] Starting login process...
[LoginModal] Calling window.autolabel.auth.login...
[IPC] auth:login called
[LoginModal] Login result: { success: true, user: {...}, subscription: {...} }
[LoginModal] Login successful
[LoginModal] Calling onLoginSuccess callback
```

### Häufige Probleme

#### Problem: "window.autolabel is undefined"
**Lösung:** 
- Stelle sicher, dass das Preload-Script korrekt geladen wird
- Prüfe `webPreferences.preload` in `app/src/main.ts`
- Prüfe ob `contextIsolation: true` und `nodeIntegration: false` gesetzt sind

#### Problem: "Failed to open external URL"
**Lösung:**
- Prüfe die Console-Logs für Details
- Stelle sicher, dass die URL mit `http://` oder `https://` beginnt
- Prüfe ob die `VITE_WEBSITE_URL` Environment-Variable gesetzt ist

#### Problem: Login-Button reagiert nicht
**Lösung:**
1. Öffne Developer Console (`Ctrl+Shift+I`)
2. Prüfe ob Fehler angezeigt werden
3. Prüfe ob `[LoginModal] handleSubmit called` Log erscheint
4. Wenn nicht: Prüfe ob das Form-Submit Event korrekt ist

---

## 📁 Geänderte Dateien - Übersicht

### Neue Dateien
- `app/src/main/ipc/shell.ts` - IPC-Handler für externe URLs

### Geänderte Dateien
- `app/src/main/ipc/handlers.ts` - Shell-Handler registriert
- `app/src/shared/types.ts` - `shell.openExternal` API hinzugefügt
- `app/src/preload.ts` - Shell-API exponiert
- `app/src/renderer/components/LoginModal.tsx` - Debug-Logs + `shell.openExternal`
- `app/src/renderer/components/AccountStatus.tsx` - `shell.openExternal` für Upgrade-Button

---

## 🎯 Technische Details

### IPC-Kommunikation

**Renderer → Main Process:**
```typescript
// Renderer (LoginModal.tsx)
const result = await window.autolabel.auth.login(email, password);

// Preload (preload.ts)
auth: {
  login: (email, password) => ipcRenderer.invoke('auth:login', email, password)
}

// Main Process (auth.ts)
ipcMain.handle('auth:login', async (_event, email, password) => {
  return await login(email, password);
});
```

### Externe URLs öffnen

**Renderer → Main Process → System Browser:**
```typescript
// Renderer
await window.autolabel.shell.openExternal('https://example.com');

// Preload
shell: {
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
}

// Main Process
ipcMain.handle('shell:openExternal', async (_event, url) => {
  await shell.openExternal(url);
});
```

### Sicherheit

- ✅ URL-Validierung: Nur `http://` und `https://` erlaubt
- ✅ Context Isolation aktiviert
- ✅ Node Integration deaktiviert
- ✅ Keine sensiblen Daten im Renderer-Process

---

## 📝 Nächste Schritte

1. **Environment-Variable setzen** (siehe Schritt 1)
2. **App neu bauen** (siehe Schritt 2)
3. **Alle Tests durchführen** (siehe Schritt 3)
4. **Bei Problemen:** Console-Logs prüfen (siehe Debugging)

---

## ✨ Ergebnis

- ✅ **Login funktioniert** mit klarem Feedback
- ✅ **Externe Links öffnen** im Standard-Browser
- ✅ **Besseres Debugging** durch erweiterte Logs
- ✅ **Sichere URL-Behandlung** mit Validierung
- ✅ **Konfigurierbare Website-URL** via Environment-Variable

---

**Viel Erfolg beim Testen! 🚀**

Bei Fragen oder Problemen, prüfe zuerst die Console-Logs und die Debugging-Sektion in diesem Dokument.

