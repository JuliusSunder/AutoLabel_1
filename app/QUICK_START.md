# Quick Start Guide - Build & Distribution

Schnellanleitung für die wichtigsten Build & Distribution Aufgaben.

---

## 🚀 Production Build erstellen

```powershell
cd app
npm install
npm run make
```

**Output:** `app/out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe`

---

## ✅ Build testen

### Lokaler Test

```powershell
# Installer ausführen
.\out\make\squirrel.windows\x64\AutoLabel-1.0.0 Setup.exe
```

### Sauberes System Test

1. Windows VM vorbereiten
2. Installer kopieren
3. Installation testen
4. Alle Features testen

---

## 📦 Release auf GitHub

### 1. Vorbereitung

```bash
# Version erhöhen in package.json
# CHANGELOG.md aktualisieren

git add package.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.1"
git push origin main
```

### 2. Build erstellen

```powershell
cd app
npm run make
```

### 3. Publish zu GitHub

```powershell
# GitHub Token setzen
$env:GITHUB_TOKEN="your-github-token"

# Publish
npm run publish
```

### 4. Release finalisieren

1. GitHub → Releases → Draft Release
2. Release Notes hinzufügen
3. "Publish release" klicken

---

## 🔐 Build mit Code Signing

```powershell
# Environment Variables setzen
$env:WINDOWS_CERT_PATH="C:\path\to\certificate.pfx"
$env:WINDOWS_CERT_PASSWORD="your-password"

# Build mit Signing
cd app
npm run make:signed
```

---

## 🔄 Auto-Updater konfigurieren

### 1. forge.config.ts anpassen

```typescript
publishers: [
  new PublisherGithub({
    repository: {
      owner: 'your-username',  // ← Dein GitHub Username
      name: 'autolabel',       // ← Dein Repository Name
    },
  }),
],
```

### 2. src/main.ts anpassen

```typescript
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',  // ← Dein GitHub Username
  repo: 'autolabel',       // ← Dein Repository Name
});
```

---

## 🧪 Testing-Checkliste

### Vor jedem Release

- [ ] Production Build erfolgreich
- [ ] Installer funktioniert lokal
- [ ] Installer funktioniert auf sauberem System
- [ ] Alle Features funktionieren
- [ ] Keine kritischen Errors

**Siehe:** `TESTING.md` für vollständige Checkliste

---

## 📝 Wichtige Befehle

```powershell
# Development
npm run start          # App im Dev-Mode starten
npm run fresh          # Clean build + Start

# Build
npm run make           # Production Build
npm run make:signed    # Build mit Code Signing
npm run package        # Package ohne Installer

# Publishing
npm run publish        # Publish zu GitHub
npm run lint           # Code-Qualität prüfen
```

---

## 📚 Dokumentation

- **BUILD.md** - Vollständiger Build & Distribution Guide
- **RELEASE.md** - Release-Prozess Schritt-für-Schritt
- **TESTING.md** - Umfassende Testing-Checkliste
- **CHANGELOG.md** - Versions-Historie

---

## 🆘 Häufige Probleme

### Build-Fehler: "Cannot find module"

```bash
cd app
npm install
npm rebuild
```

### Installer startet nicht

- Rechtsklick → "Als Administrator ausführen"
- Windows Defender/Antivirus temporär deaktivieren

### App startet nicht nach Installation

- Console-Logs prüfen (F12)
- Main Process Logs prüfen
- Fehlende Dependencies installieren

---

## 🔗 Nützliche Links

- [Electron Forge Docs](https://www.electronforge.io/)
- [electron-updater Docs](https://www.electron.build/auto-update)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

**Letzte Aktualisierung:** 2025-01-15
**Version:** 1.0.0

