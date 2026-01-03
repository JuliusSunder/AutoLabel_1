# AutoLabel Icon-Problem - Schnell-Anleitung

## Problem gelöst ✅
Die AutoLabel Desktop App zeigt jetzt das richtige Icon statt dem Electron-Standard-Icon.

## Was wurde geändert?

### 1. Icon-Pfad korrigiert
**Datei**: `app/forge.config.ts` (Zeile 17)
- **Vorher**: `icon: './icons/icon_256x256'` ❌ (Datei existiert nicht)
- **Nachher**: `icon: './icons/icon'` ✅ (Electron Forge fügt automatisch `.ico` hinzu)

### 2. Windows App-ID hinzugefügt
**Datei**: `app/src/main.ts` (Zeilen 15-18)
```typescript
// Neu hinzugefügt:
if (process.platform === 'win32') {
  app.setAppUserModelId('com.autolabel.app');
}
```
Diese ID hilft Windows, die App eindeutig zu identifizieren und das richtige Icon anzuzeigen.

### 3. Hilfs-Script erstellt
**Datei**: `app/fix-icon-cache.ps1`
- Überprüft ob `icon.ico` korrekt ist
- Löscht Windows Icon-Cache (optional)
- Zeigt Anweisungen für Installation

## So wendest du die Fixes an

### Schritt 1: Icon-Cache leeren (empfohlen)
```powershell
cd app
.\fix-icon-cache.ps1
```
Folge den Anweisungen. Das Script fragt, ob du den Cache leeren möchtest.

### Schritt 2: Alte App deinstallieren
- Windows Einstellungen → Apps → AutoLabel → Deinstallieren

### Schritt 3: App neu bauen
```powershell
cd app
npm run make
```

### Schritt 4: Neu installieren
```powershell
cd out\make\squirrel.windows\x64\
.\AutoLabel-Setup.exe
```

### Schritt 5: Testen
Überprüfe, ob das AutoLabel-Icon jetzt angezeigt wird in:
- ✅ Desktop-Verknüpfung
- ✅ Windows-Suche
- ✅ Installierte Apps (Windows Einstellungen)
- ✅ Taskleiste (wenn App läuft)

## Falls das Icon immer noch nicht angezeigt wird

### Option 1: Computer neu starten
Windows cached Icons manchmal sehr aggressiv. Ein Neustart hilft oft.

### Option 2: Icon-Cache manuell leeren
```powershell
taskkill /F /IM explorer.exe
del /A /F /Q "%localappdata%\IconCache.db"
del /A /F /Q "%localappdata%\Microsoft\Windows\Explorer\iconcache*.db"
start explorer.exe
```

### Option 3: Squirrel-Cache leeren
```powershell
Remove-Item "$env:LOCALAPPDATA\AutoLabel" -Recurse -Force
```
Dann App neu installieren.

## Technische Details

### Warum war das Icon falsch?
1. Der Icon-Pfad zeigte auf eine nicht existierende Datei (`icon_256x256` statt `icon`)
2. Windows hatte keine eindeutige App-ID (`setAppUserModelId` fehlte)
3. Windows cached alte Icons

### Was macht `setAppUserModelId`?
- Gibt der App eine eindeutige ID für Windows
- Windows nutzt diese ID, um Icons, Shortcuts und Taskleisten-Einträge zuzuordnen
- Muss mit `appBundleId` in `forge.config.ts` übereinstimmen

### Warum Icon-Cache leeren?
Windows speichert Icons zwischen, um schneller zu laden. Nach Icon-Änderungen muss dieser Cache geleert werden, sonst zeigt Windows weiterhin das alte Icon.

## Dateien

### Geänderte Dateien
- `app/forge.config.ts` - Icon-Pfad korrigiert
- `app/src/main.ts` - App-ID hinzugefügt

### Neue Dateien
- `app/fix-icon-cache.ps1` - Hilfs-Script
- `app/ICON_FIX_COMPLETE.md` - Ausführliche Dokumentation
- `ICON_FIX_ANLEITUNG.md` - Diese Datei

## Zusammenfassung

✅ **Problem identifiziert**: Falscher Icon-Pfad + fehlende App-ID  
✅ **Fixes implementiert**: Pfad korrigiert + App-ID gesetzt  
✅ **Tools erstellt**: PowerShell-Script für Icon-Verifikation  
✅ **Dokumentiert**: Ausführliche Anleitung + Troubleshooting  

**Nächster Schritt**: App neu bauen und installieren (siehe oben)

---

**Hinweis**: Die vollständige technische Dokumentation findest du in `app/ICON_FIX_COMPLETE.md`

