# Testing Guide - Error Handling & Logging

Dieser Guide hilft beim Testen des neu implementierten Error Handling & Logging Systems.

## Voraussetzungen

1. AutoLabel App ist installiert oder im Development-Modus
2. Zugriff auf das Log-Verzeichnis

## Log-Verzeichnis finden

### Windows
```powershell
# Öffnen Sie PowerShell und führen Sie aus:
explorer $env:APPDATA\AutoLabel\logs

# Oder im Run-Dialog (Win + R):
%APPDATA%\AutoLabel\logs
```

### macOS
```bash
open ~/Library/Application\ Support/AutoLabel/logs/
```

### Linux
```bash
nautilus ~/.config/AutoLabel/logs/
```

## Test-Szenarien

### 1. App Start Logging

**Ziel:** Verifizieren, dass App-Start Events geloggt werden

**Schritte:**
1. Starten Sie die AutoLabel App
2. Öffnen Sie `combined.log`
3. Suchen Sie nach: `"message":"Application starting"`

**Erwartetes Ergebnis:**
```json
{
  "timestamp": "2025-12-28 14:30:00",
  "level": "info",
  "message": "Application starting",
  "version": "1.0.0",
  "isPackaged": false,
  "platform": "win32"
}
```

### 2. Email Scan Logging

**Ziel:** Verifizieren, dass Email-Scans geloggt werden

**Schritte:**
1. Fügen Sie einen Email-Account hinzu (falls noch nicht vorhanden)
2. Klicken Sie auf "Scan Emails" oder "Refresh Vinted"
3. Warten Sie auf Scan-Completion
4. Öffnen Sie `combined.log`

**Erwartetes Ergebnis:**
```json
{
  "timestamp": "2025-12-28 14:31:00",
  "level": "info",
  "message": "Email scan started",
  "accountId": "all"
}
{
  "timestamp": "2025-12-28 14:31:15",
  "level": "info",
  "message": "Email scan completed",
  "accountId": "all",
  "scannedCount": 10,
  "newSales": 2,
  "hasErrors": false
}
```

### 3. Email Authentication Error

**Ziel:** Verifizieren, dass Auth-Fehler korrekt geloggt und angezeigt werden

**Schritte:**
1. Gehen Sie zu Settings → Email Accounts
2. Erstellen Sie einen neuen Account mit falschen Credentials
3. Testen Sie die Verbindung
4. Überprüfen Sie die Fehlermeldung im UI
5. Öffnen Sie `error.log`

**Erwartete Fehlermeldung im UI:**
```
E-Mail-Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort.
```

**Erwartetes Log:**
```json
{
  "timestamp": "2025-12-28 14:32:00",
  "level": "error",
  "message": "Email account connection test failed",
  "username": "test@example.com",
  "host": "imap.example.com",
  "error": {
    "name": "Error",
    "message": "Authentication failed",
    "stack": "..."
  }
}
```

### 4. Email Connection Error

**Ziel:** Verifizieren, dass Verbindungsfehler korrekt behandelt werden

**Schritte:**
1. Trennen Sie die Internetverbindung
2. Versuchen Sie, Emails zu scannen
3. Überprüfen Sie die Fehlermeldung
4. Öffnen Sie `error.log`

**Erwartete Fehlermeldung:**
```
Verbindung zum E-Mail-Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung und die Server-Einstellungen.
```

### 5. Label Preparation Logging

**Ziel:** Verifizieren, dass Label-Vorbereitung geloggt wird

**Schritte:**
1. Wählen Sie einige Sales aus
2. Klicken Sie auf "Prepare Labels"
3. Warten Sie auf Completion
4. Öffnen Sie `combined.log`

**Erwartetes Ergebnis:**
```json
{
  "timestamp": "2025-12-28 14:33:00",
  "level": "info",
  "message": "Label preparation started",
  "saleCount": 3,
  "hasFooter": true
}
{
  "timestamp": "2025-12-28 14:33:05",
  "level": "info",
  "message": "Label preparation completed",
  "preparedCount": 3,
  "saleCount": 3
}
```

### 6. Print Job Logging

**Ziel:** Verifizieren, dass Druck-Jobs geloggt werden

**Schritte:**
1. Bereiten Sie Labels vor
2. Fügen Sie sie zur Print Queue hinzu
3. Starten Sie den Print Job
4. Öffnen Sie `combined.log`

**Erwartetes Ergebnis:**
```json
{
  "timestamp": "2025-12-28 14:34:00",
  "level": "info",
  "message": "Adding to print queue",
  "labelCount": 3,
  "printer": "default"
}
{
  "timestamp": "2025-12-28 14:34:01",
  "level": "info",
  "message": "Added to print queue",
  "jobId": "print-job-123",
  "labelCount": 3
}
```

### 7. Printer Not Found Error

**Ziel:** Verifizieren, dass Drucker-Fehler korrekt behandelt werden

**Schritte:**
1. Trennen Sie alle Drucker
2. Versuchen Sie zu drucken
3. Überprüfen Sie die Fehlermeldung
4. Öffnen Sie `error.log`

**Erwartete Fehlermeldung:**
```
Der ausgewählte Drucker wurde nicht gefunden. Bitte überprüfen Sie, ob der Drucker eingeschaltet und mit dem Computer verbunden ist.
```

### 8. Renderer Error (ErrorBoundary)

**Ziel:** Verifizieren, dass Renderer-Fehler geloggt werden

**Schritte:**
1. Öffnen Sie die Developer Console (F12)
2. Führen Sie aus: `throw new Error('Test error')`
3. Überprüfen Sie die ErrorBoundary UI
4. Öffnen Sie `error.log`

**Erwartete UI:**
- Roter Alert-Icon
- Titel: "Ein Fehler ist aufgetreten"
- Text: "Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Anwendung neu."
- Button: "App neu laden"

**Erwartetes Log:**
```json
{
  "timestamp": "2025-12-28 14:35:00",
  "level": "error",
  "message": "Renderer error caught by ErrorBoundary",
  "source": "renderer",
  "error": {
    "name": "Error",
    "message": "Test error",
    "stack": "..."
  },
  "componentStack": "..."
}
```

### 9. Database Error

**Ziel:** Verifizieren, dass Datenbankfehler geloggt werden

**Schritte:**
1. Schließen Sie die App
2. Löschen oder beschädigen Sie die Datenbank-Datei
3. Starten Sie die App neu
4. Öffnen Sie `error.log`

**Erwartetes Log:**
```json
{
  "timestamp": "2025-12-28 14:36:00",
  "level": "error",
  "message": "Failed to initialize database",
  "error": {
    "name": "Error",
    "message": "...",
    "stack": "..."
  }
}
```

### 10. Log Rotation

**Ziel:** Verifizieren, dass Log-Rotation funktioniert

**Schritte:**
1. Öffnen Sie `combined.log`
2. Notieren Sie die Dateigröße
3. Führen Sie viele Operationen aus (Scans, Label Prep, etc.)
4. Warten Sie, bis die Datei > 5MB ist
5. Überprüfen Sie, ob eine neue Datei erstellt wurde

**Erwartetes Ergebnis:**
- `combined.log` (neueste)
- `combined.1.log` (älter)
- `combined.2.log` (noch älter)
- etc.

### 11. Sensitive Data Sanitization

**Ziel:** Verifizieren, dass Passwörter nicht geloggt werden

**Schritte:**
1. Erstellen Sie einen Email-Account mit Passwort
2. Öffnen Sie `combined.log`
3. Suchen Sie nach dem Account-Creation Event
4. Überprüfen Sie, dass das Passwort nicht sichtbar ist

**Erwartetes Ergebnis:**
```json
{
  "timestamp": "2025-12-28 14:37:00",
  "level": "info",
  "message": "Creating email account",
  "username": "test@example.com",
  "host": "imap.example.com",
  "password": "***REDACTED***"
}
```

### 12. Log Files via IPC

**Ziel:** Verifizieren, dass Log-Dateien über IPC abgerufen werden können

**Schritte:**
1. Öffnen Sie die Developer Console (F12)
2. Führen Sie aus:
```javascript
const dir = await window.autolabel.log.getDirectory();
console.log('Log directory:', dir);

const files = await window.autolabel.log.getFiles();
console.log('Log files:', files);
```

**Erwartetes Ergebnis:**
```javascript
// Log directory:
{
  success: true,
  directory: "C:\\Users\\Username\\AppData\\Roaming\\AutoLabel\\logs"
}

// Log files:
{
  success: true,
  files: ["combined.log", "error.log", "combined.1.log"]
}
```

## Automatisierte Tests

### Test Script

Erstellen Sie eine Datei `test-logging.js` im `app` Verzeichnis:

```javascript
// Test Logging from Renderer
async function testLogging() {
  console.log('Testing logging system...');

  // Test error logging
  await window.autolabel.log.error('Test error', new Error('Test'), { test: true });
  console.log('✓ Error logged');

  // Test warning logging
  await window.autolabel.log.warn('Test warning', { test: true });
  console.log('✓ Warning logged');

  // Test info logging
  await window.autolabel.log.info('Test info', { test: true });
  console.log('✓ Info logged');

  // Test debug logging
  await window.autolabel.log.debug('Test debug', { test: true });
  console.log('✓ Debug logged');

  // Get log directory
  const dir = await window.autolabel.log.getDirectory();
  console.log('✓ Log directory:', dir.directory);

  // Get log files
  const files = await window.autolabel.log.getFiles();
  console.log('✓ Log files:', files.files);

  console.log('All tests passed!');
}

// Run tests
testLogging().catch(console.error);
```

Führen Sie in der Developer Console aus:
```javascript
// Kopieren Sie den Test Script Code und führen Sie ihn aus
```

## Performance Tests

### Log Volume Test

**Ziel:** Verifizieren, dass hohe Log-Volumina die Performance nicht beeinträchtigen

**Schritte:**
1. Öffnen Sie die Developer Console
2. Führen Sie aus:
```javascript
async function stressTest() {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    await window.autolabel.log.info(`Test log ${i}`, { iteration: i });
  }
  const duration = Date.now() - start;
  console.log(`Logged 1000 entries in ${duration}ms`);
}
stressTest();
```

**Erwartetes Ergebnis:**
- Logs werden erfolgreich geschrieben
- Performance bleibt akzeptabel (< 5 Sekunden für 1000 Logs)
- App bleibt responsiv

## Troubleshooting

### Problem: Keine Logs werden erstellt

**Diagnose:**
1. Überprüfen Sie, ob das Log-Verzeichnis existiert
2. Überprüfen Sie die Schreibrechte
3. Überprüfen Sie die Console für Fehler

**Lösung:**
```powershell
# Windows - Erstellen Sie das Verzeichnis manuell
mkdir $env:APPDATA\AutoLabel\logs
```

### Problem: Logs sind leer

**Diagnose:**
1. Überprüfen Sie, ob die App im Development-Modus läuft
2. Überprüfen Sie die Console für Winston-Fehler

**Lösung:**
- Starten Sie die App neu
- Überprüfen Sie die Winston-Konfiguration in `logger.ts`

### Problem: Zu viele Debug-Logs

**Diagnose:**
- App läuft im Development-Modus

**Lösung:**
- Bauen Sie die App für Production: `npm run make`
- Debug-Logs werden nur in Development erstellt

## Checkliste

- [ ] App Start wird geloggt
- [ ] Email Scan wird geloggt
- [ ] Email Auth Fehler werden korrekt behandelt
- [ ] Email Connection Fehler werden korrekt behandelt
- [ ] Label Preparation wird geloggt
- [ ] Print Jobs werden geloggt
- [ ] Drucker-Fehler werden korrekt behandelt
- [ ] Renderer Errors werden geloggt
- [ ] Database Errors werden geloggt
- [ ] Log Rotation funktioniert
- [ ] Passwörter werden nicht geloggt
- [ ] Log-Dateien können über IPC abgerufen werden
- [ ] Performance ist akzeptabel
- [ ] User-freundliche Fehlermeldungen werden angezeigt
- [ ] ErrorBoundary zeigt deutsche Meldungen

## Ergebnis dokumentieren

Nach dem Testing:

1. Erstellen Sie eine Datei `TESTING_RESULTS.md`
2. Dokumentieren Sie alle getesteten Szenarien
3. Notieren Sie gefundene Probleme
4. Fügen Sie Screenshots bei (optional)

## Support

Bei Problemen:
- Email: cookius2211@gmail.com
- Dokumentation: `ERROR_HANDLING.md`

