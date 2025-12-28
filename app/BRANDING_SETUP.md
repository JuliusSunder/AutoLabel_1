# AutoLabel Branding Setup

## ✅ Konfiguration abgeschlossen

Das AutoLabel-Branding wurde vollständig konfiguriert. Die App verwendet jetzt das offizielle Logo und korrekte Metadaten.

## 📦 Was wurde konfiguriert?

### 1. Package.json
- **productName**: `AutoLabel` (wird im Installer und Startmenü angezeigt)
- **name**: `autolabel` (npm-Paketname, kleingeschrieben)
- **description**: "Automated shipping label management for resellers"
- **version**: `1.0.0`
- **author**: JuliusSunder

### 2. App-Icons
Icons wurden aus dem Logo (`website/public/logo/logo.png`) generiert:
- **Quelle**: 800×800px PNG mit transparentem Hintergrund
- **Farben**: Schwarz (#000000) und Dunkelgrün (#1a5f3f)
- **Design**: Kombiniertes "AL" Monogramm

**Generierte Icon-Größen**:
- Windows (.ico): 256×256, 128×128, 64×64, 48×48, 32×32, 16×16
- macOS (.icns): 512×512, 256×256, 128×128, 64×64, 32×32, 16×16

**Speicherort**: `app/icons/icon_*.png`

### 3. Forge Config (`forge.config.ts`)
**Packager Config**:
```typescript
{
  name: 'AutoLabel',
  executableName: 'autolabel',
  icon: './icons/icon_256x256',
  appCopyright: 'Copyright © 2025 JuliusSunder',
  appBundleId: 'com.autolabel.app'
}
```

**Windows Installer (Squirrel)**:
- Name: AutoLabel
- Setup-Icon: `./icons/icon_256x256.png`
- Beschreibung und Metadaten

**Linux Packages (Deb/RPM)**:
- Package-Name: `autolabel`
- Produkt-Name: AutoLabel
- Kategorie: Office, Utility
- Icon konfiguriert

### 4. Window-Titel
- **main.ts**: `title: 'AutoLabel'` im BrowserWindow
- **index.html**: `<title>AutoLabel</title>` (bereits vorhanden)

## 🚀 Build & Deployment

### Icons neu generieren
Falls das Logo aktualisiert wird:
```bash
cd app
node build-icons.js
```

### Development Build
```bash
cd app
npm start
```

### Production Build
```bash
cd app
npm run make
```

**Output**:
- Windows: `app/out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe`
- macOS: `app/out/make/AutoLabel-darwin-x64-1.0.0.zip`
- Linux: `app/out/make/deb/x64/autolabel_1.0.0_amd64.deb`
- Linux: `app/out/make/rpm/x64/autolabel-1.0.0-1.x86_64.rpm`

## 🎨 Branding-Details

### Logo-Spezifikationen
- **Format**: PNG mit Transparenz
- **Größe**: 800×800px (quadratisch)
- **Hauptfarbe**: Schwarz (#000000)
- **Akzentfarbe**: Dunkelgrün (#1a5f3f)
- **Design**: Stilisiertes "AL" Monogramm

### App-Name Verwendung
- **Vollständiger Name**: AutoLabel (PascalCase)
- **Executable**: autolabel (lowercase)
- **Package**: autolabel (lowercase)
- **Display**: AutoLabel (PascalCase)

## ✅ Checkliste nach Build

Nach dem Build solltest du prüfen:

- [ ] **Installer-Icon**: Setup.exe zeigt AutoLabel-Logo
- [ ] **App-Icon**: Installierte App zeigt Logo in Taskbar/Startmenü
- [ ] **Window-Titel**: Fenster zeigt "AutoLabel" in Titelleiste
- [ ] **Startmenü**: App heißt "AutoLabel" (nicht "app")
- [ ] **Über-Dialog**: Zeigt korrekte Version und Copyright
- [ ] **Deinstallation**: Programm heißt "AutoLabel"

## 🔧 Troubleshooting

### Icons werden nicht angezeigt
1. Icons neu generieren: `node build-icons.js`
2. Build-Cache löschen: `npm run clean`
3. Neu builden: `npm run make`

### Falscher App-Name
- Prüfe `package.json` → `productName`
- Prüfe `forge.config.ts` → `packagerConfig.name`

### Icon-Qualität schlecht
- Stelle sicher, dass `logo.png` mindestens 512×512px ist
- Verwende PNG mit Transparenz (kein JPEG)

## 📝 Weitere Anpassungen

### Copyright-Jahr aktualisieren
In `forge.config.ts`:
```typescript
appCopyright: 'Copyright © 2025 JuliusSunder'
```

### Bundle-ID ändern (macOS)
In `forge.config.ts`:
```typescript
appBundleId: 'com.autolabel.app'
```

### Version erhöhen
In `package.json`:
```json
"version": "1.0.1"
```

## 🎯 Nächste Schritte

1. **Production Build testen**: `npm run make`
2. **Installer testen**: Setup.exe ausführen
3. **App installieren und starten**
4. **Branding visuell prüfen** (Icon, Titel, Startmenü)
5. **Bei Bedarf anpassen und neu builden**

---

**Status**: ✅ Branding vollständig konfiguriert  
**Letzte Aktualisierung**: 28. Dezember 2025

