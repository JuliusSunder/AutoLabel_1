# ImageMagick Installation für PDF-Vorschauen

## Warum wird ImageMagick benötigt?

Die App verwendet `pdf2pic` um echte PDF-Vorschauen zu generieren. Dafür wird ImageMagick oder GraphicsMagick benötigt.

## Windows Installation

### Option 1: ImageMagick (Empfohlen)

1. **Download ImageMagick:**
   - Gehen Sie zu: https://imagemagick.org/script/download.php#windows
   - Laden Sie die neueste Windows Binary herunter (z.B. `ImageMagick-7.x.x-x-Q16-HDRI-x64-dll.exe`)

2. **Installation:**
   - Führen Sie das Installationsprogramm aus
   - ✅ **WICHTIG:** Aktivieren Sie die Option "Add application directory to your system path"
   - ✅ **WICHTIG:** Aktivieren Sie "Install legacy utilities (e.g. convert)"
   - Folgen Sie dem Installationsassistenten

3. **Überprüfung:**
   - Öffnen Sie ein neues PowerShell/CMD-Fenster
   - Führen Sie aus: `magick -version`
   - Sie sollten die Version sehen

### Option 2: GraphicsMagick (Alternative)

1. **Download:**
   - Gehen Sie zu: http://www.graphicsmagick.org/download.html
   - Laden Sie die Windows Installer herunter

2. **Installation:**
   - Führen Sie das Installationsprogramm aus
   - Aktivieren Sie "Add to PATH"

3. **Überprüfung:**
   - Öffnen Sie ein neues PowerShell/CMD-Fenster
   - Führen Sie aus: `gm version`

## Nach der Installation

1. **Starten Sie die App neu** oder führen Sie aus:
   ```bash
   cd app
   npm run fresh
   ```

2. Die PDF-Vorschauen sollten jetzt echte Label-Inhalte anzeigen!

## Troubleshooting

### "Failed to generate PDF thumbnail with pdf2pic"

- ImageMagick/GraphicsMagick ist nicht installiert
- Der PATH wurde nicht korrekt gesetzt
- **Lösung:** System neu starten nach Installation

### Vorschauen zeigen nur Platzhalter

- ImageMagick funktioniert nicht korrekt
- **Prüfen Sie:** `magick -version` in PowerShell
- **Lösung:** ImageMagick neu installieren mit "Add to PATH" Option

### Performance-Probleme

- PDF-Rendering kann bei großen Dateien langsam sein
- **Lösung:** In `pdf-thumbnail.ts` die `density` von 200 auf 150 reduzieren (niedrigere Qualität, aber schneller)

## Fallback-System

Wenn ImageMagick nicht verfügbar ist:
- Die App zeigt professionelle Platzhalter-Karten
- Labels können trotzdem vorbereitet und gedruckt werden
- Nur die Vorschau zeigt keinen echten Inhalt

---

**Hinweis:** Die Installation von ImageMagick ist nur einmalig nötig. Danach funktionieren die PDF-Vorschauen automatisch!

