# SumatraPDF Installation für AutoLabel

## Was ist SumatraPDF?

SumatraPDF ist ein kostenloses, leichtgewichtiges PDF-Tool für Windows, das perfekt für das direkte Drucken von PDFs geeignet ist. Es wird von AutoLabel verwendet, um Labels ohne Browser-Rendering-Probleme zu drucken.

## Installation

### Option 1: Portable Version (Empfohlen)

1. **Download:**
   - Gehe zu: https://www.sumatrapdfreader.org/download-free-pdf-viewer
   - Lade die **64-bit portable version** herunter: `SumatraPDF-3.5.2-64.zip` (oder neuer)

2. **Installation:**
   - Entpacke die ZIP-Datei
   - Kopiere `SumatraPDF.exe` nach: `C:\Program Files\SumatraPDF\`
   - Oder lege es im AutoLabel-Verzeichnis ab: `app\bin\SumatraPDF.exe`

3. **Pfad für AutoLabel:**
   - Standard: `C:\Program Files\SumatraPDF\SumatraPDF.exe`
   - Alternativ: `app\bin\SumatraPDF.exe` (im Projekt-Ordner)

### Option 2: Installer

1. **Download:**
   - Lade den Installer herunter: `SumatraPDF-3.5.2-64-install.exe`

2. **Installation:**
   - Führe den Installer aus
   - Wähle Installationspfad (Standard: `C:\Program Files\SumatraPDF\`)
   - Folge den Anweisungen

3. **Fertig:**
   - SumatraPDF ist automatisch im System-PATH verfügbar

## Verwendung in AutoLabel

AutoLabel sucht SumatraPDF automatisch in folgenden Pfaden:
1. `C:\Program Files\SumatraPDF\SumatraPDF.exe`
2. `C:\Program Files (x86)\SumatraPDF\SumatraPDF.exe`
3. `app\bin\SumatraPDF.exe` (im Projekt-Ordner)
4. System PATH

Falls SumatraPDF nicht gefunden wird, verwendet AutoLabel automatisch den Electron-Fallback (kann zu Druck-Problemen führen).

## Vorteile von SumatraPDF

- ✅ **Kein schwarzer Hintergrund** - Druckt PDFs exakt wie sie sind
- ✅ **Perfekt für Label-Drucker** - Keine Browser-Rendering-Probleme
- ✅ **Schnell & leichtgewichtig** - Nur ~5 MB
- ✅ **Kostenlos & Open Source** - Keine Lizenzkosten
- ✅ **Command-Line Interface** - Einfache Integration

## Troubleshooting

### SumatraPDF wird nicht gefunden

**Problem:** AutoLabel meldet "SumatraPDF not found, using Electron fallback"

**Lösung:**
1. Prüfe ob SumatraPDF installiert ist
2. Prüfe den Installationspfad
3. Kopiere `SumatraPDF.exe` nach `C:\Program Files\SumatraPDF\`
4. Oder lege es im Projekt-Ordner ab: `app\bin\SumatraPDF.exe`

### Drucker wird nicht gefunden

**Problem:** SumatraPDF kann den Drucker nicht finden

**Lösung:**
1. Prüfe ob der Drucker korrekt installiert ist
2. Teste mit Windows-Druckdialog
3. Prüfe den exakten Drucker-Namen in den Windows-Einstellungen
4. Der Name muss exakt übereinstimmen (Groß-/Kleinschreibung beachten)

### Druck-Fehler

**Problem:** SumatraPDF gibt einen Fehler zurück

**Lösung:**
1. Öffne das PDF manuell in SumatraPDF
2. Teste manuellen Druck über SumatraPDF
3. Prüfe die Konsolen-Ausgabe für Details
4. Stelle sicher, dass der Drucker online ist

## Links

- **Website:** https://www.sumatrapdfreader.org/
- **Download:** https://www.sumatrapdfreader.org/download-free-pdf-viewer
- **GitHub:** https://github.com/sumatrapdfreader/sumatrapdf
- **Dokumentation:** https://www.sumatrapdfreader.org/docs/Command-line-arguments

## Command-Line Optionen

SumatraPDF unterstützt viele nützliche Optionen:

```bash
# Direkt drucken ohne Dialog
SumatraPDF.exe -print-to "Drucker Name" "C:\path\to\file.pdf"

# Mit Print-Dialog
SumatraPDF.exe -print-dialog "C:\path\to\file.pdf"

# Auf Standard-Drucker drucken
SumatraPDF.exe -print-to-default "C:\path\to\file.pdf"

# Mit Einstellungen
SumatraPDF.exe -print-settings "noscale,color" -print-to "Drucker" "file.pdf"
```

AutoLabel verwendet: `-print-to "Drucker Name" "file.pdf"` für direktes, stilles Drucken.

