# Changelog

Alle wichtigen Änderungen an AutoLabel werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### Geplant
- Update-Notification UI im Renderer
- Batch-Printing für mehrere Labels
- Label-Templates
- Export zu CSV/Excel
- Statistiken & Reports

---

## [1.0.0] - 2025-01-15

### Added
- ✨ Initiales Release von AutoLabel
- 📧 Email-Scanning via IMAP
  - Unterstützung für Gmail, Outlook, Yahoo, GMX, Web.de, Proton
  - Automatische Erkennung von Shipping Labels
  - PDF-Attachment-Download
- 🏷️ Label-Preparation
  - PDF-Verarbeitung
  - Automatische Größenanpassung auf 100×150mm (4×6")
  - Label-Preview
  - Label-Bearbeitung
- 🖨️ Printing
  - Direkt-Druck auf Label-Drucker
  - Drucker-Auswahl
  - Druck-Einstellungen
- ⚙️ Settings
  - Email-Konfiguration
  - Drucker-Konfiguration
  - App-Einstellungen
- 💾 Lokale SQLite-Datenbank
  - Label-Speicherung
  - Schnelle Suche & Filterung
- 🔄 Auto-Updater
  - Automatische Update-Prüfung via GitHub Releases
  - Hintergrund-Download
  - Installation beim nächsten Start
  - Integration mit electron-updater
- 📦 Build & Distribution
  - Production Build mit Electron Forge
  - Windows Installer (Squirrel)
  - GitHub Publishing Integration
  - Automatisches Upload von Release-Artefakten
- 🔐 Sicherheit
  - Verschlüsselte Credential-Speicherung
  - TLS/SSL für Email-Verbindungen
  - Electron Security Best Practices
  - Context Isolation enabled
  - Node Integration disabled

### Technical
- Electron 39.2.7
- React 19.2.3
- TypeScript 4.5.4
- Vite 5.4.21
- Electron Forge 7.10.2
- better-sqlite3 12.5.0
- sharp 0.34.5
- pdf-lib 1.17.1

---

## Versioning

**Format:** MAJOR.MINOR.PATCH

- **MAJOR:** Breaking Changes (z.B. 1.0.0 → 2.0.0)
- **MINOR:** Neue Features, keine Breaking Changes (z.B. 1.0.0 → 1.1.0)
- **PATCH:** Bugfixes, kleine Verbesserungen (z.B. 1.0.0 → 1.0.1)

---

## Kategorien

- **Added:** Neue Features
- **Changed:** Änderungen an bestehenden Features
- **Deprecated:** Features die bald entfernt werden
- **Removed:** Entfernte Features
- **Fixed:** Bugfixes
- **Security:** Sicherheits-Updates

---

**Letzte Aktualisierung:** 2025-01-15

---

## Release Notes für GitHub

### AutoLabel v1.0.0 - Initiales Release

**Release Date:** 2025-01-15

#### ✨ Neue Features

**Email-Scanning**
- Automatisches Scannen von Emails via IMAP
- Unterstützung für alle gängigen Email-Provider (Gmail, Outlook, Yahoo, GMX, Web.de, Proton)
- Automatische Erkennung und Download von Shipping Label PDFs

**Label-Verarbeitung**
- Automatische Normalisierung auf Standard-Größe (100×150mm / 4×6")
- Label-Preview und Bearbeitung
- Unterstützung für verschiedene Label-Formate

**Drucken**
- Direkter Druck auf Label-Drucker
- Einfache Drucker-Auswahl
- Anpassbare Druck-Einstellungen

**Auto-Updates**
- Automatische Update-Prüfung beim App-Start
- Hintergrund-Download von Updates
- Nahtlose Installation beim nächsten Start

#### 🔧 Technische Details

- **Electron:** 39.2.7
- **React:** 19.2.3
- **TypeScript:** 4.5.4
- **Datenbank:** SQLite (better-sqlite3)
- **Bildverarbeitung:** Sharp
- **PDF-Verarbeitung:** pdf-lib

#### 📦 Installation

1. Download `AutoLabel-1.0.0 Setup.exe`
2. Installer ausführen
3. App starten und Email-Account konfigurieren

#### 🔄 Updates

Die App prüft automatisch auf Updates beim Start. Updates werden im Hintergrund heruntergeladen und beim nächsten Start installiert.

#### 🐛 Bekannte Probleme

Einige Funktionen werden in zukünftigen Updates verbessert. Bei Problemen bitte ein Issue auf GitHub erstellen.

#### 🙏 Feedback

Feedback und Bug-Reports sind willkommen! Bitte erstelle ein Issue auf GitHub.

