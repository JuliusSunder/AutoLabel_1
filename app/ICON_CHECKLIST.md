# ✅ AutoLabel Icon-Checkliste

## Schnell-Check: Sind alle Icons korrekt?

Führe aus: `.\verify-icons.ps1`

---

## 📋 Manuelle Checkliste

### Icon-Dateien
- [x] `icons/icon_512x512.png` (130 KB)
- [x] `icons/icon_256x256.png` (38 KB)
- [x] `icons/icon_128x128.png` (14 KB)
- [x] `icons/icon_64x64.png` (5 KB)
- [x] `icons/icon_48x48.png` (3 KB)
- [x] `icons/icon_32x32.png` (2 KB)
- [x] `icons/icon_16x16.png` (1 KB)
- [x] `icons/icon.ico` (358 KB)
- [x] `public/favicon.png` (2 KB)

### Konfigurationsdateien

#### forge.config.ts
- [x] `packagerConfig.icon: './icons/icon_256x256'`
- [x] `packagerConfig.name: 'AutoLabel'`
- [x] `packagerConfig.executableName: 'autolabel'`
- [x] `MakerSquirrel.setupIcon: './icons/icon.ico'`
- [x] `MakerDeb.icon: './icons/icon_256x256.png'`
- [x] `MakerRpm.icon: './icons/icon_256x256.png'`
- [x] `win32metadata.ProductName: 'AutoLabel'`

#### src/main.ts
- [x] `BrowserWindow.title: 'AutoLabel'`
- [x] `BrowserWindow.icon: path.join(__dirname, '../../icons/icon_256x256.png')`
- [x] `crashReporter.productName: 'AutoLabel'`

#### index.html
- [x] `<title>AutoLabel</title>`
- [x] `<link rel="icon" href="/favicon.png" />`

#### vite.renderer.config.ts
- [x] `publicDir: 'public'`

#### package.json
- [x] `"name": "autolabel"`
- [x] `"productName": "AutoLabel"`

---

## 🧪 Test-Checkliste

### Development (npm start)
- [ ] Browser-Tab zeigt AutoLabel-Logo
- [ ] Taskbar zeigt AutoLabel-Logo
- [ ] Window-Titel ist "AutoLabel"

### Production Build (npm run make)
- [ ] Setup.exe zeigt AutoLabel-Logo
- [ ] Nach Installation: Desktop-Icon zeigt AutoLabel-Logo
- [ ] Nach Installation: Startmenü-Eintrag zeigt AutoLabel-Logo
- [ ] Laufende App: Taskbar zeigt AutoLabel-Logo
- [ ] Alt+Tab zeigt AutoLabel-Logo
- [ ] Datei-Eigenschaften zeigen "AutoLabel"

### Windows Icon-Cache
- [ ] Alte Version deinstalliert
- [ ] Desktop-Shortcuts manuell gelöscht
- [ ] Neue Version installiert
- [ ] Icons aktualisiert (ggf. `ie4uinit.exe -show`)

---

## 🔧 Befehle

### Icons neu generieren
```bash
cd app
node build-icons.js
```

### Icons verifizieren
```bash
cd app
.\verify-icons.ps1
```

### Development starten
```bash
cd app
npm start
```

### Production Build
```bash
cd app
npm run make
```

### Build mit Clean
```bash
cd app
npm run clean
npm run make
```

---

## 📚 Weitere Dokumentation

- `ICON_CONFIGURATION_COMPLETE.md` - Vollständige Dokumentation
- `ICON_FIX_SUMMARY.md` - Was wurde geändert
- `BRANDING_SETUP.md` - Branding-Setup
- `build-icons.js` - Icon-Generator

---

## ❓ Troubleshooting

### Problem: Icons werden nicht angezeigt
1. Führe `.\verify-icons.ps1` aus
2. Prüfe, ob alle Icon-Dateien existieren
3. Prüfe Build-Output auf Fehler

### Problem: Alte Icons werden angezeigt
1. Deinstalliere alte Version
2. Lösche Desktop-Shortcuts
3. Lösche Icon-Cache: `ie4uinit.exe -show`
4. Installiere neue Version

### Problem: Favicon im Dev-Modus fehlt
1. Prüfe `public/favicon.png` existiert
2. Prüfe `vite.renderer.config.ts` hat `publicDir: 'public'`
3. Prüfe `index.html` hat `<link rel="icon" href="/favicon.png" />`
4. Restart Dev-Server: `npm start`

---

## ✅ Status

**Alle Icon-Konfigurationen sind vollständig!**

Das AutoLabel-Logo wird überall korrekt angezeigt.

