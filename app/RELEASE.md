# Release Process

Dieser Guide beschreibt den Schritt-für-Schritt-Prozess für neue Releases von AutoLabel.

---

## 📋 Pre-Release Checkliste

### 1. Version & Changelog

- [ ] **Version erhöhen** in `package.json`
  ```json
  {
    "version": "1.0.1"  // Neue Version
  }
  ```

- [ ] **CHANGELOG.md aktualisieren**
  ```markdown
  ## [1.0.1] - 2025-01-15
  
  ### Added
  - Neue Features
  
  ### Changed
  - Änderungen
  
  ### Fixed
  - Bugfixes
  
  ### Security
  - Sicherheits-Updates
  ```

### 2. Code Quality

- [ ] Alle Linter-Fehler behoben
- [ ] TypeScript-Errors behoben
- [ ] Console-Warnings geprüft
- [ ] Unused Code entfernt
- [ ] Comments aktualisiert

### 3. Testing

- [ ] **Development Testing**
  - [ ] Alle Screens funktionieren
  - [ ] Email-Scan funktioniert
  - [ ] Label-Preparation funktioniert
  - [ ] Printing funktioniert
  - [ ] Settings werden gespeichert
  - [ ] Datenbank-Operationen funktionieren

- [ ] **Build Testing**
  - [ ] Production Build erfolgreich
  - [ ] Installer erstellt
  - [ ] Installer-Größe plausibel (150-250 MB)
  - [ ] Alle Dateien vorhanden (Setup.exe, .nupkg, RELEASES)

- [ ] **Installation Testing (Lokales System)**
  - [ ] Installer startet
  - [ ] Installation erfolgreich
  - [ ] App startet nach Installation
  - [ ] Alle Features funktionieren
  - [ ] Uninstall funktioniert

- [ ] **Installation Testing (Sauberes System)**
  - [ ] Windows 10 VM/System
  - [ ] Windows 11 VM/System
  - [ ] Installation ohne Admin-Rechte
  - [ ] Installation mit Admin-Rechten
  - [ ] Keine fehlenden Dependencies
  - [ ] Keine Runtime-Errors

### 4. Documentation

- [ ] README.md aktualisiert
- [ ] BUILD.md aktualisiert (falls Build-Prozess geändert)
- [ ] CHANGELOG.md vollständig
- [ ] User-facing Dokumentation aktualisiert

---

## 🚀 Release-Prozess

### Schritt 1: Preparation

```bash
# Repository aktualisieren
git pull origin main

# Dependencies aktualisieren
cd app
npm install

# Clean build
npm run clean
```

### Schritt 2: Version & Changelog

```bash
# Version erhöhen in package.json
# CHANGELOG.md aktualisieren
# Änderungen committen
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.1"
git push origin main
```

### Schritt 3: Production Build

**Ohne Code Signing:**
```bash
cd app
npm run make
```

**Mit Code Signing:**
```powershell
# Environment Variables setzen
$env:WINDOWS_CERT_PATH="C:\path\to\certificate.pfx"
$env:WINDOWS_CERT_PASSWORD="your-password"

# Build
cd app
npm run make:signed
```

**Build-Output prüfen:**
```
app/out/make/squirrel.windows/x64/
├── AutoLabel-1.0.1 Setup.exe      ← Installer
├── AutoLabel-1.0.1-full.nupkg     ← Update Package
└── RELEASES                        ← Update Manifest
```

### Schritt 4: Testing

**Lokaler Test:**
```powershell
# Installer ausführen
.\out\make\squirrel.windows\x64\AutoLabel-1.0.1 Setup.exe
```

**Test-Checkliste:**
- [ ] Installation erfolgreich
- [ ] App startet
- [ ] Alle Features funktionieren
- [ ] Keine Console-Errors

**Sauberes System Test:**
- [ ] Windows VM vorbereiten
- [ ] Installer kopieren
- [ ] Installation testen
- [ ] Alle Features testen

### Schritt 5: GitHub Release

**Option A: Automatisches Publishing (empfohlen)**

```powershell
# GitHub Token setzen
$env:GITHUB_TOKEN="your-github-token"

# Publish
cd app
npm run publish
```

**Option B: Manuelles Publishing**

1. **GitHub Release erstellen:**
   - GitHub → Releases → "Draft a new release"
   - Tag: `v1.0.1`
   - Release title: `AutoLabel v1.0.1`
   - Description: Copy from CHANGELOG.md

2. **Dateien hochladen:**
   - `AutoLabel-1.0.1 Setup.exe`
   - `AutoLabel-1.0.1-full.nupkg`
   - `RELEASES`

3. **Release veröffentlichen:**
   - "Publish release" klicken

### Schritt 6: Release finalisieren

1. **GitHub Draft Release prüfen:**
   - Release Notes vollständig?
   - Alle Assets hochgeladen?
   - Version korrekt?

2. **Release veröffentlichen:**
   - "Publish release" klicken

3. **Git Tag erstellen (falls nicht automatisch):**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

---

## 🔄 Post-Release

### 1. Update-Test

**Test-Szenario:**
1. Alte Version installieren (z.B. 1.0.0)
2. App starten
3. Warten auf Update-Notification
4. Update sollte automatisch erkannt werden
5. Update herunterladen lassen
6. App neu starten
7. Neue Version sollte installiert sein

**Checkliste:**
- [ ] Update wird erkannt
- [ ] Download funktioniert
- [ ] Installation funktioniert
- [ ] Daten bleiben erhalten
- [ ] Settings bleiben erhalten
- [ ] Keine Breaking Changes

### 2. Monitoring

**Erste 24 Stunden:**
- [ ] GitHub Issues prüfen
- [ ] User-Feedback sammeln
- [ ] Crash-Reports prüfen (falls implementiert)
- [ ] Download-Statistiken prüfen

**Erste Woche:**
- [ ] Update-Rate prüfen
- [ ] Häufige Probleme identifizieren
- [ ] Hotfix vorbereiten (falls nötig)

### 3. Documentation

- [ ] Release Notes auf Website veröffentlichen
- [ ] Social Media Announcement (optional)
- [ ] User benachrichtigen (Email, Discord, etc.)

---

## 🐛 Hotfix-Prozess

Für kritische Bugs zwischen Releases:

### Schritt 1: Hotfix-Branch

```bash
git checkout -b hotfix/1.0.2
```

### Schritt 2: Fix implementieren

```bash
# Bug fixen
# Testen
git add .
git commit -m "fix: critical bug XYZ"
```

### Schritt 3: Version erhöhen

```json
// package.json
{
  "version": "1.0.2"  // Patch-Version erhöhen
}
```

### Schritt 4: Release

```bash
# Merge zu main
git checkout main
git merge hotfix/1.0.2

# Build & Release
npm run make
npm run publish

# Tag erstellen
git tag v1.0.2
git push origin main --tags
```

---

## 📊 Release-Typen

### Major Release (1.0.0 → 2.0.0)

**Wann:**
- Breaking Changes
- Große neue Features
- Architektur-Änderungen

**Vorbereitung:**
- Migration-Guide erstellen
- Beta-Testing Phase
- Ausführliche Release Notes

### Minor Release (1.0.0 → 1.1.0)

**Wann:**
- Neue Features
- Verbesserungen
- Keine Breaking Changes

**Vorbereitung:**
- Feature-Testing
- Dokumentation aktualisieren
- Release Notes

### Patch Release (1.0.0 → 1.0.1)

**Wann:**
- Bugfixes
- Security-Updates
- Kleine Verbesserungen

**Vorbereitung:**
- Bugfix-Testing
- Kurze Release Notes

---

## 🔐 Security Releases

Für Security-Updates:

### Priorität: HOCH

1. **Sofort fixen**
2. **Patch Release erstellen**
3. **Security Advisory veröffentlichen**
4. **User benachrichtigen**

### Prozess

```bash
# Hotfix-Branch
git checkout -b security/CVE-2025-XXXX

# Fix implementieren
# Security-Tests durchführen

# Version erhöhen (Patch)
# CHANGELOG mit Security-Hinweis

# Release
npm run make
npm run publish

# GitHub Security Advisory erstellen
```

---

## 📝 Release Notes Template

```markdown
## AutoLabel v1.0.1

**Release Date:** 2025-01-15

### ✨ New Features
- Feature A: Description
- Feature B: Description

### 🔧 Improvements
- Improvement A: Description
- Improvement B: Description

### 🐛 Bug Fixes
- Fix A: Description
- Fix B: Description

### 🔐 Security
- Security Update A: Description

### 📚 Documentation
- Documentation Update A

### ⚠️ Breaking Changes
- Breaking Change A: Description and Migration Guide

### 🙏 Contributors
- @contributor1
- @contributor2

### 📦 Installation

**New Installation:**
Download `AutoLabel-1.0.1 Setup.exe` and run the installer.

**Update from previous version:**
The app will automatically update on next start.

### 🐛 Known Issues
- Issue A: Workaround
- Issue B: Fix planned for v1.0.2
```

---

## 🎯 Release-Metriken

### Zu trackende Metriken

- **Download-Zahlen**
  - Neue Installationen
  - Updates

- **Update-Rate**
  - % der User auf neuester Version
  - Zeit bis 50% Update-Rate
  - Zeit bis 90% Update-Rate

- **Fehler-Rate**
  - Crash-Reports
  - GitHub Issues
  - User-Beschwerden

- **Performance**
  - App-Startzeit
  - Memory-Usage
  - CPU-Usage

---

## 🚨 Rollback-Plan

Falls ein Release kritische Probleme hat:

### Option 1: Hotfix Release

```bash
# Schneller Hotfix
git checkout -b hotfix/1.0.2
# Fix implementieren
# Release 1.0.2
```

### Option 2: Release zurückziehen

```bash
# GitHub Release als "Pre-release" markieren
# Warnung in Release Notes
# User auf alte Version hinweisen
```

### Option 3: Downgrade-Anleitung

```markdown
## Downgrade zu v1.0.0

1. Uninstall v1.0.1
2. Download v1.0.0 Setup.exe
3. Install v1.0.0
4. Daten-Backup wiederherstellen (falls nötig)
```

---

## 📞 Support nach Release

### User-Support

- GitHub Issues monitoren
- Email-Support beantworten
- Community-Fragen beantworten

### Dokumentation

- FAQ aktualisieren
- Troubleshooting-Guide erweitern
- Video-Tutorials erstellen (optional)

---

## ✅ Release-Checkliste (Kurzversion)

### Pre-Release
- [ ] Version erhöhen
- [ ] CHANGELOG aktualisieren
- [ ] Code Quality prüfen
- [ ] Alle Tests durchführen
- [ ] Build erstellen
- [ ] Lokaler Test
- [ ] Sauberes System Test

### Release
- [ ] GitHub Token setzen
- [ ] `npm run publish`
- [ ] Draft Release prüfen
- [ ] Release Notes hinzufügen
- [ ] Release veröffentlichen

### Post-Release
- [ ] Update-Test
- [ ] Monitoring (24h)
- [ ] User-Feedback
- [ ] Dokumentation

---

**Letzte Aktualisierung:** 2025-01-15
**Version:** 1.0.0

