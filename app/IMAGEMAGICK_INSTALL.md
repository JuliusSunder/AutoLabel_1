# ImageMagick Installation für PDF-Vorschauen (Optional)

## Neue Hybrid-Lösung ✨

**Gute Nachricht:** Die App funktioniert jetzt **ohne ImageMagick**!

Die App verwendet ein intelligentes **Hybrid-System** für PDF-Vorschauen:
1. **Mit ImageMagick + Ghostscript:** Beste Qualität (empfohlen für Produktion)
2. **Ohne externe Tools:** Verwendet PDF.js - funktioniert automatisch ohne Installation

## Warum ImageMagick trotzdem installieren?

ImageMagick + Ghostscript bieten die **höchste Rendering-Qualität** für PDF-Vorschauen. Die Installation ist optional, aber empfohlen für beste Ergebnisse.

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

## Hybrid Fallback-System

Die App verwendet einen intelligenten 3-stufigen Fallback:
1. **ImageMagick + Ghostscript** (beste Qualität) → Falls verfügbar
2. **PDF.js Canvas Renderer** (gute Qualität) → Automatischer Fallback
3. **Platzhalter** (Info-Karte) → Nur bei Fehlern

**✅ Ergebnis:** PDF-Vorschauen zeigen **immer** den echten Inhalt, auch ohne Installation!

---

**Hinweis:** Die Installation von ImageMagick ist optional. PDF-Vorschauen funktionieren auch ohne externe Tools dank PDF.js!

