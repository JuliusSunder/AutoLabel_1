# AutoLabel

AutoLabel is a cross-platform desktop app (Windows/macOS) for resellers to batch-handle shipping labels:
scan sales emails on-demand, extract label attachments, normalize them to 100×150mm (4×6"), add a metadata footer, and print in bulk.

 MVP (what we ship first)
-Manual Scan button (no background scanning)
-Extract sales + label attachments from email
-Show sales grouped by date (calendar-like history)
-Select sales (e.g. 15.12) → auto crop/normalize labels to 100×150mm
-Add a configurable footer overlay (choose which fields to include)
-Batch print queue to any OS-installed label printer

Not in MVP
-Background scanning
-Cloud sync / accounts required
-Marketplace web scraping
-Auto “mark as shipped” (only later if a safe/official integration exists)

Default output (important)
-Target label size: 100×150mm (4×6")
-Goal: compatible with common reseller label printers via system printer drivers
If the printer appears in Windows/macOS as a normal printer, AutoLabel should be able to print to it.

Tech stack
-Electron Forge + Vite + TypeScript
-Secure Electron model: renderer has no Node; OS actions are done in main via preload IPC

## Prerequisites

### Required
- Recent Node.js + npm
- **SumatraPDF** (for reliable label printing)
  - Download: https://www.sumatrapdfreader.org/download-free-pdf-viewer
  - See [SUMATRA_PDF_INSTALL.md](SUMATRA_PDF_INSTALL.md) for installation instructions
  - Without SumatraPDF, the app will use Electron fallback (may have rendering issues)

### Optional
- ImageMagick (for advanced label processing)
  - See [IMAGEMAGICK_INSTALL.md](IMAGEMAGICK_INSTALL.md)

## Run locally

```bash
npm install
npm start

Repo layout (this project)
This repo uses the default Electron Forge + Vite template structure:
-src/ main + preload + renderer entrypoints (template-provided)
-forge.config.ts packaging/config
-vite.*.config.ts Vite configs for main/preload/renderer

Note: we keep strict boundaries:
-main: email scan orchestration, processing pipeline, printing, storage
-preload: minimal whitelisted bridge API
-renderer: UI only (no filesystem/printing/email directly)

Glossary
-Sale: one completed order extracted from email(s)
-Label profile: ruleset to detect and crop/normalize a specific label layout/carrier
-Normalized label: output ready for printing at 100×150mm