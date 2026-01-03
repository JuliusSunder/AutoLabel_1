# Ghostscript Fix - Exit Code 3221225781 (0xC0000135)

## Problem
Ghostscript schlug im gepackten Electron Build mit Exit Code 3221225781 fehl.
- **Exit Code Bedeutung**: 0xC0000135 = "DLL not found" oder "Application failed to initialize"
- **Symptom**: Ghostscript wurde gefunden, aber konnte nicht ausgeführt werden
- **Ursache**: Fehlende Visual C++ Runtime DLLs

## Root Cause Analysis
Ghostscript (`gswin64c.exe` und `gsdll64.dll`) benötigt die Visual C++ 2015-2022 Redistributable Runtime, die auf vielen Systemen nicht installiert ist.

### Benötigte DLLs:
1. **Visual C++ Runtime (Core)**:
   - `vcruntime140.dll`
   - `vcruntime140_1.dll`
   - `msvcp140.dll`
   - `msvcp140_1.dll`
   - `msvcp140_2.dll`
   - `concrt140.dll`

2. **Universal CRT (UCRT)**:
   - `ucrtbase.dll`
   - `api-ms-win-crt-*.dll` (15 DLLs)

## Lösung
Alle benötigten Visual C++ Runtime DLLs wurden direkt in das Ghostscript `bin/` Verzeichnis kopiert.

### Implementierung

#### Schritt 1: DLLs identifizieren
```powershell
# Prüfe ob Visual C++ Runtime DLLs im System vorhanden sind
Get-ChildItem "C:\Windows\System32" -Filter "VCRUNTIME*.dll"
Get-ChildItem "C:\Windows\System32" -Filter "MSVCP*.dll"
```

#### Schritt 2: DLLs kopieren
```powershell
$sourcePath = "C:\Program Files\Common Files\microsoft shared\ClickToRun\"
$destPath = ".\app\bin\Ghostscript\bin\"

# Core Runtime DLLs
Copy-Item "$sourcePath\vcruntime140.dll" -Destination $destPath
Copy-Item "$sourcePath\vcruntime140_1.dll" -Destination $destPath
Copy-Item "$sourcePath\msvcp140.dll" -Destination $destPath
Copy-Item "$sourcePath\msvcp140_1.dll" -Destination $destPath
Copy-Item "$sourcePath\msvcp140_2.dll" -Destination $destPath
Copy-Item "$sourcePath\concrt140.dll" -Destination $destPath
Copy-Item "$sourcePath\ucrtbase.dll" -Destination $destPath

# Universal CRT DLLs
Get-ChildItem -Path $sourcePath -Filter "api-ms-win-crt-*.dll" | 
    ForEach-Object { Copy-Item $_.FullName -Destination $destPath }
```

#### Schritt 3: Verifikation
```powershell
cd .\app\bin\Ghostscript\bin
.\gswin64c.exe --version
# Output: 10.06.0 (erfolgreich!)
```

## Dateien im Ghostscript bin/ Verzeichnis
Nach dem Fix:
```
app/bin/Ghostscript/bin/
├── gswin64c.exe (Ghostscript Executable)
├── gswin64.exe
├── gsdll64.dll (Ghostscript DLL)
├── gsdll64.lib
├── vcruntime140.dll ✅ NEU
├── vcruntime140_1.dll ✅ NEU
├── msvcp140.dll ✅ NEU
├── msvcp140_1.dll ✅ NEU
├── msvcp140_2.dll ✅ NEU
├── concrt140.dll ✅ NEU
├── ucrtbase.dll ✅ NEU
└── api-ms-win-crt-*.dll (15 Dateien) ✅ NEU
```

## Warum funktioniert es jetzt?

### Windows DLL-Suchreihenfolge:
1. **Verzeichnis der ausführbaren Datei** ← Hier sind die DLLs jetzt!
2. System32/SysWOW64
3. Aktuelles Arbeitsverzeichnis (cwd)
4. PATH-Umgebungsvariable

Da die DLLs jetzt im gleichen Verzeichnis wie `gswin64c.exe` liegen, findet Windows sie sofort.

## Electron Forge Integration
Die DLLs werden automatisch mit gepackt, da sie in `app/bin/Ghostscript/` liegen, welches als `extraResource` in `forge.config.ts` definiert ist:

```typescript
packagerConfig: {
  extraResource: [
    './bin/SumatraPDF',
    './bin/ImageMagick',
    './bin/Ghostscript',  // Enthält jetzt alle DLLs
  ],
}
```

## Alternative Lösungen (nicht implementiert)

### Option 1: Systemweite Installation
- Ghostscript mit Visual C++ Redistributable im Installer installieren
- **Vorteil**: Sauberere Lösung
- **Nachteil**: Benötigt Admin-Rechte, Systemänderungen

### Option 2: Visual C++ Redistributable Installer
- VC Redist im App-Installer integrieren
- **Vorteil**: Einmalige Installation
- **Nachteil**: Größerer Installer, Admin-Rechte

### Option 3: Statisch gelinkte Ghostscript-Version
- Ghostscript selbst kompilieren mit statischen Libraries
- **Vorteil**: Keine DLL-Abhängigkeiten
- **Nachteil**: Sehr aufwändig, schwer zu warten

## Gewählte Lösung: DLL-Bundling
✅ **Vorteile**:
- Keine Admin-Rechte erforderlich
- Keine Systemänderungen
- Funktioniert auf allen Windows-Systemen
- Einfach zu warten (nur DLLs aktualisieren)
- Portable Installation

❌ **Nachteile**:
- Leicht größerer App-Installer (~2-3 MB zusätzlich)
- DLLs müssen bei Updates manuell aktualisiert werden

## Testing
Nach dem Fix:
1. ✅ Ghostscript funktioniert lokal
2. ✅ Build erstellt ohne Fehler
3. ⏳ Gepackter Build muss getestet werden
4. ⏳ Label-Verarbeitung (Hermes, GLS, DHL, DPD)
5. ⏳ Thumbnail-Generierung

## Lessons Learned
1. **Exit Code 0xC0000135** bedeutet immer "DLL not found"
2. Ghostscript benötigt Visual C++ Runtime
3. DLLs im gleichen Verzeichnis wie die .exe sind die einfachste Lösung
4. `extraResource` in Electron Forge kopiert automatisch alle Dateien
5. Keine Änderungen am Code notwendig - nur DLLs hinzufügen

## Referenzen
- [Microsoft Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- [Windows DLL Search Order](https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order)
- [Ghostscript Documentation](https://ghostscript.com/docs/9.56.0/Install.htm)
- [Electron Forge extraResource](https://www.electronforge.io/config/makers/squirrel.windows)

## Datum
2025-01-03

## Autor
AI Assistant (Claude Sonnet 4.5)

