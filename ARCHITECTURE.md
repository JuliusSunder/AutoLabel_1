 AutoLabel Architecture

Goal: keep this short and unambiguous so humans + Cursor agents don’t confuse process boundaries.

## Product flow (MVP)
1) User opens app → clicks **Scan**
2) Main scans mailbox (on-demand only) and extracts:
   - sale metadata (date, item info, identifiers)
   - label attachments (PDF/images)
3) UI shows sales grouped by date (history)
4) User selects sales for a day → **Prepare labels**
5) Main pipeline:
   - detect label profile → crop/normalize → render **100×150mm**
   - apply footer overlay (user-selected fields)
6) User starts batch print → main prints via OS printer drivers
7) “Mark as shipped” is not MVP (only later if safe/official)

## Non-negotiables
- No background scanning
- Default output size: **100×150mm (4×6")**
- Local-first by default
- Renderer has no direct access to:
  - filesystem
  - printing
  - email credentials / mailbox access

## Processes & responsibilities

### Main process (trusted)
Owns:
- Email scanning + provider connectors
- Attachment decoding (PDF/image)
- Label processing pipeline (profiles, crop, render, footer)
- Local storage (history, cache)
- Printing + print queue
- Logging

### Preload (bridge)
Owns:
- A minimal `window.autolabel.*` API via `contextBridge`
- Validation + typed IPC wrappers
Contains no business logic.

### Renderer (UI)
Owns:
- Date-grouped sales list + selection
- Footer field toggles
- Label preview (optional)
- Print queue UI (status/progress)
No OS-level access.

## IPC principles
- Keep IPC methods small and explicit (no “doEverything”)
- Typed payloads and explicit error messages
- Never return secrets to renderer

Suggested IPC surface (MVP idea)
- `scan.start() -> { scannedCount }`
- `sales.list({ from, to }) -> Sale[]`
- `labels.prepare({ saleIds, footerConfig }) -> PreparedLabel[]`
- `print.start({ preparedLabelIds, printerName? }) -> PrintJob`
- `print.status({ jobId }) -> PrintJobStatus`

## Data model (MVP)
- `Sale`: id, platform, date, itemTitle?, productNumber?, buyerRef?, attachments[]
- `Attachment`: type (pdf|image), localPath, sourceEmailId
- `PreparedLabel`: id, saleId, profileId, outputPath, sizeMm=100x150, footerApplied
- `PrintJob`: id, printerName, items[], status, errors[]

Storage: keep it simple (JSON or SQLite). Must support dedupe + history.

## Label processing (profiles)
Labels vary heavily (full-page A4, QR-only, multi-part pages, etc.).
We use **profiles**:
- Detect by page size + known markers (logos/text)
- Crop/normalize by profile rules
- Render output as a fixed 100×150mm page at controlled DPI
- Apply footer overlay with selected metadata fields

MVP ships only a small set of profiles and expands later.

## Printing
- Print via OS printer drivers (Windows/macOS).
- Works with common label printers as long as they appear as a standard printer in OS settings.
- Maintain a print queue with retryable failures.

## Electron security notes (do not weaken)
- Keep `contextIsolation` enabled
- Keep renderer `nodeIntegration` disabled
- Only expose a minimal, whitelisted API through preload