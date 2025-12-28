# 📁 Code Signing - Dateiübersicht

## Neu erstellte/geänderte Dateien

### 🔐 Certificate-Ordner

```
app/certs/
├── .gitignore                  ✨ NEU - Ignoriert alle Certificates
├── README.md                   ✨ NEU - Certificate Setup-Anleitung
└── autolabel.pfx              ⏳ WIRD ERSTELLT - Self-Signed Certificate
```

**Wichtig:** `autolabel.pfx` wird mit `CREATE_CERTIFICATE.ps1` erstellt und ist in `.gitignore`!

---

### ⚙️ Konfigurationsdateien

#### 1. `forge.config.ts` ✏️ GEÄNDERT

**Neu hinzugefügt:**
```typescript
import 'dotenv/config';  // ✅ NEU

packagerConfig: {
  win32metadata: {        // ✅ NEU
    CompanyName: 'AutoLabel',
    FileDescription: 'AutoLabel - Shipping Label Management',
    ProductName: 'AutoLabel',
    InternalName: 'autolabel',
  },
}

new MakerSquirrel({
  // ✅ NEU: Code Signing Configuration
  certificateFile: process.env.WINDOWS_CERT_PATH || undefined,
  certificatePassword: process.env.WINDOWS_CERT_PASSWORD || undefined,
  signingHashAlgorithms: ['sha256'],
})
```

#### 2. `package.json` ✏️ GEÄNDERT

**Neu hinzugefügt:**
```json
{
  "scripts": {
    "make:signed": "cross-env NODE_ENV=production electron-forge make",
    "package:signed": "cross-env NODE_ENV=production electron-forge package"
  },
  "devDependencies": {
    "dotenv": "^16.x.x",
    "cross-env": "^7.x.x"
  }
}
```

#### 3. `.gitignore` ✏️ GEÄNDERT

**Neu hinzugefügt:**
```gitignore
# dotenv environment variables file
.env
.env.test
.env.local
.env.production

# Code Signing Certificates (NIEMALS committen!)
certs/*.pfx
certs/*.p12
certs/*.pem
certs/*.key
certs/*.crt
certs/*.cer
certs/*.bak
certs/*.backup
```

---

### 🔑 Environment Variables

#### 1. `.env.example` ✨ NEU

Template für Environment Variables:
```env
WINDOWS_CERT_PATH=./certs/autolabel.pfx
WINDOWS_CERT_PASSWORD=
```

#### 2. `.env` ⏳ WIRD ERSTELLT

Wird mit `CREATE_CERTIFICATE.ps1` automatisch erstellt.

**⚠️ WICHTIG:** Diese Datei ist in `.gitignore` und wird NICHT committed!

---

### 🛠️ Scripts

#### 1. `CREATE_CERTIFICATE.ps1` ✨ NEU

Automatisches Certificate-Erstellungs-Script:
- Erstellt Self-Signed Certificate
- Exportiert als `.pfx`
- Erstellt `.env` Datei automatisch
- Validiert Setup

**Verwendung:**
```powershell
# PowerShell als Administrator
cd app
.\CREATE_CERTIFICATE.ps1
```

---

### 📚 Dokumentation

#### 1. `SELF_SIGNED_CERTIFICATE.md` ✨ NEU

**Vollständige Dokumentation:**
- Was ist ein Self-Signed Certificate?
- Setup-Anleitung (Schritt-für-Schritt)
- Certificate-Erstellung
- Build-Prozess
- Testing & Validation
- Troubleshooting
- Upgrade auf Production Certificate

#### 2. `CODE_SIGNING_CHECKLIST.md` ✨ NEU

**Testing Checklist:**
- Pre-Build Checklist
- Build Checklist
- Validation Checklist
- Installation Testing
- User Experience Checklist
- Production Checklist
- Troubleshooting Checklist
- Certificate Renewal Checklist

#### 3. `INSTALLATION_GUIDE.md` ✨ NEU

**User Installation Guide:**
- System Requirements
- Installation Steps
- SmartScreen Warnung erklärt
- Post-Installation
- Troubleshooting
- Deinstallation
- Security & Privacy

#### 4. `CODE_SIGNING_SUMMARY.md` ✨ NEU

**Setup-Übersicht:**
- Was wurde eingerichtet?
- Nächste Schritte
- Status-Übersicht
- Dokumentation
- Troubleshooting
- Upgrade-Plan

#### 5. `QUICK_START_CODE_SIGNING.md` ✨ NEU

**Quick Start Guide:**
- TL;DR - In 3 Schritten zum signierten Installer
- Detaillierte Anleitung
- Troubleshooting
- Nächste Schritte

#### 6. `CODE_SIGNING_FILES.md` ✨ NEU (diese Datei)

**Dateiübersicht:**
- Alle erstellten/geänderten Dateien
- Ordnerstruktur
- Änderungsübersicht

---

## 📊 Änderungsübersicht

### Neu erstellt (✨)

| Datei | Typ | Beschreibung |
|-------|-----|--------------|
| `certs/.gitignore` | Config | Ignoriert Certificates |
| `certs/README.md` | Docs | Certificate Setup |
| `.env.example` | Config | Environment Variables Template |
| `CREATE_CERTIFICATE.ps1` | Script | Certificate-Erstellungs-Script |
| `SELF_SIGNED_CERTIFICATE.md` | Docs | Vollständige Dokumentation |
| `CODE_SIGNING_CHECKLIST.md` | Docs | Testing Checklist |
| `INSTALLATION_GUIDE.md` | Docs | User Installation Guide |
| `CODE_SIGNING_SUMMARY.md` | Docs | Setup-Übersicht |
| `QUICK_START_CODE_SIGNING.md` | Docs | Quick Start Guide |
| `CODE_SIGNING_FILES.md` | Docs | Diese Datei |

### Geändert (✏️)

| Datei | Änderung |
|-------|----------|
| `forge.config.ts` | + `dotenv/config`, + `win32metadata`, + Code Signing Config |
| `package.json` | + `make:signed`, + `package:signed`, + `dotenv`, + `cross-env` |
| `.gitignore` | + Certificate-Patterns, + `.env` Patterns |

### Wird erstellt (⏳)

| Datei | Erstellt durch | Beschreibung |
|-------|----------------|--------------|
| `certs/autolabel.pfx` | `CREATE_CERTIFICATE.ps1` | Self-Signed Certificate |
| `.env` | `CREATE_CERTIFICATE.ps1` | Environment Variables |

---

## 📁 Ordnerstruktur

```
app/
├── certs/                              ✨ NEU
│   ├── .gitignore                     ✨ NEU
│   ├── README.md                      ✨ NEU
│   └── autolabel.pfx                  ⏳ WIRD ERSTELLT
│
├── .env.example                        ✨ NEU
├── .env                                ⏳ WIRD ERSTELLT (in .gitignore)
├── .gitignore                          ✏️ GEÄNDERT
├── forge.config.ts                     ✏️ GEÄNDERT
├── package.json                        ✏️ GEÄNDERT
│
├── CREATE_CERTIFICATE.ps1              ✨ NEU
│
├── SELF_SIGNED_CERTIFICATE.md          ✨ NEU
├── CODE_SIGNING_CHECKLIST.md           ✨ NEU
├── INSTALLATION_GUIDE.md               ✨ NEU
├── CODE_SIGNING_SUMMARY.md             ✨ NEU
├── QUICK_START_CODE_SIGNING.md         ✨ NEU
└── CODE_SIGNING_FILES.md               ✨ NEU (diese Datei)
```

---

## 🔍 Datei-Details

### Certificate-Ordner (`certs/`)

**Zweck:** Speichert Code Signing Certificates

**Inhalt:**
- `.gitignore` - Ignoriert alle Certificate-Dateien
- `README.md` - Setup-Anleitung
- `autolabel.pfx` - Self-Signed Certificate (wird erstellt)

**Security:**
- Alle Certificate-Dateien sind in `.gitignore`
- Werden NIEMALS committed
- Nur lokal gespeichert

### Environment Variables

**`.env.example`:**
- Template für Environment Variables
- Kann committed werden (keine Secrets)
- Zeigt benötigte Variables

**`.env`:**
- Enthält Certificate-Passwort
- Wird automatisch erstellt
- Ist in `.gitignore` (NICHT committen!)

### Dokumentation

**Hauptdokumentation:**
1. `SELF_SIGNED_CERTIFICATE.md` - Vollständige Anleitung
2. `CODE_SIGNING_CHECKLIST.md` - Testing Checklist
3. `INSTALLATION_GUIDE.md` - User Guide

**Zusätzliche Dokumentation:**
4. `CODE_SIGNING_SUMMARY.md` - Setup-Übersicht
5. `QUICK_START_CODE_SIGNING.md` - Quick Start
6. `CODE_SIGNING_FILES.md` - Diese Datei

---

## 🚀 Verwendung

### 1. Certificate erstellen

```powershell
cd app
.\CREATE_CERTIFICATE.ps1
```

**Erstellt:**
- `certs/autolabel.pfx`
- `.env`

### 2. Signed Build erstellen

```bash
cd app
npm run make:signed
```

**Verwendet:**
- `forge.config.ts` (Code Signing Config)
- `.env` (Certificate-Pfad und Passwort)
- `certs/autolabel.pfx` (Certificate)

**Erstellt:**
- `out/make/squirrel.windows/x64/AutoLabel-1.0.0 Setup.exe` (signiert)

---

## ✅ Zusammenfassung

**Neu erstellt:**
- 10 Dateien (Docs, Scripts, Config)
- 1 Ordner (`certs/`)

**Geändert:**
- 3 Dateien (`forge.config.ts`, `package.json`, `.gitignore`)

**Wird erstellt:**
- 2 Dateien (`certs/autolabel.pfx`, `.env`)

**Total:**
- 15 Dateien
- 1 Ordner

---

## 📞 Support

Bei Fragen:
- Siehe `SELF_SIGNED_CERTIFICATE.md` für Details
- Siehe `CODE_SIGNING_CHECKLIST.md` für Testing
- Siehe `QUICK_START_CODE_SIGNING.md` für Quick Start

---

**Last Updated:** 28.12.2025

