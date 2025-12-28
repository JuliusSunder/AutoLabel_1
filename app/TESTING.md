# Testing Checkliste

Umfassende Testing-Checkliste für AutoLabel vor jedem Release.

---

## 🧪 Development Testing

### 1. App-Start & Grundfunktionen

- [ ] App startet ohne Fehler
- [ ] Keine Console-Errors beim Start
- [ ] Keine Console-Warnings
- [ ] Main Window öffnet sich
- [ ] Window-Größe korrekt
- [ ] App-Icon wird angezeigt
- [ ] App-Titel ist "AutoLabel"

### 2. Navigation

- [ ] Dashboard lädt
- [ ] Email-Scan Screen lädt
- [ ] Label-Preparation Screen lädt
- [ ] Settings Screen lädt
- [ ] Navigation zwischen Screens funktioniert
- [ ] Zurück-Button funktioniert (falls vorhanden)

### 3. Email-Scan

**Setup:**
- [ ] Email-Settings können eingegeben werden
- [ ] IMAP-Server Verbindung funktioniert
- [ ] Email-Provider wird erkannt (Gmail, Outlook, etc.)
- [ ] Credentials werden gespeichert

**Scanning:**
- [ ] Manual Scan startet
- [ ] Emails werden gefunden
- [ ] Attachments werden erkannt
- [ ] PDFs werden heruntergeladen
- [ ] Progress-Bar funktioniert
- [ ] Scan-Ergebnisse werden angezeigt

**Error Handling:**
- [ ] Falsche Credentials → Error-Message
- [ ] Keine Internet-Verbindung → Error-Message
- [ ] Keine Emails gefunden → Info-Message
- [ ] Timeout → Error-Message

### 4. Label-Preparation

**Label-Liste:**
- [ ] Labels werden angezeigt
- [ ] Label-Details sind korrekt
- [ ] Sortierung funktioniert
- [ ] Filterung funktioniert
- [ ] Suche funktioniert

**Label-Bearbeitung:**
- [ ] Label kann ausgewählt werden
- [ ] Label-Preview wird angezeigt
- [ ] Label-Daten können bearbeitet werden
- [ ] Änderungen werden gespeichert
- [ ] Undo/Redo funktioniert (falls vorhanden)

**Label-Verarbeitung:**
- [ ] Label kann für Druck vorbereitet werden
- [ ] PDF wird korrekt verarbeitet
- [ ] Größe wird auf 100×150mm angepasst
- [ ] Qualität ist gut
- [ ] Keine Verzerrungen

### 5. Printing

**Drucker-Auswahl:**
- [ ] Drucker werden erkannt
- [ ] Drucker-Liste wird angezeigt
- [ ] Drucker kann ausgewählt werden
- [ ] Standard-Drucker wird vorausgewählt

**Druck-Einstellungen:**
- [ ] Papier-Größe: 100×150mm (4×6")
- [ ] Orientierung: Portrait/Landscape
- [ ] Qualität: High/Normal
- [ ] Kopien-Anzahl

**Drucken:**
- [ ] Druck-Job wird gestartet
- [ ] Label wird gedruckt
- [ ] Qualität ist gut
- [ ] Größe ist korrekt (100×150mm)
- [ ] Keine Ränder (falls Randlos-Druck)

**Error Handling:**
- [ ] Kein Drucker → Error-Message
- [ ] Drucker offline → Error-Message
- [ ] Papier leer → Error-Message
- [ ] Druck-Fehler → Error-Message

### 6. Settings

**Email-Settings:**
- [ ] IMAP-Server kann konfiguriert werden
- [ ] Email-Credentials können eingegeben werden
- [ ] Test-Verbindung funktioniert
- [ ] Settings werden gespeichert

**Printer-Settings:**
- [ ] Standard-Drucker kann ausgewählt werden
- [ ] Druck-Qualität kann eingestellt werden
- [ ] Papier-Größe kann eingestellt werden
- [ ] Settings werden gespeichert

**App-Settings:**
- [ ] Auto-Scan kann aktiviert/deaktiviert werden
- [ ] Scan-Intervall kann eingestellt werden
- [ ] Notifications können aktiviert/deaktiviert werden
- [ ] Settings werden gespeichert

### 7. Datenbank

**Operationen:**
- [ ] Datenbank wird erstellt beim ersten Start
- [ ] Labels werden gespeichert
- [ ] Labels können gelesen werden
- [ ] Labels können aktualisiert werden
- [ ] Labels können gelöscht werden

**Datenbank-Pfad:**
- [ ] Windows: `%APPDATA%/autolabel/database.db`
- [ ] Datenbank-Datei existiert
- [ ] Datenbank-Größe plausibel

**Performance:**
- [ ] Schnelle Lese-Operationen (<100ms)
- [ ] Schnelle Schreib-Operationen (<100ms)
- [ ] Keine Memory-Leaks

### 8. Performance

**App-Start:**
- [ ] Startzeit <3 Sekunden
- [ ] Keine Verzögerungen beim Laden

**Navigation:**
- [ ] Screen-Wechsel <500ms
- [ ] Keine Ruckler

**Memory:**
- [ ] Memory-Usage <200 MB (idle)
- [ ] Memory-Usage <500 MB (aktiv)
- [ ] Keine Memory-Leaks

**CPU:**
- [ ] CPU-Usage <5% (idle)
- [ ] CPU-Usage <30% (scanning)
- [ ] CPU-Usage <50% (processing)

---

## 📦 Build Testing

### 1. Production Build

**Build-Prozess:**
- [ ] `npm run make` erfolgreich
- [ ] Keine Build-Errors
- [ ] Keine Build-Warnings (kritische)
- [ ] Build-Zeit <10 Minuten

**Build-Output:**
- [ ] `out/make/squirrel.windows/x64/` Verzeichnis existiert
- [ ] `AutoLabel-X.X.X Setup.exe` vorhanden
- [ ] `AutoLabel-X.X.X-full.nupkg` vorhanden
- [ ] `RELEASES` Datei vorhanden

**Datei-Größen:**
- [ ] Installer: 150-250 MB
- [ ] .nupkg: 150-250 MB
- [ ] RELEASES: <10 KB

### 2. Installer-Properties

**Metadata:**
- [ ] Product Name: "AutoLabel"
- [ ] File Description: "AutoLabel - Shipping Label Management"
- [ ] Version: Korrekte Version (z.B. 1.0.0)
- [ ] Company: "AutoLabel"
- [ ] Copyright: "Copyright © 2025 JuliusSunder"

**Code Signing (falls signiert):**
- [ ] Digital Signature vorhanden
- [ ] Certificate gültig
- [ ] Issuer korrekt
- [ ] Keine Warnungen

---

## 🖥️ Installation Testing (Lokales System)

### 1. Installation

**Installer-Start:**
- [ ] Installer startet ohne Fehler
- [ ] Keine Windows SmartScreen-Warnung (falls signiert)
- [ ] Installation-Wizard öffnet sich

**Installation-Prozess:**
- [ ] Installation-Fortschritt wird angezeigt
- [ ] Installation erfolgreich
- [ ] Keine Fehler-Meldungen
- [ ] Installation-Zeit <2 Minuten

**Post-Installation:**
- [ ] App wird automatisch gestartet (optional)
- [ ] Shortcut im Startmenü
- [ ] Shortcut auf Desktop (optional)
- [ ] App in Programme-Liste

### 2. App-Start nach Installation

**Erster Start:**
- [ ] App startet ohne Fehler
- [ ] Keine Console-Errors
- [ ] Welcome-Screen (falls vorhanden)
- [ ] Datenbank wird erstellt

**Funktionalität:**
- [ ] Alle Screens funktionieren
- [ ] Email-Scan funktioniert
- [ ] Label-Preparation funktioniert
- [ ] Printing funktioniert
- [ ] Settings werden gespeichert

### 3. Uninstall

**Uninstall-Prozess:**
- [ ] Uninstall über Systemsteuerung → Programme
- [ ] Uninstall erfolgreich
- [ ] App wird beendet
- [ ] Dateien werden entfernt

**Post-Uninstall:**
- [ ] App-Verzeichnis entfernt
- [ ] Shortcuts entfernt
- [ ] Registry-Einträge entfernt (Windows)
- [ ] Datenbank bleibt erhalten (optional, für Re-Install)

---

## 🧼 Sauberes System Testing

**Wichtig:** Immer auf frischem System testen!

### 1. Test-Environment

**System-Anforderungen:**
- [ ] Windows 10 (64-bit)
- [ ] Windows 11 (64-bit)
- [ ] Keine vorherige Installation von AutoLabel
- [ ] Keine Development-Dependencies
- [ ] Frisches System oder VM

**VM Setup (empfohlen):**
- [ ] Windows 10/11 VM erstellen
- [ ] Snapshot vor Installation
- [ ] Snapshot nach Installation (für Re-Tests)

### 2. Installation auf sauberem System

**Pre-Installation:**
- [ ] Installer auf System kopieren
- [ ] Keine Internet-Verbindung (optional, für Offline-Test)

**Installation:**
- [ ] Installer startet
- [ ] Installation erfolgreich
- [ ] App startet nach Installation
- [ ] Keine fehlenden Dependencies

**Funktionalität:**
- [ ] Alle Features funktionieren
- [ ] Keine Runtime-Errors
- [ ] Keine Console-Errors
- [ ] Performance akzeptabel

### 3. Edge Cases

**Installation-Pfade:**
- [ ] Standard-Pfad: `C:\Program Files\AutoLabel`
- [ ] Custom-Pfad: `D:\Custom\Path\AutoLabel`
- [ ] Pfad mit Leerzeichen: `C:\Program Files\My Apps\AutoLabel`
- [ ] Pfad mit Umlauten: `C:\Programme\AutoLabel`

**User-Rechte:**
- [ ] Installation mit Admin-Rechten
- [ ] Installation ohne Admin-Rechte
- [ ] App-Start mit Admin-Rechten
- [ ] App-Start ohne Admin-Rechte

**System-Konfigurationen:**
- [ ] Windows 10 Home
- [ ] Windows 10 Pro
- [ ] Windows 11 Home
- [ ] Windows 11 Pro
- [ ] Verschiedene Display-Auflösungen
- [ ] Verschiedene DPI-Settings

**Netzwerk:**
- [ ] Mit Internet-Verbindung
- [ ] Ohne Internet-Verbindung (Offline)
- [ ] Hinter Firewall
- [ ] Hinter Proxy

### 4. Update-Testing

**Szenario:**
1. Alte Version installieren (z.B. 1.0.0)
2. App starten
3. Neue Version auf GitHub releasen (z.B. 1.0.1)
4. Update-Check triggern

**Checkliste:**
- [ ] Update wird erkannt
- [ ] Update-Notification wird angezeigt
- [ ] Download startet automatisch
- [ ] Download-Progress wird angezeigt
- [ ] Download erfolgreich
- [ ] Update wird beim nächsten Start installiert
- [ ] App startet mit neuer Version
- [ ] Daten bleiben erhalten
- [ ] Settings bleiben erhalten
- [ ] Keine Breaking Changes

---

## 🔄 Auto-Updater Testing

### 1. Update-Check

**Manueller Test:**
```typescript
// In Developer Console (F12)
require('electron').ipcRenderer.invoke('check-for-updates');
```

**Checkliste:**
- [ ] Update-Check wird ausgeführt
- [ ] GitHub Releases werden geprüft
- [ ] Neue Version wird erkannt
- [ ] Keine Version → "No updates available"

### 2. Update-Download

**Checkliste:**
- [ ] Download startet automatisch
- [ ] Download-Progress wird geloggt
- [ ] Download-Speed akzeptabel
- [ ] Download erfolgreich
- [ ] .nupkg-Datei wird heruntergeladen

### 3. Update-Installation

**Checkliste:**
- [ ] Update wird beim nächsten App-Start installiert
- [ ] Installation erfolgreich
- [ ] Neue Version wird gestartet
- [ ] Daten bleiben erhalten
- [ ] Settings bleiben erhalten

### 4. Update-Fehler

**Error-Handling:**
- [ ] Keine Internet-Verbindung → Error-Message
- [ ] GitHub nicht erreichbar → Error-Message
- [ ] Download-Fehler → Error-Message
- [ ] Installation-Fehler → Rollback zur alten Version

---

## 🐛 Error-Handling Testing

### 1. Netzwerk-Fehler

**Szenarien:**
- [ ] Keine Internet-Verbindung beim Email-Scan
- [ ] Timeout bei IMAP-Verbindung
- [ ] DNS-Fehler
- [ ] Firewall blockiert Verbindung

**Erwartetes Verhalten:**
- [ ] Klare Error-Message
- [ ] Retry-Option
- [ ] Keine App-Crashes

### 2. Datenbank-Fehler

**Szenarien:**
- [ ] Datenbank-Datei fehlt
- [ ] Datenbank-Datei korrupt
- [ ] Keine Schreib-Rechte
- [ ] Disk voll

**Erwartetes Verhalten:**
- [ ] Datenbank wird neu erstellt (falls möglich)
- [ ] Klare Error-Message
- [ ] Keine Daten-Verluste

### 3. Drucker-Fehler

**Szenarien:**
- [ ] Kein Drucker installiert
- [ ] Drucker offline
- [ ] Papier leer
- [ ] Toner leer
- [ ] Druck-Job fehlgeschlagen

**Erwartetes Verhalten:**
- [ ] Klare Error-Message
- [ ] Retry-Option
- [ ] Keine App-Crashes

### 4. PDF-Verarbeitungs-Fehler

**Szenarien:**
- [ ] PDF korrupt
- [ ] PDF zu groß
- [ ] PDF verschlüsselt
- [ ] Kein PDF (falsches Format)

**Erwartetes Verhalten:**
- [ ] Klare Error-Message
- [ ] PDF wird übersprungen
- [ ] Keine App-Crashes

---

## 📊 Performance Testing

### 1. Load Testing

**Szenarien:**
- [ ] 10 Labels verarbeiten
- [ ] 100 Labels verarbeiten
- [ ] 1000 Labels verarbeiten

**Metriken:**
- [ ] Verarbeitungszeit pro Label
- [ ] Memory-Usage
- [ ] CPU-Usage
- [ ] Keine Crashes

### 2. Stress Testing

**Szenarien:**
- [ ] Viele Email-Scans hintereinander
- [ ] Viele Druck-Jobs hintereinander
- [ ] App über Stunden laufen lassen

**Metriken:**
- [ ] Keine Memory-Leaks
- [ ] Keine Performance-Degradation
- [ ] Keine Crashes

### 3. Concurrency Testing

**Szenarien:**
- [ ] Email-Scan während Label-Verarbeitung
- [ ] Drucken während Email-Scan
- [ ] Mehrere Operationen gleichzeitig

**Erwartetes Verhalten:**
- [ ] Keine Race-Conditions
- [ ] Keine Deadlocks
- [ ] Keine Daten-Korruption

---

## 🔐 Security Testing

### 1. Credentials

**Checkliste:**
- [ ] Email-Credentials werden verschlüsselt gespeichert
- [ ] Credentials nicht in Logs
- [ ] Credentials nicht in Console-Output
- [ ] Credentials nicht in Error-Messages

### 2. File Access

**Checkliste:**
- [ ] App hat nur Zugriff auf eigene Verzeichnisse
- [ ] Keine unautorisierten File-Zugriffe
- [ ] Downloads nur in sicheren Verzeichnissen

### 3. Network Security

**Checkliste:**
- [ ] IMAP-Verbindung über TLS/SSL
- [ ] Keine unverschlüsselten Verbindungen
- [ ] Certificate-Validation funktioniert

---

## ✅ Pre-Release Final Checklist

### Kritische Tests (MUSS)

- [ ] Production Build erfolgreich
- [ ] Installer funktioniert lokal
- [ ] Installer funktioniert auf sauberem System
- [ ] App startet korrekt
- [ ] Alle Core-Features funktionieren:
  - [ ] Email-Scan
  - [ ] Label-Preparation
  - [ ] Printing
  - [ ] Settings
- [ ] Keine kritischen Console-Errors
- [ ] Keine Memory-Leaks
- [ ] Performance akzeptabel

### Wichtige Tests (SOLLTE)

- [ ] Update-Mechanismus funktioniert
- [ ] Error-Handling funktioniert
- [ ] Edge Cases getestet
- [ ] Verschiedene Windows-Versionen getestet
- [ ] Verschiedene Drucker getestet

### Optionale Tests (KANN)

- [ ] Load Testing
- [ ] Stress Testing
- [ ] Security Testing
- [ ] Accessibility Testing

---

## 📝 Test-Dokumentation

### Test-Report Template

```markdown
## Test Report - AutoLabel v1.0.1

**Datum:** 2025-01-15
**Tester:** Name
**System:** Windows 11 Pro 64-bit

### Zusammenfassung
- ✅ Alle kritischen Tests bestanden
- ⚠️ 2 kleinere Issues gefunden
- ❌ 0 kritische Issues

### Test-Ergebnisse

#### Development Testing
- [x] App-Start: ✅ Erfolgreich
- [x] Navigation: ✅ Erfolgreich
- [x] Email-Scan: ✅ Erfolgreich
- [x] Label-Preparation: ✅ Erfolgreich
- [x] Printing: ⚠️ Warnung: Drucker XYZ nicht erkannt
- [x] Settings: ✅ Erfolgreich

#### Build Testing
- [x] Production Build: ✅ Erfolgreich
- [x] Installer: ✅ Erfolgreich

#### Installation Testing
- [x] Lokales System: ✅ Erfolgreich
- [x] Sauberes System: ✅ Erfolgreich
- [x] Update: ✅ Erfolgreich

### Issues

#### Issue 1: Drucker XYZ nicht erkannt
- **Severity:** Low
- **Description:** Drucker "XYZ Model 123" wird nicht in Liste angezeigt
- **Workaround:** Anderen Drucker verwenden
- **Fix:** Geplant für v1.0.2

#### Issue 2: Langsamer Email-Scan bei vielen Emails
- **Severity:** Medium
- **Description:** Scan dauert >5 Minuten bei 1000+ Emails
- **Workaround:** Emails in kleineren Batches scannen
- **Fix:** Performance-Optimierung geplant

### Empfehlung
✅ **Release freigeben** - Alle kritischen Tests bestanden, kleinere Issues sind akzeptabel.
```

---

**Letzte Aktualisierung:** 2025-01-15
**Version:** 1.0.0

