# ✅ AutoLabel Branding Checklist

## Konfigurierte Dateien

### 📦 Package Configuration
- [x] **package.json**
  - [x] `name: "autolabel"`
  - [x] `productName: "AutoLabel"`
  - [x] `description: "Automated shipping label management for resellers"`
  - [x] `version: "1.0.0"`
  - [x] `author: JuliusSunder`

### 🎨 Icons
- [x] **Logo-Quelle**: `website/public/logo/logo.png` (800×800px)
- [x] **Icons generiert**: `app/icons/icon_*.png`
  - [x] 512×512px (macOS Retina)
  - [x] 256×256px (Windows, macOS)
  - [x] 128×128px
  - [x] 64×64px
  - [x] 48×48px
  - [x] 32×32px
  - [x] 16×16px

### ⚙️ Forge Configuration
- [x] **forge.config.ts**
  - [x] `packagerConfig.name: "AutoLabel"`
  - [x] `packagerConfig.executableName: "autolabel"`
  - [x] `packagerConfig.icon: "./icons/icon_256x256"`
  - [x] `packagerConfig.appCopyright: "Copyright © 2025 JuliusSunder"`
  - [x] `packagerConfig.appBundleId: "com.autolabel.app"`
  - [x] Windows Squirrel Maker konfiguriert
  - [x] Linux Deb/RPM Maker konfiguriert

### 🪟 Window Configuration
- [x] **src/main.ts**
  - [x] `BrowserWindow.title: "AutoLabel"`
- [x] **index.html**
  - [x] `<title>AutoLabel</title>` (bereits vorhanden)

### 🛠️ Build Scripts
- [x] **build-icons.js** - Icon-Generator
- [x] **build-release.bat** - Windows Build-Script
- [x] **build-release.ps1** - PowerShell Build-Script

### 📚 Dokumentation
- [x] **BRANDING_SETUP.md** - Vollständige Setup-Dokumentation
- [x] **BRANDING_CHECKLIST.md** - Diese Checkliste

## 🎯 Erwartetes Ergebnis

Nach dem Build sollte die App folgendes zeigen:

### Windows
- ✅ **Installer**: `AutoLabel-1.0.0 Setup.exe`
- ✅ **Setup-Icon**: AutoLabel-Logo (grünes AL)
- ✅ **Installationsordner**: `C:\Users\{user}\AppData\Local\AutoLabel`
- ✅ **Startmenü-Eintrag**: "AutoLabel"
- ✅ **Desktop-Icon**: AutoLabel-Logo
- ✅ **Taskbar**: AutoLabel-Logo
- ✅ **Window-Titel**: "AutoLabel"
- ✅ **Deinstallation**: "AutoLabel" in Systemsteuerung

### macOS
- ✅ **App-Bundle**: `AutoLabel.app`
- ✅ **Dock-Icon**: AutoLabel-Logo
- ✅ **Launchpad**: "AutoLabel"
- ✅ **Window-Titel**: "AutoLabel"

### Linux
- ✅ **Package**: `autolabel_1.0.0_amd64.deb` / `autolabel-1.0.0-1.x86_64.rpm`
- ✅ **App-Name**: "AutoLabel"
- ✅ **Kategorie**: Office → Utility
- ✅ **Icon**: AutoLabel-Logo

## 🚀 Build-Anweisungen

### Quick Build (Windows)
```bash
cd app
.\build-release.bat
```

### Quick Build (PowerShell)
```bash
cd app
.\build-release.ps1
```

### Manueller Build
```bash
cd app
npm run clean    # Cache löschen
npm run make     # Production Build
```

### Icons neu generieren
```bash
cd app
node build-icons.js
```

## 🧪 Test-Checkliste nach Build

### Vor der Installation
- [ ] Setup.exe hat AutoLabel-Icon
- [ ] Setup.exe heißt "AutoLabel-1.0.0 Setup.exe"
- [ ] Dateigröße ist plausibel (~100-200 MB)

### Nach der Installation
- [ ] App erscheint im Startmenü als "AutoLabel"
- [ ] Desktop-Shortcut zeigt AutoLabel-Logo
- [ ] App-Icon in Taskbar zeigt Logo
- [ ] Window-Titel ist "AutoLabel"
- [ ] App startet ohne Fehler
- [ ] Alle Funktionen arbeiten korrekt

### In der App
- [ ] Navigation zeigt "AutoLabel"
- [ ] Keine "app" oder "Electron" Referenzen sichtbar
- [ ] Logo ist scharf und gut lesbar

### Deinstallation
- [ ] "Programme hinzufügen/entfernen" zeigt "AutoLabel"
- [ ] Deinstallation funktioniert sauber

## 🐛 Bekannte Probleme & Lösungen

### Problem: Icons werden nicht angezeigt
**Lösung**:
```bash
cd app
node build-icons.js
npm run clean
npm run make
```

### Problem: App heißt noch "app"
**Lösung**: Prüfe `package.json` → `productName` und `forge.config.ts` → `packagerConfig.name`

### Problem: Window-Titel falsch
**Lösung**: Prüfe `src/main.ts` → `BrowserWindow.title` und `index.html` → `<title>`

### Problem: Build schlägt fehl
**Lösung**:
```bash
cd app
npm run clean
rm -rf node_modules
npm install
npm run make
```

## 📊 Branding-Status

| Komponente | Status | Notizen |
|------------|--------|---------|
| Package.json | ✅ | Alle Felder konfiguriert |
| Icons | ✅ | 7 Größen generiert |
| Forge Config | ✅ | Windows/macOS/Linux |
| Window-Titel | ✅ | main.ts + index.html |
| Build-Scripts | ✅ | .bat + .ps1 |
| Dokumentation | ✅ | Vollständig |

## 🎉 Fertig!

Das AutoLabel-Branding ist vollständig konfiguriert und bereit für den Production-Build!

**Nächster Schritt**: `.\build-release.bat` ausführen und Installer testen.

---

**Erstellt**: 28. Dezember 2025  
**Version**: 1.0.0  
**Status**: ✅ Abgeschlossen

