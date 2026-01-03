# Druck-Bug Fix: Leere Seiten trotz SumatraPDF

## ✅ GELÖST: SumatraPDF Pfad-Problem

**Datum:** 2025-01-03  
**Status:** ✅ Behoben

### Das eigentliche Problem

SumatraPDF wurde an einem falschen Pfad gesucht:
- **Gesucht:** `resources\bin\SumatraPDF\SumatraPDF.exe`
- **Tatsächlich:** `resources\SumatraPDF\SumatraPDF.exe` (ohne `bin/` Ordner)

Die `extraResource` Konfiguration in Electron Forge kopiert Dateien direkt nach `resources/`, nicht nach `resources/bin/`.

### Die Lösung

Die `findSumatraPDF()` Funktion prüft jetzt diese Pfade (in dieser Reihenfolge):
1. ✅ `resources/SumatraPDF/SumatraPDF.exe` (primär)
2. `resources/bin/SumatraPDF/SumatraPDF.exe` (alternativ)
3. `resources/app.asar.unpacked/bin/SumatraPDF/SumatraPDF.exe` (AutoUnpackNativesPlugin)
4. Entwicklungspfade
5. System-Installationen

Zusätzlich: ASAR-Pfade (ohne `.unpacked`) werden übersprungen, da Windows keine EXE-Dateien aus ASAR-Archiven ausführen kann.

---

## 🐛 Ursprüngliches Problem (für Referenz)

**Symptome:**
- SumatraPDF wird gefunden und ausgeführt
- SumatraPDF meldet "Print failed - check printer"
- App fällt auf Electron-Fallback zurück
- Electron druckt leere Seiten

**Console-Ausgabe:**
```
[Main] [Printer] Attempting to print with SumatraPDF...
[Main] [Printer] ⚠️ SumatraPDF failed: Print failed - check printer "X4 (Kopie 1)"
[Main] [Printer] Attempting to print with Electron fallback...
[Main] [Printer] ⚠️ SumatraPDF nicht gefunden - verwende Fallback-Methode
[Main] [Printer] ✅ Successfully printed with Electron fallback
```

## 🔍 Root Cause

**Problem 1: Falsche Fehlerbehandlung**

Die ursprüngliche Logik:
```typescript
try {
  await printPdfWithSumatra(pdfPath, targetPrinter);
  return;
} catch (sumatraError) {
  // FEHLER: Verwendet IMMER Electron-Fallback, egal welcher Fehler
  await printPdfWithElectron(pdfPath, targetPrinter);
}
```

**Das war falsch, weil:**
1. SumatraPDF wird gefunden und ausgeführt
2. SumatraPDF schlägt fehl (z.B. Drucker offline, falscher Name, Treiber-Problem)
3. App verwendet Electron-Fallback
4. Electron druckt leere Seiten

**Problem 2: Unspezifische Fehlermeldungen**

```typescript
throw new Error(`Print failed - check printer "${printerName}"`);
```

Diese Fehlermeldung ist identisch für:
- SumatraPDF nicht gefunden
- SumatraPDF gefunden, aber Druck fehlgeschlagen

→ Die Fehlerbehandlung konnte nicht unterscheiden!

## ✅ Lösung

### 1. Spezifische Fehlermeldungen

**Vorher:**
```typescript
throw new Error(`Print failed - check printer "${printerName}"`);
```

**Nachher:**
```typescript
// Prefix für eindeutige Identifikation
throw new Error(`SUMATRA_PRINT_FAILED: Print failed for printer "${printerName}" - Error: ${errorMsg}`);
```

**Fehlertypen:**
- `SumatraPDF nicht gefunden` → Electron-Fallback erlaubt
- `SUMATRA_TIMEOUT:` → Kein Fallback (echter Fehler)
- `SUMATRA_PRINT_FAILED:` → Kein Fallback (echter Fehler)

### 2. Intelligente Fehlerbehandlung

**Neue Logik:**
```typescript
try {
  await printPdfWithSumatra(pdfPath, targetPrinter);
  return;
} catch (sumatraError) {
  const errorMessage = sumatraError instanceof Error ? sumatraError.message : 'Unknown error';
  
  // NUR bei "nicht gefunden" → Electron-Fallback
  if (errorMessage.includes('nicht gefunden')) {
    console.warn('[Printer] ⚠️ SumatraPDF not found - Using Electron fallback');
    await printPdfWithElectron(pdfPath, targetPrinter);
  } else {
    // SumatraPDF existiert aber Druck fehlgeschlagen → KEIN Fallback!
    console.error('[Printer] ❌ SumatraPDF found but printing failed - NOT using Electron fallback');
    throw sumatraError; // Fehler weitergeben
  }
}
```

**Vorteile:**
- ✅ Electron-Fallback nur wenn SumatraPDF wirklich fehlt
- ✅ Echte Druckfehler werden nicht verschleiert
- ✅ User sieht den echten Fehler statt leere Seiten

### 3. Bessere Fehlerdiagnose

**Erweiterte Fehlerausgabe:**
```typescript
catch (error: any) {
  const errorMsg = error?.message || 'Unknown error';
  const stderr = error?.stderr || '';
  const stdout = error?.stdout || '';
  
  console.error('[Printer] Error details:', { 
    errorMsg, 
    stderr, 
    stdout, 
    code: error?.code 
  });
  
  // Detaillierte Fehlermeldung
  throw new Error(`SUMATRA_PRINT_FAILED: Print failed for printer "${printerName}" - Error: ${errorMsg}`);
}
```

## 📊 Verhalten nach dem Fix

### Szenario 1: SumatraPDF nicht gefunden

```
[Printer] Attempting to print with SumatraPDF...
[Printer] ❌ Not found at: C:\...\SumatraPDF.exe
[Printer] ⚠️⚠️⚠️ SumatraPDF NOT FOUND IN ANY LOCATION
[Printer] ⚠️ SumatraPDF not found - Using Electron fallback
[Printer] Attempting to print with Electron fallback...
[Printer] ✅ Successfully printed with Electron fallback
```

**Ergebnis:** Electron-Fallback wird verwendet (kann leere Seiten produzieren)

### Szenario 2: SumatraPDF gefunden, aber Druck fehlgeschlagen

```
[Printer] Attempting to print with SumatraPDF...
[Printer] Using SumatraPDF at: C:\...\SumatraPDF.exe
[Printer] Executing SumatraPDF: X4 (Kopie 1)
[Printer] SumatraPDF execution failed: Command failed...
[Printer] ⚠️ SumatraPDF failed: SUMATRA_PRINT_FAILED: Print failed for printer "X4 (Kopie 1)"
[Printer] ❌ SumatraPDF found but printing failed - NOT using Electron fallback
[Printer] ❌ SumatraPDF printing failed - check printer connection!
[Print Queue] ❌ Failed to print label: SUMATRA_PRINT_FAILED: ...
```

**Ergebnis:** Fehler wird angezeigt, KEIN Electron-Fallback (keine leeren Seiten)

## 🔧 Mögliche Ursachen für SumatraPDF-Fehler

Wenn SumatraPDF gefunden wird, aber der Druck fehlschlägt:

### 1. Falscher Druckername

**Problem:** Windows-Druckername stimmt nicht exakt überein

**Beispiel:**
- Angezeigt: `X4`
- Tatsächlich: `X4 (Kopie 1)`

**Lösung:**
```powershell
# Liste alle Drucker mit exakten Namen
Get-Printer | Select-Object Name
```

### 2. Drucker offline

**Problem:** Drucker ist ausgeschaltet oder nicht erreichbar

**Lösung:**
- Drucker einschalten
- USB-Verbindung prüfen
- Netzwerkverbindung prüfen

### 3. Druckertreiber-Problem

**Problem:** Treiber ist beschädigt oder inkompatibel

**Lösung:**
- Treiber neu installieren
- Drucker entfernen und neu hinzufügen
- Windows-Updates installieren

### 4. Berechtigungsproblem

**Problem:** SumatraPDF hat keine Berechtigung zum Drucken

**Lösung:**
- Als Administrator ausführen
- Drucker-Berechtigungen prüfen

### 5. Drucker-Spooler Problem

**Problem:** Windows Print Spooler hängt

**Lösung:**
```powershell
# Print Spooler neu starten
Stop-Service -Name Spooler
Start-Service -Name Spooler
```

## 📝 Geänderte Dateien

### `app/src/main/printing/printer-manager.ts`

**Änderungen:**
1. ✅ Spezifische Fehlermeldungen mit Prefix (`SUMATRA_PRINT_FAILED:`, `SUMATRA_TIMEOUT:`)
2. ✅ Detaillierte Fehlerausgabe (stderr, stdout, exit code)
3. ✅ Intelligente Fehlerbehandlung (Fallback nur bei "nicht gefunden")
4. ✅ Bessere Logs mit `warnToRenderer()`

**Zeilen:**
- `printPdfWithSumatra()`: Zeile 260-310
- `printPdf()`: Zeile 392-470

### `app/src/main/printing/print-queue.ts`

**Änderungen:**
1. ✅ Bessere Logs mit `logToRenderer()`
2. ✅ Detaillierte Fehlerausgabe

**Zeilen:**
- `processPrintJob()`: Zeile 167-250

## 🎯 Testing

### Test 1: SumatraPDF nicht vorhanden

1. SumatraPDF umbenennen/löschen
2. Druckvorgang starten
3. **Erwartung:** Electron-Fallback wird verwendet

### Test 2: SumatraPDF vorhanden, Drucker offline

1. SumatraPDF vorhanden
2. Drucker ausschalten
3. Druckvorgang starten
4. **Erwartung:** Fehler wird angezeigt, KEIN Fallback

### Test 3: SumatraPDF vorhanden, falscher Druckername

1. SumatraPDF vorhanden
2. Falschen Druckernamen verwenden
3. Druckvorgang starten
4. **Erwartung:** Fehler wird angezeigt, KEIN Fallback

### Test 4: Alles funktioniert

1. SumatraPDF vorhanden
2. Drucker online
3. Korrekter Druckername
4. **Erwartung:** Erfolgreich gedruckt mit SumatraPDF

## 📚 Weitere Schritte

Falls der Druckfehler weiterhin auftritt:

1. **Exakten Druckernamen prüfen:**
   ```powershell
   Get-Printer | Select-Object Name, PrinterStatus, DriverName
   ```

2. **SumatraPDF manuell testen:**
   ```powershell
   & "C:\...\SumatraPDF.exe" -print-to "EXAKTER_DRUCKER_NAME" "test.pdf"
   ```

3. **Drucker-Treiber aktualisieren:**
   - Hersteller-Website besuchen
   - Neuesten Treiber herunterladen
   - Installieren

4. **Alternative: Drucker umbenennen:**
   - In Windows-Einstellungen
   - Einfachen Namen ohne Sonderzeichen verwenden
   - Z.B. `X4` statt `X4 (Kopie 1)`

---

**Erstellt:** 2025-01-03  
**AutoLabel Version:** 1.0.0  
**Status:** ✅ Behoben

