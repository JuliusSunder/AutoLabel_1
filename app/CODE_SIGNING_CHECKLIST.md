# ✅ Code Signing Checklist

## Pre-Build Checklist

### Certificate Setup
- [ ] Self-Signed Certificate erstellt (`CREATE_CERTIFICATE.ps1`)
- [ ] Certificate als .pfx exportiert (`app/certs/autolabel.pfx`)
- [ ] `.env` Datei erstellt mit Passwort
- [ ] Certificate Gültigkeit geprüft (1 Jahr)

### Configuration
- [ ] `dotenv` installiert (`npm install --save-dev dotenv`)
- [ ] `cross-env` installiert (`npm install --save-dev cross-env`)
- [ ] `forge.config.ts` konfiguriert (Code Signing Section)
- [ ] `package.json` Scripts angepasst (`make:signed`, `package:signed`)

### Security
- [ ] `.gitignore` enthält Certificate-Patterns
- [ ] `.env` ist in `.gitignore`
- [ ] Certificate Passwort ist sicher
- [ ] Keine Secrets in Git committed

---

## Build Checklist

### Development Build (unsigned)
```bash
cd app
npm run make
```

- [ ] Build läuft ohne Fehler
- [ ] Installer wird erstellt
- [ ] App startet lokal

### Production Build (signed)
```bash
cd app
npm run make:signed
```

- [ ] Build läuft ohne Fehler
- [ ] Installer wird erstellt
- [ ] Signing-Prozess erfolgreich
- [ ] Keine Signing-Fehler in Logs

---

## Validation Checklist

### Certificate Validation

**PowerShell:**
```powershell
Get-AuthenticodeSignature ".\app\out\make\squirrel.windows\x64\AutoLabel-1.0.0 Setup.exe"
```

- [ ] Status: **Valid**
- [ ] SignerCertificate: **CN=AutoLabel**
- [ ] StatusMessage: **Signature verified**

### Installer Properties

1. Rechtsklick auf `AutoLabel-1.0.0 Setup.exe`
2. **Properties** → **Digital Signatures** Tab

- [ ] Certificate ist sichtbar
- [ ] Signer: **AutoLabel**
- [ ] Status: **Valid**

### File Properties

1. Rechtsklick auf `AutoLabel-1.0.0 Setup.exe`
2. **Properties** → **Details** Tab

- [ ] Product Name: **AutoLabel**
- [ ] Company Name: **AutoLabel**
- [ ] File Description: **AutoLabel - Shipping Label Management**
- [ ] Copyright: **Copyright © 2025 JuliusSunder**

---

## Installation Testing

### Test Environment
- [ ] Sauberes Windows System (VM oder Test-PC)
- [ ] Keine vorherige AutoLabel-Installation
- [ ] Internet-Verbindung aktiv (für SmartScreen)

### Installation Process

1. **Installer ausführen**
   - [ ] Installer startet
   - [ ] SmartScreen Warnung erscheint: **"Windows protected your PC"**
   - [ ] "More info" Link ist sichtbar

2. **SmartScreen akzeptieren**
   - [ ] Klick auf "More info"
   - [ ] "Run anyway" Button erscheint
   - [ ] Klick auf "Run anyway"
   - [ ] Installation startet

3. **Installation**
   - [ ] Installer-UI zeigt AutoLabel-Logo
   - [ ] Installation läuft ohne Fehler
   - [ ] Fortschrittsbalken funktioniert
   - [ ] Installation abgeschlossen

4. **Post-Installation**
   - [ ] Startmenü-Eintrag: **"AutoLabel"**
   - [ ] Desktop-Icon: **AutoLabel-Logo** (falls aktiviert)
   - [ ] Installationsordner: `C:\Users\{user}\AppData\Local\AutoLabel`

### App Launch

- [ ] App startet ohne Fehler
- [ ] Window-Titel: **"AutoLabel"**
- [ ] Taskbar-Icon: **AutoLabel-Logo**
- [ ] App funktioniert normal

### Deinstallation

- [ ] Systemsteuerung → Programme
- [ ] "AutoLabel" ist aufgelistet
- [ ] Deinstallation funktioniert
- [ ] Alle Dateien entfernt (außer User-Daten)

---

## User Experience Checklist

### SmartScreen Warnung

**Erwartete Warnung:**
```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.

[More info]  [Don't run]
```

- [ ] Warnung ist klar und verständlich
- [ ] "More info" Link funktioniert
- [ ] "Run anyway" Button erscheint nach "More info"

### User-Dokumentation

- [ ] README.md erklärt SmartScreen Warnung
- [ ] Installationsanleitung vorhanden
- [ ] Screenshots der Warnung (optional)
- [ ] Hinweis auf Self-Signed Certificate

---

## Production Checklist

### Pre-Release

- [ ] Alle Tests bestanden
- [ ] Certificate ist gültig (nicht abgelaufen)
- [ ] Build ist reproduzierbar
- [ ] Installer funktioniert auf mehreren Systemen

### Release

- [ ] Installer hochgeladen (GitHub Releases, Website, etc.)
- [ ] Release Notes erstellt
- [ ] User-Dokumentation aktualisiert
- [ ] Support-Kanäle informiert

### Post-Release

- [ ] User-Feedback sammeln
- [ ] SmartScreen-Probleme dokumentieren
- [ ] Upgrade auf Production Certificate planen (falls nötig)

---

## Troubleshooting Checklist

### Build Fails

- [ ] `dotenv` installiert?
- [ ] `.env` Datei vorhanden?
- [ ] Certificate-Pfad korrekt?
- [ ] Certificate Passwort korrekt?
- [ ] Certificate nicht abgelaufen?

### Signing Fails

- [ ] Certificate im Windows Store?
- [ ] Certificate exportiert als .pfx?
- [ ] Passwort korrekt in `.env`?
- [ ] PowerShell als Administrator ausgeführt?

### SmartScreen Issues

- [ ] Certificate ist signiert? (Properties prüfen)
- [ ] Status: Valid? (`Get-AuthenticodeSignature`)
- [ ] User-Dokumentation erklärt Warnung?

---

## Certificate Renewal Checklist

### Vor Ablauf (1 Monat vorher)

- [ ] Certificate-Gültigkeit geprüft
- [ ] Neues Certificate erstellen geplant
- [ ] User über Ablauf informiert (falls nötig)

### Certificate erneuern

```powershell
# Altes Certificate löschen
Get-ChildItem Cert:\CurrentUser\My | Where-Object {$_.Subject -eq "CN=AutoLabel"} | Remove-Item

# Neues Certificate erstellen
.\CREATE_CERTIFICATE.ps1
```

- [ ] Altes Certificate gelöscht
- [ ] Neues Certificate erstellt
- [ ] Neues Certificate exportiert
- [ ] `.env` Datei aktualisiert (falls Passwort geändert)
- [ ] Neuer Build erstellt und getestet

---

## Upgrade to Production Certificate

### Wann upgraden?

- [ ] App wird öffentlich verteilt
- [ ] Budget ist vorhanden (~$200-600/Jahr)
- [ ] Professionelles Aussehen ist wichtig
- [ ] User sollen keine Warnung sehen

### Upgrade-Prozess

1. **Certificate kaufen**
   - [ ] Anbieter gewählt (DigiCert, Sectigo, etc.)
   - [ ] Certificate-Typ gewählt (Standard oder EV)
   - [ ] Certificate bestellt

2. **Certificate installieren**
   - [ ] Certificate erhalten (.pfx oder .p12)
   - [ ] Certificate in `app/certs/` kopiert
   - [ ] `.env` Datei aktualisiert

3. **Build testen**
   - [ ] Signed Build erstellt
   - [ ] Certificate validiert
   - [ ] SmartScreen-Warnung verschwindet (nach Reputation-Aufbau)

4. **Dokumentation aktualisieren**
   - [ ] README.md aktualisiert (keine Self-Signed Warnung mehr)
   - [ ] User informiert über Upgrade

---

## Summary

### ✅ Completed Tasks

- [ ] Certificate Setup
- [ ] Configuration
- [ ] Security
- [ ] Build (unsigned)
- [ ] Build (signed)
- [ ] Certificate Validation
- [ ] Installer Properties
- [ ] Installation Testing
- [ ] App Launch
- [ ] Deinstallation
- [ ] User-Dokumentation

### 📊 Status

| Category | Status |
|----------|--------|
| Certificate | ⏳ Pending |
| Configuration | ⏳ Pending |
| Build | ⏳ Pending |
| Testing | ⏳ Pending |
| Documentation | ⏳ Pending |

**Legend:**
- ✅ Completed
- ⏳ Pending
- ⚠️ Issues
- ❌ Failed

---

## Next Steps

1. **Run Certificate Creation Script:**
   ```powershell
   cd app
   .\CREATE_CERTIFICATE.ps1
   ```

2. **Build Signed Installer:**
   ```bash
   cd app
   npm run make:signed
   ```

3. **Test Installation:**
   - Test auf sauberem Windows System
   - SmartScreen Warnung akzeptieren
   - App starten und testen

4. **Document Results:**
   - Screenshots der SmartScreen Warnung
   - User-Feedback sammeln
   - Probleme dokumentieren

---

## Resources

- **SELF_SIGNED_CERTIFICATE.md** - Vollständige Dokumentation
- **certs/README.md** - Certificate Management
- **.env.example** - Environment Variables Template
- **forge.config.ts** - Signing Configuration

---

**Last Updated:** 28.12.2025

