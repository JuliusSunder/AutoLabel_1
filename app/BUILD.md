# Build & Distribution Guide

## Übersicht

AutoLabel verwendet **Electron Forge** für Build und Distribution. Dieser Guide erklärt den kompletten Prozess von Development bis Production Release.

---

## 🔧 Prerequisites

### Erforderliche Tools
- **Node.js** 18+ (empfohlen: 20 LTS)
- **npm** 9+
- **Git**
- **Windows 10/11** (für Windows Builds)

### Optional für Code Signing
- **Code Signing Certificate** (für Production)
  - Self-signed: Für Testing (siehe `CREATE_CERTIFICATE.ps1`)
  - Commercial: Von vertrauenswürdiger CA (z.B. DigiCert, Sectigo)

---

## 📦 Production Build

### 1. Dependencies installieren

```bash
cd app
npm install
```

### 2. Build-Konfiguration prüfen

**Wichtige Dateien:**
- `package.json` - Version, Name, Description
- `forge.config.ts` - Build-Settings, Icons, Code Signing
- `.env` - Environment Variables (optional)

**Version erhöhen:**
```json
// package.json
{
  "version": "1.0.1"  // Vor jedem Release erhöhen!
}
```

### 3. Production Build erstellen

**Ohne Code Signing:**
```bash
npm run make
```

**Mit Code Signing:**
```bash
# Environment Variables setzen
$env:WINDOWS_CERT_PATH="C:\path\to\certificate.pfx"
$env:WINDOWS_CERT_PASSWORD="your-password"

# Build mit Signing
npm run make:signed
```

### 4. Build-Output

**Verzeichnis:** `app/out/make/squirrel.windows/x64/`

**Dateien:**
- `AutoLabel-1.0.0 Setup.exe` - **Haupt-Installer** (für User)
- `AutoLabel-1.0.0-full.nupkg` - Update-Package (für Auto-Updater)
- `RELEASES` - Update-Manifest (für Auto-Updater)

**Erwartete Größe:**
- Installer: ~150-250 MB (je nach Dependencies)
- .nupkg: ~150-250 MB

---

## ✅ Build-Validierung

### Checkliste

- [ ] Build erfolgreich ohne Fehler
- [ ] Installer-Datei vorhanden (`Setup.exe`)
- [ ] Installer-Größe plausibel (150-250 MB)
- [ ] RELEASES-Datei vorhanden
- [ ] .nupkg-Datei vorhanden

### Installer-Properties prüfen

```powershell
# Rechtsklick auf Setup.exe → Properties
# Details Tab prüfen:
```

**Erwartete Metadata:**
- **Product Name:** AutoLabel
- **File Description:** AutoLabel - Shipping Label Management
- **Version:** 1.0.0
- **Company:** AutoLabel
- **Copyright:** Copyright © 2025 JuliusSunder

---

## 🧪 Testing

### 1. Lokaler Test

```powershell
# Installer ausführen
.\out\make\squirrel.windows\x64\AutoLabel-1.0.0 Setup.exe
```

**Test-Checkliste:**
- [ ] Installer startet ohne Fehler
- [ ] Installation erfolgreich
- [ ] App startet nach Installation
- [ ] App-Icon im Startmenü
- [ ] App-Icon in Taskleiste
- [ ] App-Name ist "AutoLabel" (nicht "app")
- [ ] Uninstall funktioniert (Systemsteuerung → Programme)

### 2. Funktionalitätstest

- [ ] Alle Screens funktionieren
- [ ] Email-Scan funktioniert
- [ ] Label-Preparation funktioniert
- [ ] Printing funktioniert
- [ ] Settings werden gespeichert
- [ ] Datenbank wird erstellt (`%APPDATA%/autolabel/`)

### 3. Test auf sauberem System

**Wichtig:** Immer auf frischem System testen!

**Test-Environment:**
- Windows 10/11 VM oder frisches System
- Keine vorherige Installation von AutoLabel
- Keine Development-Dependencies

**Test-Checkliste:**
- [ ] Installation auf sauberem System
- [ ] App startet ohne Fehler
- [ ] Alle Features funktionieren
- [ ] Keine fehlenden Dependencies
- [ ] Keine Runtime-Errors in Console

**Edge Cases:**
- [ ] Installation Windows 10
- [ ] Installation Windows 11
- [ ] Installation mit/ohne Admin-Rechten
- [ ] Installation in verschiedenen Pfaden
- [ ] Update von alter Version
- [ ] Uninstall und Re-Install

---

## 🚀 Publishing & Release

### 1. GitHub Repository Setup

**Repository erstellen:**
```bash
# Falls noch nicht vorhanden
git init
git remote add origin https://github.com/your-username/autolabel.git
```

**GitHub Personal Access Token erstellen:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Scopes auswählen:
   - `repo` (Full control of private repositories)
   - `write:packages` (Upload packages)
4. Token kopieren und sicher speichern!

### 2. forge.config.ts konfigurieren

```typescript
// forge.config.ts
publishers: [
  new PublisherGithub({
    repository: {
      owner: 'your-username',  // ← Dein GitHub Username
      name: 'autolabel',       // ← Dein Repository Name
    },
    prerelease: false,
    draft: true,  // Creates draft release
  }),
],
```

### 3. main.ts konfigurieren

```typescript
// src/main.ts
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',  // ← Dein GitHub Username
  repo: 'autolabel',       // ← Dein Repository Name
});
```

### 4. Release erstellen

**Schritt 1: Version erhöhen**
```json
// package.json
{
  "version": "1.0.1"  // Neue Version
}
```

**Schritt 2: CHANGELOG aktualisieren**
```markdown
// CHANGELOG.md
## [1.0.1] - 2025-01-15
### Added
- Feature X
### Fixed
- Bug Y
```

**Schritt 3: Build erstellen**
```bash
npm run make
```

**Schritt 4: Publish zu GitHub**
```powershell
# GitHub Token setzen
$env:GITHUB_TOKEN="your-github-token"

# Publish
npm run publish
```

**Schritt 5: GitHub Release finalisieren**
1. GitHub → Releases → Draft Release
2. Release Notes hinzufügen
3. "Publish release" klicken

---

## 🔄 Auto-Updater

### Wie es funktioniert

1. **App-Start:** Auto-Updater prüft GitHub Releases
2. **Update verfügbar:** Download im Hintergrund
3. **Download fertig:** Update wird beim nächsten App-Start installiert

### Konfiguration

**Main Process (src/main.ts):**
```typescript
if (app.isPackaged) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'your-username',
    repo: 'autolabel',
  });

  autoUpdater.checkForUpdatesAndNotify();
}
```

**Update-Events:**
- `checking-for-update` - Prüfung gestartet
- `update-available` - Update verfügbar
- `update-not-available` - Keine Updates
- `download-progress` - Download-Fortschritt
- `update-downloaded` - Download fertig
- `error` - Fehler aufgetreten

### Testing

**Update-Test:**
1. Version 1.0.0 installieren
2. Version 1.0.1 auf GitHub releasen
3. App starten
4. Update sollte automatisch erkannt werden
5. Nach Download: App neu starten
6. Version 1.0.1 sollte installiert sein

---

## 📝 Release-Prozess (Checkliste)

### Pre-Release

- [ ] Version in `package.json` erhöhen
- [ ] CHANGELOG.md aktualisieren
- [ ] Alle Tests durchführen
- [ ] Build erstellen (`npm run make`)
- [ ] Installer lokal testen
- [ ] Installer auf sauberem System testen

### Release

- [ ] GitHub Token setzen
- [ ] `npm run publish` ausführen
- [ ] GitHub Draft Release prüfen
- [ ] Release Notes hinzufügen
- [ ] Release veröffentlichen

### Post-Release

- [ ] Update-Mechanismus testen
- [ ] User-Feedback sammeln
- [ ] Hotfixes bei Bedarf

---

## 🛠️ Troubleshooting

### Build-Fehler

**Problem:** `Cannot find module 'sharp'`
```bash
# Native modules neu bauen
npm rebuild sharp
npm rebuild better-sqlite3
```

**Problem:** `ASAR integrity check failed`
```typescript
// forge.config.ts
asar: {
  unpack: '**/*.{node,dll}',  // Native modules nicht packen
}
```

### Installer-Fehler

**Problem:** "Windows protected your PC"
- **Ursache:** Installer nicht signiert
- **Lösung:** Code Signing Certificate verwenden oder "More info" → "Run anyway"

**Problem:** App startet nicht nach Installation
- **Ursache:** Fehlende Dependencies
- **Lösung:** Prüfe Console-Errors, installiere fehlende Dependencies

### Auto-Updater-Fehler

**Problem:** "Update check failed"
- **Ursache:** GitHub Repository nicht öffentlich oder Token fehlt
- **Lösung:** Repository public machen oder Token konfigurieren

**Problem:** "Update download failed"
- **Ursache:** RELEASES-Datei nicht gefunden
- **Lösung:** Prüfe ob alle Dateien (Setup.exe, .nupkg, RELEASES) hochgeladen wurden

---

## 📊 Build-Statistiken

**Typische Build-Zeiten:**
- Development Build: ~30-60 Sekunden
- Production Build: ~5-10 Minuten
- Mit Code Signing: +1-2 Minuten

**Typische Dateigrößen:**
- Installer: 150-250 MB
- Installierte App: 200-300 MB
- Update-Package: 150-250 MB

---

## 🔐 Code Signing

### Self-Signed Certificate (Testing)

```powershell
# Certificate erstellen
.\CREATE_CERTIFICATE.ps1

# Environment Variables setzen
$env:WINDOWS_CERT_PATH=".\certs\autolabel-cert.pfx"
$env:WINDOWS_CERT_PASSWORD="your-password"
```

### Commercial Certificate (Production)

**Empfohlene Anbieter:**
- DigiCert
- Sectigo (früher Comodo)
- GlobalSign

**Kosten:** ~$100-$500/Jahr

**Vorteile:**
- Keine Windows SmartScreen-Warnung
- Vertrauen der User
- Professionelles Image

---

## 📚 Weitere Ressourcen

- [Electron Forge Dokumentation](https://www.electronforge.io/)
- [electron-updater Dokumentation](https://www.electron.build/auto-update)
- [Code Signing Guide](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Squirrel.Windows](https://github.com/Squirrel/Squirrel.Windows)

---

## 💡 Best Practices

1. **Immer Version erhöhen** vor Release
2. **Immer auf sauberem System testen** vor Release
3. **CHANGELOG pflegen** für User-Transparenz
4. **Draft Releases verwenden** zum Review
5. **Code Signing verwenden** für Production
6. **Backup vor Updates** empfehlen
7. **Rollback-Plan** haben für kritische Bugs

---

## 📞 Support

Bei Problemen:
1. Console-Logs prüfen (F12 in App)
2. Main Process Logs prüfen (Terminal)
3. GitHub Issues erstellen
4. Community fragen

---

**Letzte Aktualisierung:** 2025-01-15
**Version:** 1.0.0

