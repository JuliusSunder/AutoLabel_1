# 📁 AutoLabel Branding - Dateiübersicht

## Geänderte/Erstellte Dateien

### 🔧 Konfigurationsdateien

```
app/
├── package.json                    ✏️ GEÄNDERT
│   └── productName, name, description aktualisiert
│
├── forge.config.ts                 ✏️ GEÄNDERT
│   └── packagerConfig mit Icon-Pfaden und Metadaten
│
└── src/
    └── main.ts                     ✏️ GEÄNDERT
        └── BrowserWindow.title = "AutoLabel"
```

### 🎨 Icon-Dateien

```
app/icons/                          ✨ NEU
├── icon_512x512.png               (macOS Retina)
├── icon_256x256.png               (Windows/macOS Standard)
├── icon_128x128.png
├── icon_64x64.png
├── icon_48x48.png
├── icon_32x32.png
└── icon_16x16.png
```

**Quelle**: `website/public/logo/logo.png` (800×800px)

### 🛠️ Build-Tools

```
app/
├── build-icons.js                  ✨ NEU
│   └── Generiert Icons aus Logo
│
├── build-release.bat               ✨ NEU
│   └── Windows Build-Script
│
└── build-release.ps1               ✨ NEU
    └── PowerShell Build-Script
```

### 📚 Dokumentation

```
app/
├── BRANDING_SETUP.md               ✨ NEU
│   └── Vollständige Setup-Dokumentation
│
├── BRANDING_CHECKLIST.md           ✨ NEU
│   └── Checkliste für Build & Test
│
└── BRANDING_FILES.md               ✨ NEU (diese Datei)
    └── Dateiübersicht
```

## 📊 Änderungsübersicht

### package.json
```json
{
  "name": "autolabel",              // ✏️ war: "app"
  "productName": "AutoLabel",       // ✏️ war: "app"
  "version": "1.0.0",               // ✓ unverändert
  "description": "Automated shipping label management for resellers"  // ✏️ aktualisiert
}
```

### forge.config.ts
```typescript
packagerConfig: {
  name: 'AutoLabel',                // ✨ NEU
  executableName: 'autolabel',      // ✨ NEU
  icon: './icons/icon_256x256',     // ✨ NEU
  appCopyright: 'Copyright © 2025 JuliusSunder',  // ✨ NEU
  appBundleId: 'com.autolabel.app', // ✨ NEU
  asar: { ... }                     // ✓ unverändert
}
```

### src/main.ts
```typescript
const mainWindow = new BrowserWindow({
  width: 800,
  height: 600,
  title: 'AutoLabel',               // ✨ NEU
  webPreferences: { ... }
});
```

## 🎯 Build-Output

Nach `npm run make` werden folgende Dateien erstellt:

```
app/out/
├── make/
│   ├── squirrel.windows/
│   │   └── x64/
│   │       ├── AutoLabel-1.0.0 Setup.exe    🎯 Windows Installer
│   │       └── RELEASES
│   │
│   ├── zip/
│   │   └── darwin/
│   │       └── AutoLabel-darwin-x64-1.0.0.zip  🎯 macOS App
│   │
│   ├── deb/
│   │   └── x64/
│   │       └── autolabel_1.0.0_amd64.deb    🎯 Debian Package
│   │
│   └── rpm/
│       └── x64/
│           └── autolabel-1.0.0-1.x86_64.rpm 🎯 RedHat Package
│
└── AutoLabel-win32-x64/            📦 Unpacked Windows App
    ├── AutoLabel.exe
    ├── resources/
    └── ...
```

## 🔄 Workflow

### 1. Icons generieren
```bash
node build-icons.js
```
**Input**: `website/public/logo/logo.png`  
**Output**: `app/icons/icon_*.png` (7 Dateien)

### 2. Development Build
```bash
npm start
```
**Startet**: Electron App im Dev-Modus  
**Hot Reload**: Ja (Vite)

### 3. Production Build
```bash
npm run make
```
**Output**: `app/out/make/` (Installer für alle Plattformen)  
**Dauer**: ~2-5 Minuten

### 4. Quick Build
```bash
.\build-release.bat    # Windows
.\build-release.ps1    # PowerShell
```
**Macht**: Clean → Icons prüfen → Build → Erfolg anzeigen

## 📝 Wichtige Pfade

| Zweck | Pfad | Typ |
|-------|------|-----|
| Logo-Quelle | `website/public/logo/logo.png` | PNG 800×800 |
| Icon-Ordner | `app/icons/` | Verzeichnis |
| Icon-Referenz | `./icons/icon_256x256` | Relativ |
| Build-Output | `app/out/make/` | Verzeichnis |
| Installer (Win) | `app/out/make/squirrel.windows/x64/` | Verzeichnis |

## 🎨 Logo-Spezifikationen

**Datei**: `website/public/logo/logo.png`

- **Format**: PNG mit Transparenz
- **Größe**: 800×800px (1:1 quadratisch)
- **Hauptfarbe**: Schwarz (#000000)
- **Akzentfarbe**: Dunkelgrün (#1a5f3f)
- **Design**: Kombiniertes "AL" Monogramm
- **Stil**: Modern, minimalistisch
- **Verwendung**: App-Icon, Installer, Startmenü

## 🔍 Datei-Status Legende

- ✏️ **GEÄNDERT** - Existierende Datei wurde modifiziert
- ✨ **NEU** - Neue Datei wurde erstellt
- ✓ **UNVERÄNDERT** - Keine Änderungen
- 🎯 **OUTPUT** - Build-Ergebnis
- 📦 **GENERIERT** - Automatisch erstellt

## 🧹 Aufräumen

### Build-Cache löschen
```bash
npm run clean
```
**Löscht**: `.vite/` Verzeichnis

### Icons neu generieren
```bash
node build-icons.js
```
**Löscht**: Alte Icons  
**Erstellt**: Neue Icons aus Logo

### Kompletter Reset
```bash
npm run clean
rm -rf out/
rm -rf icons/
node build-icons.js
npm run make
```

## 📦 Versionierung

Bei Version-Updates:

1. **package.json** → `version` erhöhen
2. **Build neu erstellen**: `npm run make`
3. **Installer-Name** ändert sich automatisch:
   - `AutoLabel-1.0.0 Setup.exe` → `AutoLabel-1.0.1 Setup.exe`

## 🎉 Zusammenfassung

**Geänderte Dateien**: 3  
**Neue Dateien**: 13 (7 Icons + 3 Scripts + 3 Docs)  
**Build-Output**: 4 Plattformen (Windows, macOS, Debian, RedHat)  
**Status**: ✅ Vollständig konfiguriert

---

**Erstellt**: 28. Dezember 2025  
**Projekt**: AutoLabel v1.0.0  
**Zweck**: Branding-Dokumentation

