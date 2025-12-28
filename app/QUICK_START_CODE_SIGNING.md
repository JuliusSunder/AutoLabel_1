# 🚀 Quick Start: Code Signing für AutoLabel

## TL;DR - In 3 Schritten zum signierten Installer

### Schritt 1: Certificate erstellen (5 Minuten)

**PowerShell als Administrator** öffnen:

```powershell
cd C:\STRUKTUR\Business_\online_\SaaS_\AutoLabel_1\app
.\CREATE_CERTIFICATE.ps1
```

- Passwort eingeben (sicher aufbewahren!)
- Warten bis "Setup Complete!" erscheint

### Schritt 2: Signed Build erstellen (2-5 Minuten)

```bash
cd app
npm run make:signed
```

- Warten bis Build fertig ist
- Installer: `out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe`

### Schritt 3: Testen (2 Minuten)

1. Installer auf sauberem Windows System ausführen
2. SmartScreen Warnung: **"More info"** → **"Run anyway"**
3. App installieren und starten

**Fertig! 🎉**

---

## 📋 Detaillierte Anleitung

### Voraussetzungen

- ✅ Windows 10/11
- ✅ PowerShell (als Administrator)
- ✅ Node.js installiert
- ✅ AutoLabel-Projekt geklont

### 1. Certificate erstellen

#### Option A: Automatisches Script (Empfohlen)

```powershell
# PowerShell als Administrator öffnen
cd C:\STRUKTUR\Business_\online_\SaaS_\AutoLabel_1\app
.\CREATE_CERTIFICATE.ps1
```

**Was passiert:**
- Certificate wird erstellt
- Certificate wird als `.pfx` exportiert
- `.env` Datei wird automatisch erstellt
- Setup wird validiert

**Erwartete Ausgabe:**
```
✓ Certificate created successfully!
✓ Certificate exported to: .\certs\autolabel.pfx
✓ .env file created successfully!
✅ All checks passed!
```

#### Option B: Manuell

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

# Passwort setzen
$password = Read-Host "Enter password" -AsSecureString

# Certificate exportieren
Export-PfxCertificate `
    -Cert $cert `
    -FilePath ".\certs\autolabel.pfx" `
    -Password $password
```

Dann `.env` Datei manuell erstellen:
```env
WINDOWS_CERT_PATH=./certs/autolabel.pfx
WINDOWS_CERT_PASSWORD=dein-passwort-hier
```

---

### 2. Signed Build erstellen

```bash
cd app
npm run make:signed
```

**Was passiert:**
1. App wird gebaut
2. App wird signiert mit Self-Signed Certificate
3. Installer wird erstellt

**Output:**
```
✔ Packaging application
✔ Signing application (SHA256)
✔ Making distributables

Build complete!
Output: app/out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe
```

---

### 3. Certificate validieren

```powershell
Get-AuthenticodeSignature ".\app\out\make\squirrel.windows\x64\AutoLabel-1.0.0 Setup.exe"
```

**Erwartete Ausgabe:**
```
Status: Valid
SignerCertificate: CN=AutoLabel
StatusMessage: Signature verified.
```

✅ **Perfekt!** Installer ist signiert.

---

### 4. Installation testen

#### Auf sauberem Windows System:

1. **Installer ausführen**
   - Doppelklick auf `AutoLabel-1.0.0 Setup.exe`

2. **SmartScreen Warnung (NORMAL!)**
   ```
   Windows protected your PC
   ```
   - Klick auf **"More info"**
   - Klick auf **"Run anyway"**

3. **Installation**
   - Installer startet
   - Installation läuft
   - App wird installiert

4. **App starten**
   - Startmenü → AutoLabel
   - App startet normal

✅ **Fertig!** App ist installiert und funktioniert.

---

## ⚠️ Wichtige Hinweise

### SmartScreen Warnung ist NORMAL

**Warum?**
- Self-Signed Certificate hat keine Reputation
- Windows vertraut nur Certificates von vertrauenswürdigen CAs

**Lösung:**
- User müssen "Run anyway" klicken
- Für Production: Upgrade auf professionelles Certificate

### Security

✅ **DO:**
- Certificate Passwort sicher aufbewahren
- `.env` Datei NICHT committen
- Certificate NICHT committen

❌ **DON'T:**
- Passwort in Git committen
- Certificate mit anderen teilen

---

## 🐛 Troubleshooting

### "Cannot create certificate"
→ PowerShell als Administrator ausführen

### "Signing failed"
→ `.env` Datei vorhanden? Passwort korrekt?

### "SmartScreen blocks installer"
→ **Normal!** User muss "Run anyway" klicken

---

## 📚 Weitere Dokumentation

- **SELF_SIGNED_CERTIFICATE.md** - Vollständige Dokumentation
- **CODE_SIGNING_CHECKLIST.md** - Testing Checklist
- **INSTALLATION_GUIDE.md** - User Installation Guide
- **CODE_SIGNING_SUMMARY.md** - Setup-Übersicht

---

## 🎯 Nächste Schritte

1. ✅ Certificate erstellt
2. ✅ Signed Build erstellt
3. ✅ Installation getestet
4. ⏳ User-Feedback sammeln
5. ⏳ Upgrade auf Production Certificate planen

**Viel Erfolg! 🚀**

