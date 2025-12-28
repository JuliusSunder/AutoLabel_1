# Self-Signed Certificate Setup für AutoLabel

## 📋 Übersicht

Dieses Dokument beschreibt die vollständige Einrichtung eines **Self-Signed Code Signing Certificates** für AutoLabel unter Windows.

---

## ⚠️ Wichtige Hinweise

### Was ist ein Self-Signed Certificate?

Ein Self-Signed Certificate ist ein kostenloses Code Signing Certificate, das wir selbst erstellen. Es funktioniert genauso wie ein professionelles Certificate, aber Windows zeigt eine **SmartScreen Warnung** beim ersten Start.

### Vorteile ✅
- **Kostenlos** - Keine jährlichen Kosten
- **Funktioniert für Testing/Development** - Perfekt für interne Tests
- **Installer ist signiert** - Zeigt Certificate in Properties
- **Schnell erstellt** - In wenigen Minuten einsatzbereit

### Nachteile ⚠️
- **Windows SmartScreen Warnung** - "Windows protected your PC"
- **User müssen Warnung akzeptieren** - "More info" → "Run anyway"
- **Nicht für kommerzielle Distribution empfohlen** - Professionelles Aussehen fehlt
- **Keine automatische Reputation** - Jeder User sieht Warnung

---

## 🚀 Setup-Anleitung

### Schritt 1: Self-Signed Certificate erstellen

**PowerShell als Administrator** öffnen und ausführen:

```powershell
# Certificate erstellen
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=AutoLabel" `
    -CertStoreLocation Cert:\CurrentUser\My `
    -KeyUsage DigitalSignature `
    -KeySpec Signature `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(1)

# Certificate Details anzeigen
$cert | Format-List

# Certificate Thumbprint notieren (wird später benötigt)
Write-Host "Certificate Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green
Write-Host "Certificate Subject: $($cert.Subject)" -ForegroundColor Green
Write-Host "Valid Until: $($cert.NotAfter)" -ForegroundColor Yellow
```

**Erwartete Ausgabe:**
```
Certificate Thumbprint: A1B2C3D4E5F6...
Certificate Subject: CN=AutoLabel
Valid Until: 28.12.2026 10:30:00
```

---

### Schritt 2: Certificate als .pfx exportieren

```powershell
# Passwort für Export setzen (sicher wählen!)
$password = Read-Host "Enter password for certificate export" -AsSecureString

# Certificate exportieren
$certPath = ".\app\certs\autolabel.pfx"
Export-PfxCertificate `
    -Cert $cert `
    -FilePath $certPath `
    -Password $password

Write-Host "✓ Certificate exported to: $certPath" -ForegroundColor Green
```

**Wichtig:** 
- Passwort sicher aufbewahren!
- Certificate-Datei wird in `app/certs/autolabel.pfx` gespeichert
- Diese Datei ist in `.gitignore` und wird NICHT committed

---

### Schritt 3: .env Datei erstellen

Erstelle `app/.env` mit folgendem Inhalt:

```env
# Windows Code Signing (Self-Signed)
WINDOWS_CERT_PATH=./certs/autolabel.pfx
WINDOWS_CERT_PASSWORD=dein-passwort-hier
```

**⚠️ WICHTIG:**
- `.env` Datei ist in `.gitignore` und wird NICHT committed
- Passwort niemals in Git committen
- Für Production: Secrets Management verwenden

---

### Schritt 4: Signed Build erstellen

```bash
cd app
npm run make:signed
```

**Was passiert:**
1. Electron Forge baut die App
2. App wird mit Self-Signed Certificate signiert
3. Installer wird erstellt: `out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe`

---

## ✅ Testing & Validation

### 1. Certificate Validation

**PowerShell:**
```powershell
# Certificate Details prüfen
Get-AuthenticodeSignature ".\app\out\make\squirrel.windows\x64\AutoLabel-1.0.0 Setup.exe"
```

**Erwartete Ausgabe:**
```
Status: Valid
SignerCertificate: CN=AutoLabel
StatusMessage: Signature verified.
```

### 2. Installer Properties prüfen

1. Rechtsklick auf `AutoLabel-1.0.0 Setup.exe`
2. **Properties** → **Digital Signatures** Tab
3. Certificate sollte sichtbar sein:
   - **Signer**: AutoLabel
   - **Timestamp**: (leer bei Self-Signed)
   - **Status**: Valid

### 3. Installation testen

**Auf sauberem Windows System:**

1. Installer ausführen
2. **Erwartete Warnung:**
   ```
   Windows protected your PC
   Microsoft Defender SmartScreen prevented an unrecognized app from starting.
   ```
3. **Klicke auf "More info"**
4. **Klicke auf "Run anyway"**
5. App sollte normal installieren

**⚠️ Diese Warnung ist NORMAL bei Self-Signed Certificates!**

---

## 🔐 Security Checklist

Vor Launch prüfen:

- [ ] Self-Signed Certificate ist erstellt und exportiert
- [ ] Certificate ist in `.gitignore` (nicht committed)
- [ ] `.env` Datei ist in `.gitignore`
- [ ] Certificate Passwort ist sicher gespeichert
- [ ] Build funktioniert mit Signing (`npm run make:signed`)
- [ ] Installer ist signiert (prüfbar in Properties)
- [ ] User-Dokumentation erklärt SmartScreen Warnung
- [ ] Certificate Gültigkeit geprüft (1 Jahr)

---

## 🔄 Certificate erneuern

Self-Signed Certificates sind **1 Jahr gültig**. Zum Erneuern:

```powershell
# Altes Certificate löschen (optional)
Get-ChildItem Cert:\CurrentUser\My | Where-Object {$_.Subject -eq "CN=AutoLabel"} | Remove-Item

# Neues Certificate erstellen (siehe Schritt 1)
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=AutoLabel" `
    -CertStoreLocation Cert:\CurrentUser\My `
    -KeyUsage DigitalSignature `
    -KeySpec Signature `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(1)

# Als .pfx exportieren (siehe Schritt 2)
```

---

## 📈 Upgrade auf Production Certificate

### Wann upgraden?

- ✅ App ist erfolgreich und wird öffentlich verteilt
- ✅ Budget ist vorhanden (~$200-600/Jahr)
- ✅ Professionelles Aussehen ist wichtig
- ✅ User sollen keine Warnung sehen

### Optionen:

#### 1. Standard Code Signing Certificate
- **Kosten:** ~$200-300/Jahr
- **Vorteil:** Keine SmartScreen Warnung nach Reputation-Aufbau
- **Anbieter:** DigiCert, Sectigo, GlobalSign
- **Benötigt:** Firmenregistrierung, Identitätsnachweis

#### 2. EV Code Signing Certificate (Extended Validation)
- **Kosten:** ~$400-600/Jahr
- **Vorteil:** Sofortige SmartScreen Reputation
- **Anbieter:** DigiCert, Sectigo
- **Benötigt:** Hardware-Token (USB), erweiterte Firmenvalidierung

### Empfehlung:

| Phase | Certificate | Kosten | Warnung |
|-------|------------|--------|---------|
| **Development** | Self-Signed | Kostenlos | ⚠️ Ja |
| **Beta** | Standard Code Signing | ~$200/Jahr | ⚠️ Initial, dann nein |
| **Production** | EV Code Signing | ~$400/Jahr | ✅ Nein |

---

## 🛠️ Alternative: OpenSSL

Falls PowerShell nicht funktioniert:

```bash
# Certificate erstellen
openssl req -x509 -newkey rsa:2048 -keyout autolabel.key -out autolabel.crt -days 365 -nodes -subj "/CN=AutoLabel"

# Als .pfx exportieren
openssl pkcs12 -export -out autolabel.pfx -inkey autolabel.key -in autolabel.crt -name "AutoLabel"
```

---

## 📚 User-Dokumentation

### Für README.md oder Installationsanleitung:

```markdown
## Installation

Beim ersten Start zeigt Windows möglicherweise eine Sicherheitswarnung:

**"Windows protected your PC"**

Dies ist normal bei Self-Signed Certificates. Um die App zu installieren:

1. Klicken Sie auf **"More info"**
2. Klicken Sie auf **"Run anyway"**

Die App ist sicher - das Certificate wurde von uns selbst signiert für Testing-Zwecke.

**Für Production-Versionen:** Wir verwenden ein professionelles Code Signing Certificate, das keine Warnung zeigt.
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find certificate"

**Lösung:**
```powershell
# Certificate im Store prüfen
Get-ChildItem Cert:\CurrentUser\My | Where-Object {$_.Subject -eq "CN=AutoLabel"}

# Falls nicht vorhanden: Neu erstellen (siehe Schritt 1)
```

### Problem: "Wrong password"

**Lösung:**
- Passwort in `.env` Datei prüfen
- Certificate neu exportieren mit korrektem Passwort

### Problem: "Signing failed"

**Lösung:**
- `dotenv` installiert? → `npm install --save-dev dotenv`
- `.env` Datei vorhanden? → `app/.env` erstellen
- Certificate-Pfad korrekt? → `./certs/autolabel.pfx` (relativ zu `app/`)

### Problem: "SmartScreen zeigt 'Unknown Publisher'"

**Lösung:**
- **Normal bei Self-Signed!** User müssen "Run anyway" klicken
- Für Production: Upgrade auf professionelles Certificate

---

## 📞 Support

Bei weiteren Problemen:

1. **Certificate prüfen:**
   ```powershell
   Get-AuthenticodeSignature "path\to\autolabel.exe" | Format-List
   ```

2. **Build-Logs prüfen:**
   ```bash
   cd app
   npm run make:signed 2>&1 | Tee-Object -FilePath build.log
   ```

3. **Dokumentation:**
   - `app/certs/README.md` - Certificate Setup
   - `app/.env.example` - Environment Variables
   - `app/forge.config.ts` - Signing Configuration

---

## 📄 Technische Details

| Parameter | Wert |
|-----------|------|
| **Certificate Typ** | Self-Signed Code Signing Certificate |
| **Certificate Format** | .pfx (PKCS#12) mit Passwort |
| **Signing Algorithm** | SHA-256 |
| **Key Length** | 2048 Bit RSA |
| **Gültigkeit** | 1 Jahr (konfigurierbar) |
| **Kosten** | Kostenlos |
| **SmartScreen** | ⚠️ Warnung (normal bei Self-Signed) |

---

## ✅ Zusammenfassung

1. ✅ Self-Signed Certificate erstellt
2. ✅ Certificate als .pfx exportiert
3. ✅ `.env` Datei mit Passwort erstellt
4. ✅ `forge.config.ts` konfiguriert
5. ✅ Build Scripts angepasst
6. ✅ Signed Build erstellt: `npm run make:signed`
7. ✅ Installer ist signiert und funktioniert
8. ⚠️ SmartScreen Warnung ist normal (User müssen akzeptieren)

**Für Production:** Später auf professionelles Certificate upgraden!

