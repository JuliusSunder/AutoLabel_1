# Error Handling & Logging - AutoLabel

Dieses Dokument beschreibt das Error Handling und Logging System der AutoLabel Electron App.

## Übersicht

AutoLabel verwendet ein umfassendes Error Handling und Logging System, das auf Winston basiert. Alle Fehler werden strukturiert geloggt und können für Support-Zwecke analysiert werden.

## Log Files

### Speicherort

Die Log-Dateien werden im User Data Verzeichnis der Anwendung gespeichert:

**Windows:**
```
%APPDATA%\AutoLabel\logs\
```

Vollständiger Pfad (Beispiel):
```
C:\Users\IhrBenutzername\AppData\Roaming\AutoLabel\logs\
```

**macOS:**
```
~/Library/Application Support/AutoLabel/logs/
```

**Linux:**
```
~/.config/AutoLabel/logs/
```

### Log-Dateien

Es gibt zwei Haupt-Log-Dateien:

1. **error.log** - Enthält nur Fehler (Error Level)
2. **combined.log** - Enthält alle Log-Einträge (Error, Warning, Info, Debug)

### Log Rotation

- **Maximale Dateigröße:** 5 MB pro Log-Datei
- **Maximale Anzahl:** 5 Dateien werden behalten
- **Automatische Rotation:** Wenn eine Datei 5 MB erreicht, wird eine neue erstellt
- **Alte Logs:** Werden automatisch beim App-Start bereinigt (nur die 10 neuesten Dateien werden behalten)

## Log Format

Die Logs werden im JSON-Format gespeichert für einfache maschinelle Verarbeitung:

```json
{
  "timestamp": "2025-12-28 14:30:45",
  "level": "error",
  "message": "Email scan failed",
  "accountId": "account-123",
  "error": {
    "name": "Error",
    "message": "ECONNREFUSED",
    "stack": "Error: ECONNREFUSED\n    at ..."
  }
}
```

### Log Levels

1. **error** - Fehler, die die Funktionalität beeinträchtigen
2. **warn** - Warnungen, die Aufmerksamkeit erfordern könnten
3. **info** - Wichtige Informationen über den App-Zustand
4. **debug** - Detaillierte Debug-Informationen (nur in Development)

## Geloggte Events

### Email-Scanning

- Email Scan Start/Ende
- Anzahl gescannter Emails
- Neue Sales gefunden
- Verbindungsfehler
- Authentifizierungsfehler

**Beispiel:**
```json
{
  "timestamp": "2025-12-28 14:30:45",
  "level": "info",
  "message": "Email scan started",
  "accountId": "all"
}
```

### Label-Vorbereitung

- Label Preparation Start/Ende
- Anzahl vorbereiteter Labels
- PDF-Generierungsfehler
- Datei-Zugriffsfehler

**Beispiel:**
```json
{
  "timestamp": "2025-12-28 14:31:12",
  "level": "info",
  "message": "Label preparation completed",
  "preparedCount": 5,
  "saleCount": 5
}
```

### Druck-Jobs

- Print Job Start/Ende
- Drucker-Status
- Druck-Fehler
- Queue-Operationen

**Beispiel:**
```json
{
  "timestamp": "2025-12-28 14:32:00",
  "level": "info",
  "message": "Print job started",
  "jobId": "print-job-123",
  "labelCount": 5
}
```

### Datenbank-Operationen

- Datenbankfehler
- Verbindungsprobleme
- Constraint-Verletzungen

### Anwendungs-Lifecycle

- App Start/Ende
- Uncaught Exceptions
- Unhandled Promise Rejections
- Renderer Process Crashes

## Datenschutz & Sicherheit

### Sensitive Daten

Das Logging-System entfernt automatisch sensitive Daten aus den Logs:

- **Passwörter** → `***REDACTED***`
- **Tokens** → `***REDACTED***`
- **API Keys** → `***REDACTED***`
- **Secrets** → `***REDACTED***`

**Beispiel:**
```javascript
// Original
{ username: "user@example.com", password: "secret123" }

// Im Log
{ username: "user@example.com", password: "***REDACTED***" }
```

## User-Freundliche Fehlermeldungen

Das System übersetzt technische Fehler automatisch in verständliche deutsche Meldungen:

### Email-Fehler

| Technischer Fehler | User-Freundliche Meldung |
|-------------------|--------------------------|
| ECONNREFUSED | Verbindung zum E-Mail-Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung und die Server-Einstellungen. |
| Authentication failed | E-Mail-Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort. |
| ETIMEDOUT | Die Verbindung zum E-Mail-Server hat zu lange gedauert. Bitte versuchen Sie es später erneut. |

### Datei-Fehler

| Technischer Fehler | User-Freundliche Meldung |
|-------------------|--------------------------|
| ENOENT | Die angeforderte Datei wurde nicht gefunden. |
| EACCES | Zugriff verweigert. Bitte überprüfen Sie die Berechtigungen. |
| ENOSPC | Die Datei konnte nicht gespeichert werden. Bitte überprüfen Sie den verfügbaren Speicherplatz. |

### Drucker-Fehler

| Technischer Fehler | User-Freundliche Meldung |
|-------------------|--------------------------|
| Printer not found | Der ausgewählte Drucker wurde nicht gefunden. Bitte überprüfen Sie, ob der Drucker eingeschaltet und verbunden ist. |
| Print failed | Beim Drucken ist ein Fehler aufgetreten. Bitte überprüfen Sie den Drucker und versuchen Sie es erneut. |

## Logs für Support anfordern

### Für Benutzer

1. **Logs finden:**
   - Windows: Drücken Sie `Win + R`
   - Geben Sie ein: `%APPDATA%\AutoLabel\logs`
   - Drücken Sie Enter

2. **Relevante Logs identifizieren:**
   - `error.log` - Enthält alle Fehler
   - `combined.log` - Enthält alle Aktivitäten
   - Suchen Sie nach den neuesten Dateien (nach Änderungsdatum sortieren)

3. **Logs senden:**
   - Kopieren Sie die Dateien `error.log` und `combined.log`
   - Senden Sie diese an den Support
   - **Hinweis:** Passwörter werden automatisch entfernt, aber überprüfen Sie die Logs auf andere persönliche Daten

### Für Entwickler

Logs können programmatisch abgerufen werden:

```typescript
// Get log directory
const result = await window.autolabel.log.getDirectory();
console.log('Log directory:', result.directory);

// Get list of log files
const files = await window.autolabel.log.getFiles();
console.log('Log files:', files.files);
```

## Troubleshooting Guide

### Problem: Keine Logs werden erstellt

**Lösung:**
1. Überprüfen Sie, ob das Log-Verzeichnis existiert
2. Überprüfen Sie die Schreibrechte für das Verzeichnis
3. Starten Sie die Anwendung neu

### Problem: Log-Dateien werden zu groß

**Lösung:**
- Die Rotation erfolgt automatisch bei 5 MB
- Alte Logs werden automatisch beim App-Start bereinigt
- Manuelles Löschen ist sicher (App erstellt neue Logs)

### Problem: Fehler wird nicht geloggt

**Lösung:**
1. Überprüfen Sie den Log Level (Debug-Logs nur in Development)
2. Überprüfen Sie, ob der Fehler in einem Try-Catch Block gefangen wird
3. Überprüfen Sie die `combined.log` Datei (enthält alle Levels)

### Problem: Logs enthalten zu viele Debug-Informationen

**Lösung:**
- Debug-Logs werden nur in der Development-Version erstellt
- In der Production-Version werden nur Info, Warning und Error geloggt
- Bauen Sie die App mit `npm run make` für Production

## Entwickler-Informationen

### Logging im Code verwenden

#### Main Process

```typescript
import { logError, logInfo, logWarning, logDebug } from './utils/logger';

// Error logging
try {
  await someOperation();
} catch (error) {
  logError('Operation failed', error, { 
    userId: 'user-123',
    operation: 'someOperation'
  });
}

// Info logging
logInfo('Operation completed', { 
  duration: 1234,
  itemsProcessed: 10
});

// Warning logging
logWarning('Deprecated API used', { 
  api: 'oldMethod',
  replacement: 'newMethod'
});

// Debug logging (nur in Development)
logDebug('Processing item', { 
  itemId: 'item-123',
  step: 'validation'
});
```

#### Renderer Process

```typescript
// Error logging from renderer
try {
  await someOperation();
} catch (error) {
  await window.autolabel.log.error(
    'Operation failed in renderer',
    error,
    { component: 'MyComponent' }
  );
}

// Info logging
await window.autolabel.log.info('User action', { 
  action: 'button-click',
  buttonId: 'submit'
});
```

### User-Freundliche Fehler erstellen

```typescript
import { getUserFriendlyError } from './utils/error-messages';

try {
  await connectToEmail();
} catch (error) {
  const userMessage = getUserFriendlyError(error);
  // Zeige userMessage dem Benutzer
  throw new Error(userMessage);
}
```

### Sensitive Daten sanitizen

```typescript
import { sanitizeForLog } from './utils/logger';

const userData = {
  username: 'user@example.com',
  password: 'secret123',
  apiKey: 'key-123'
};

logInfo('User data', sanitizeForLog(userData));
// Logged: { username: 'user@example.com', password: '***REDACTED***', apiKey: '***REDACTED***' }
```

## Crash Reports

### Electron Crash Reporter

AutoLabel verwendet den integrierten Electron Crash Reporter:

- **Aktiviert:** Ja
- **Upload:** Nein (nur lokale Speicherung)
- **Speicherort:** Gleich wie Log-Dateien

### Renderer Process Crashes

Renderer Process Crashes werden automatisch geloggt:

```json
{
  "timestamp": "2025-12-28 14:35:00",
  "level": "error",
  "message": "Renderer process crashed",
  "reason": "crashed",
  "exitCode": 1
}
```

## Best Practices

### Für Benutzer

1. **Regelmäßige Überprüfung:** Schauen Sie gelegentlich in die `error.log`, um Probleme frühzeitig zu erkennen
2. **Logs aufbewahren:** Bei Problemen sind die Logs wertvoll für den Support
3. **Datenschutz:** Logs enthalten keine Passwörter, aber möglicherweise E-Mail-Adressen

### Für Entwickler

1. **Immer Context mitgeben:** Fügen Sie relevante Informationen zum Log hinzu
2. **Richtige Log Levels:** Error für Fehler, Info für wichtige Events, Debug für Details
3. **User-Freundliche Meldungen:** Verwenden Sie `getUserFriendlyError()` vor dem Throw
4. **Sensitive Daten:** Verwenden Sie `sanitizeForLog()` für User-Daten
5. **Strukturiertes Logging:** Verwenden Sie Objekte statt Strings für bessere Analyse

## Support Kontakt

Bei Problemen mit dem Logging-System oder der Anwendung:

1. Sammeln Sie die Log-Dateien (`error.log` und `combined.log`)
2. Beschreiben Sie das Problem und wann es auftrat
3. Senden Sie die Logs und Beschreibung an: cookius2211@gmail.com

## Änderungshistorie

- **v1.0.0** (2025-12-28): Initiales Error Handling & Logging System implementiert
  - Winston Logger mit Rotation
  - User-freundliche Fehlermeldungen
  - IPC Logging Integration
  - ErrorBoundary mit Logging
  - Crash Reporter

