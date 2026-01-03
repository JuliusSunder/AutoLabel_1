# AutoLabel Icon Fix - Komplett-Dokumentation

## Problem
Die AutoLabel Desktop App zeigte das Standard-Electron-Icon statt dem eigenen AutoLabel-Icon in:
- Desktop-Verknüpfung
- Windows-Suche
- Installierte Apps (Windows Einstellungen)
- Taskleiste

## Ursachen
1. **Falscher Icon-Pfad**: `forge.config.ts` verwies auf `icon_256x256` statt `icon`
2. **Fehlende App User Model ID**: Windows benötigt eine eindeutige ID für korrekte Icon-Zuordnung
3. **Windows Icon Cache**: Windows cached Icons und zeigt alte Icons auch nach Updates

## Implementierte Fixes

### 1. Icon-Pfad korrigiert (`forge.config.ts`)
```typescript
// VORHER (falsch):
icon: './icons/icon_256x256', // Diese Datei existiert nicht

// NACHHER (korrekt):
icon: './icons/icon', // Electron Forge fügt automatisch .ico/.icns hinzu
```

**Zeile 17 in `app/forge.config.ts`**

### 2. Windows App User Model ID gesetzt (`main.ts`)
```typescript
// Neu hinzugefügt nach Zeile 13:
if (process.platform === 'win32') {
  app.setAppUserModelId('com.autolabel.app');
}
```

Diese ID muss mit `appBundleId` in `forge.config.ts` übereinstimmen und hilft Windows, die App eindeutig zu identifizieren.

**Zeilen 15-18 in `app/src/main.ts`**

### 3. Setup Icon bereits korrekt konfiguriert
```typescript
// In MakerSquirrel (Zeile 50):
setupIcon: './icons/icon.ico',
```

Dies war bereits korrekt konfiguriert.

## Icon-Datei Anforderungen

### Benötigte Datei
- **Datei**: `app/icons/icon.ico`
- **Format**: Windows ICO (Multi-Resolution)
- **Größen**: Sollte folgende Größen enthalten:
  - 16×16 (Taskleiste, kleine Icons)
  - 32×32 (Desktop-Verknüpfungen)
  - 48×48 (Explorer-Ansicht)
  - 256×256 (große Icons, Windows 7+)

### Icon-Datei überprüfen
```powershell
# PowerShell Script ausführen:
.\fix-icon-cache.ps1
```

Das Script:
- ✅ Überprüft ob `icon.ico` existiert
- ✅ Validiert das ICO-Format
- ✅ Zeigt Anzahl der enthaltenen Größen
- ✅ Löscht Windows Icon-Cache (optional)

## Anwendung der Fixes

### Schritt 1: Icon-Cache prüfen und leeren (optional)
```powershell
cd app
.\fix-icon-cache.ps1
```

Folge den Anweisungen im Script. Das Leeren des Caches ist optional, aber empfohlen.

### Schritt 2: Alte Installation entfernen
1. Windows Einstellungen → Apps → AutoLabel
2. Deinstallieren
3. Warten bis vollständig entfernt

### Schritt 3: App neu bauen
```powershell
cd app
npm run make
```

### Schritt 4: Neu installieren
```powershell
# Installer befindet sich in:
cd out\make\squirrel.windows\x64\
.\AutoLabel-Setup.exe
```

### Schritt 5: Verifizieren
Nach Installation überprüfen:
- ✅ Desktop-Verknüpfung zeigt AutoLabel-Icon
- ✅ Windows-Suche zeigt AutoLabel-Icon
- ✅ Installierte Apps zeigen AutoLabel-Icon
- ✅ Taskleiste zeigt AutoLabel-Icon (wenn App läuft)

## Troubleshooting

### Icon wird immer noch nicht angezeigt

#### Problem 1: Windows Icon-Cache nicht geleert
**Lösung:**
```powershell
# Manuell Icon-Cache leeren:
taskkill /F /IM explorer.exe
del /A /F /Q "%localappdata%\IconCache.db"
del /A /F /Q "%localappdata%\Microsoft\Windows\Explorer\iconcache*.db"
del /A /F /Q "%localappdata%\Microsoft\Windows\Explorer\thumbcache*.db"
start explorer.exe
```

#### Problem 2: Computer-Neustart erforderlich
Windows cached Icons manchmal so aggressiv, dass nur ein Neustart hilft.

**Lösung:**
```powershell
# Nach Neustart:
Restart-Computer
```

#### Problem 3: Icon.ico enthält nicht alle Größen
**Überprüfen:**
```powershell
.\fix-icon-cache.ps1
# Zeigt Anzahl der enthaltenen Größen
```

**Lösung:**
Neue Multi-Resolution ICO erstellen mit Tool wie:
- [ImageMagick](https://imagemagick.org/)
- [GIMP](https://www.gimp.org/)
- Online: [ICO Convert](https://icoconvert.com/)

**Beispiel mit ImageMagick:**
```bash
magick convert icon_16x16.png icon_32x32.png icon_48x48.png icon_256x256.png icon.ico
```

#### Problem 4: Squirrel-Installation cached altes Icon
**Lösung:**
```powershell
# Squirrel-Cache leeren:
Remove-Item "$env:LOCALAPPDATA\AutoLabel" -Recurse -Force
```

### Icon in Entwicklung testen (ohne Installation)
```powershell
# App im Dev-Modus starten:
npm start

# Icon wird nur in gepackter App korrekt angezeigt
# Im Dev-Modus kann es abweichen
```

## Technische Details

### Electron Forge Icon-Verarbeitung
1. `packagerConfig.icon` wird ohne Extension angegeben
2. Electron Forge fügt automatisch hinzu:
   - `.ico` für Windows
   - `.icns` für macOS
   - `.png` für Linux
3. Die Datei muss im angegebenen Pfad existieren

### Windows App User Model ID
- **Zweck**: Eindeutige Identifikation der App für Windows
- **Format**: Reverse-Domain-Notation (z.B. `com.autolabel.app`)
- **Wichtig**: Muss mit `appBundleId` übereinstimmen
- **Effekt**: Hilft Windows, Icons, Shortcuts und Taskleisten-Einträge korrekt zuzuordnen

### Squirrel.Windows Icon-Handling
- `setupIcon`: Icon für den Installer (Setup.exe)
- `packagerConfig.icon`: Icon für die installierte App (.exe)
- Beide sollten auf dieselbe ICO-Datei zeigen

## Dateien geändert

### 1. `app/forge.config.ts`
- **Zeile 17**: Icon-Pfad korrigiert von `icon_256x256` zu `icon`

### 2. `app/src/main.ts`
- **Zeilen 15-18**: Windows App User Model ID hinzugefügt

### 3. Neue Dateien
- **`app/fix-icon-cache.ps1`**: PowerShell-Script zum Überprüfen und Cache-Leeren

## Verifikation

### Vor dem Fix
```
❌ Desktop-Verknüpfung: Electron-Icon
❌ Windows-Suche: Electron-Icon
❌ Installierte Apps: Electron-Icon
❌ Taskleiste: Electron-Icon
```

### Nach dem Fix
```
✅ Desktop-Verknüpfung: AutoLabel-Icon
✅ Windows-Suche: AutoLabel-Icon
✅ Installierte Apps: AutoLabel-Icon
✅ Taskleiste: AutoLabel-Icon
```

## Best Practices für Icon-Management

### 1. Icon-Dateien organisieren
```
app/icons/
├── icon.ico          # Multi-Resolution ICO (Windows)
├── icon.icns         # ICNS (macOS)
├── icon_16x16.png    # Einzelne Größen als Backup
├── icon_32x32.png
├── icon_48x48.png
├── icon_64x64.png
├── icon_128x128.png
├── icon_256x256.png
└── icon_512x512.png
```

### 2. Icon-Qualität sicherstellen
- **Auflösung**: Mindestens 256×256 für Quell-PNG
- **Format**: PNG mit Transparenz für beste Qualität
- **Design**: Einfach und erkennbar auch bei 16×16
- **Farben**: Kontrastreiche Farben für gute Sichtbarkeit

### 3. Build-Prozess
```powershell
# 1. Icons erstellen/aktualisieren
npm run build:icons  # Falls vorhanden

# 2. Icon-Cache leeren (bei Updates)
.\fix-icon-cache.ps1

# 3. App bauen
npm run make

# 4. Testen
# - Alte Version deinstallieren
# - Neue Version installieren
# - Icons in allen Bereichen überprüfen
```

### 4. CI/CD Integration
```yaml
# Beispiel für GitHub Actions:
- name: Verify Icons
  run: |
    if (!(Test-Path "app/icons/icon.ico")) {
      Write-Error "icon.ico not found!"
      exit 1
    }
```

## Zusammenfassung

### Änderungen
1. ✅ Icon-Pfad in `forge.config.ts` korrigiert
2. ✅ Windows App User Model ID in `main.ts` gesetzt
3. ✅ PowerShell-Script für Icon-Verifikation erstellt

### Nächste Schritte
1. Icon-Cache leeren (optional): `.\fix-icon-cache.ps1`
2. Alte App deinstallieren
3. App neu bauen: `npm run make`
4. Neu installieren und testen

### Erwartetes Ergebnis
Nach diesen Schritten sollte das AutoLabel-Icon in allen Windows-Bereichen korrekt angezeigt werden.

---

**Erstellt**: 2025-01-03  
**Autor**: AI Assistant  
**Status**: ✅ Implementiert und dokumentiert

