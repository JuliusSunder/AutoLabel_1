# 🎨 AutoLabel Branding - Quick Start

## ✅ Status: Vollständig konfiguriert

Das AutoLabel-Branding ist fertig eingerichtet und bereit für den Production-Build.

---

## 🚀 Quick Start

### Production Build erstellen
```bash
cd app
.\build-release.bat
```

**Output**: `out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe`

---

## 📚 Dokumentation

| Datei | Zweck |
|-------|-------|
| **BRANDING_SUMMARY.md** | 📋 Übersicht & Zusammenfassung |
| **BRANDING_SETUP.md** | 📖 Vollständige Anleitung |
| **BRANDING_CHECKLIST.md** | ✅ Test-Checkliste |
| **BRANDING_FILES.md** | 📁 Dateiübersicht |

---

## 🎯 Was wurde konfiguriert?

✅ **Package.json** - Name: "AutoLabel", Beschreibung  
✅ **Icons** - 7 Größen aus Logo generiert  
✅ **Forge Config** - Windows/macOS/Linux  
✅ **Window-Titel** - "AutoLabel"  
✅ **Build-Scripts** - Automatisierte Builds  

---

## 🛠️ Wichtige Commands

```bash
# Icons neu generieren
node build-icons.js

# Development starten
npm start

# Production Build
npm run make

# Cache löschen
npm run clean

# Quick Build (empfohlen)
.\build-release.bat
```

---

## 📦 Build-Output

Nach `npm run make`:

- **Windows**: `out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe`
- **macOS**: `out/make/zip/darwin/AutoLabel-darwin-x64-1.0.0.zip`
- **Linux Deb**: `out/make/deb/x64/autolabel_1.0.0_amd64.deb`
- **Linux RPM**: `out/make/rpm/x64/autolabel-1.0.0-1.x86_64.rpm`

---

## 🎨 Logo

**Quelle**: `website/public/logo/logo.png`

- 800×800px PNG mit Transparenz
- Schwarz (#000000) + Dunkelgrün (#1a5f3f)
- "AL" Monogramm

---

## 🧪 Test-Checkliste

Nach Build testen:

- [ ] Installer hat AutoLabel-Icon
- [ ] App im Startmenü: "AutoLabel"
- [ ] Taskbar zeigt Logo
- [ ] Window-Titel: "AutoLabel"
- [ ] App startet ohne Fehler

---

## 🔧 Troubleshooting

**Icons fehlen?**
```bash
node build-icons.js
npm run clean
npm run make
```

**Build schlägt fehl?**
```bash
npm run clean
npm install
npm run make
```

---

## 📊 Zusammenfassung

| Element | Status |
|---------|--------|
| Package.json | ✅ |
| Icons (7 Größen) | ✅ |
| Forge Config | ✅ |
| Window-Titel | ✅ |
| Build-Scripts | ✅ |
| Dokumentation | ✅ |

**Bereit für Production-Build!** 🎉

---

**Nächster Schritt**: `.\build-release.bat` ausführen und Installer testen.

**Vollständige Dokumentation**: Siehe `BRANDING_SUMMARY.md`

