# Self-Signed Code Signing Certificate

## ⚠️ Wichtig

Dieses Self-Signed Certificate ist **nur für Testing/Development** gedacht!

### Für Production:
- ❌ Windows zeigt "Unknown Publisher" Warnung
- ❌ User müssen Warnung manuell akzeptieren
- ❌ Nicht für kommerzielle Distribution empfohlen

### Für Testing/Development:
- ✅ Kostenlos
- ✅ Funktioniert für lokale Tests
- ✅ Installer ist signiert
- ✅ Keine zusätzlichen Kosten

---

## 📋 Setup

### 1. Certificate erstellen

**PowerShell als Administrator** ausführen:

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
```

### 2. Certificate als .pfx exportieren

```powershell
# Passwort für Export setzen
$password = Read-Host "Enter password for certificate export" -AsSecureString

# Certificate exportieren
$certPath = ".\app\certs\autolabel.pfx"
Export-PfxCertificate `
    -Cert $cert `
    -FilePath $certPath `
    -Password $password

Write-Host "✓ Certificate exported to: $certPath" -ForegroundColor Green
```

### 3. .env Datei erstellen

Erstelle `app/.env` mit folgendem Inhalt:

```env
# Windows Code Signing (Self-Signed)
WINDOWS_CERT_PATH=./certs/autolabel.pfx
WINDOWS_CERT_PASSWORD=dein-passwort-hier
```

**⚠️ WICHTIG**: Die `.env` Datei ist in `.gitignore` und wird NICHT committed!

---

## 🔄 Alternative: OpenSSL

Falls PowerShell nicht funktioniert:

```bash
# Certificate erstellen
openssl req -x509 -newkey rsa:2048 -keyout autolabel.key -out autolabel.crt -days 365 -nodes -subj "/CN=AutoLabel"

# Als .pfx exportieren
openssl pkcs12 -export -out autolabel.pfx -inkey autolabel.key -in autolabel.crt -name "AutoLabel"
```

---

## ✅ Certificate Validation

Nach dem Build prüfen:

```powershell
# Certificate Details prüfen
Get-AuthenticodeSignature "path\to\autolabel.exe"

# Sollte zeigen:
# Status: Valid
# SignerCertificate: CN=AutoLabel
# StatusMessage: Signature verified.
```

---

## 🔐 Security

- ✅ Certificate ist in `.gitignore` (wird nicht committed)
- ✅ `.env` Datei ist in `.gitignore`
- ✅ Passwort ist nur lokal gespeichert
- ⚠️ Certificate ist gültig für 1 Jahr
- ⚠️ Certificate muss jährlich erneuert werden

---

## 📈 Upgrade auf Production Certificate

Wenn die App erfolgreich ist und Budget vorhanden ist, kann auf ein professionelles Certificate upgegradet werden:

### Optionen:
1. **Standard Code Signing Certificate**
   - Kosten: ~$200-300/Jahr
   - Vorteil: Keine SmartScreen Warnung nach Reputation-Aufbau
   - Anbieter: DigiCert, Sectigo, GlobalSign

2. **EV Code Signing Certificate** (Extended Validation)
   - Kosten: ~$400-600/Jahr
   - Vorteil: Sofortige SmartScreen Reputation
   - Anbieter: DigiCert, Sectigo
   - Benötigt: Hardware-Token (USB)

### Empfehlung:
- **Jetzt**: Self-Signed für Testing/Development
- **Beta**: Standard Code Signing Certificate
- **Production**: EV Code Signing Certificate (wenn Budget vorhanden)

---

## 📞 Support

Bei Problemen:
1. Prüfe ob PowerShell als Administrator läuft
2. Prüfe ob `.env` Datei korrekt erstellt wurde
3. Prüfe ob Passwort korrekt ist
4. Siehe `SELF_SIGNED_CERTIFICATE.md` für Details

