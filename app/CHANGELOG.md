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
  - Automatische Update-Prüfung
  - Hintergrund-Download
  - Installation beim nächsten Start
- 🔐 Sicherheit
  - Verschlüsselte Credential-Speicherung
  - TLS/SSL für Email-Verbindungen
  - Electron Security Best Practices

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

