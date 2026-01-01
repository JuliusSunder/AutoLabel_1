# ImageMagick Setup für AutoLabel

## ⚠️ WICHTIG für Production Builds

Dieses Verzeichnis **MUSS** die ImageMagick Portable-Binärdateien enthalten, damit die App nach dem Build funktioniert!

Ohne ImageMagick:
- ❌ Hermes Labels können nicht verarbeitet werden
- ❌ GLS Labels können nicht verarbeitet werden  
- ❌ DHL Labels können nicht verarbeitet werden
- ❌ PDF Thumbnails werden als Platzhalter angezeigt
- ✅ DPD Labels funktionieren (benötigen kein ImageMagick)

---

## Download & Installation (für Build)

### Schritt 1: ImageMagick Portable herunterladen

1. **Besuche:** https://imagemagick.org/script/download.php#windows
2. **Suche nach:** "ImageMagick-7.x.x-portable-Q16-HDRI-x64.zip"
   - Beispiel: `ImageMagick-7.1.1-36-portable-Q16-HDRI-x64.zip`
   - **Wichtig:** Portable Version, nicht Installer!
   - **Wichtig:** Q16-HDRI Variante (beste Kompatibilität)
   - **Wichtig:** x64 (64-bit)

3. **Direktlink (aktuell):**
   ```
   https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-36-portable-Q16-HDRI-x64.zip
   ```

### Schritt 2: Dateien extrahieren

1. Entpacke die heruntergeladene ZIP-Datei
2. Kopiere **ALLE Dateien** aus dem entpackten Ordner in dieses Verzeichnis:
   ```
   app/bin/ImageMagick/
   ```

### Benötigte Dateien (Vollständige Liste):

**Hauptprogramm:**
- ✅ `magick.exe` (ca. 100 KB) - **ERFORDERLICH**

**Core DLLs (alle erforderlich):**
- ✅ `CORE_RL_*.dll` (ca. 15-20 Dateien)
  - Beispiele: `CORE_RL_MagickCore_.dll`, `CORE_RL_MagickWand_.dll`, etc.

**Module DLLs (für PDF-Support erforderlich):**
- ✅ `IM_MOD_*.dll` (ca. 100+ Dateien)
  - Beispiele: `IM_MOD_RL_pdf_.dll`, `IM_MOD_RL_png_.dll`, etc.

**Zusätzliche Dateien:**
- ✅ `colors.xml`, `delegates.xml`, `policy.xml`, etc.
- ✅ Alle weiteren `.xml` und `.txt` Konfigurationsdateien

**Gesamtgröße:** ca. 150-200 MB (entpackt)

### Schritt 3: Verifizierung

Nach dem Kopieren sollte die Struktur so aussehen:

```
app/bin/ImageMagick/
├── README.md                    (diese Datei)
├── magick.exe                   ✅ ERFORDERLICH
├── CORE_RL_MagickCore_.dll      ✅ ERFORDERLICH
├── CORE_RL_MagickWand_.dll      ✅ ERFORDERLICH
├── IM_MOD_RL_pdf_.dll           ✅ ERFORDERLICH (für PDFs)
├── IM_MOD_RL_png_.dll           ✅ ERFORDERLICH (für PNGs)
├── ... (alle anderen DLLs)
└── ... (alle XML/TXT Dateien)
```

**Schnelltest:**
```powershell
# Im app/bin/ImageMagick/ Verzeichnis:
.\magick.exe --version
```

Erwartete Ausgabe:
```
Version: ImageMagick 7.1.1-36 Q16-HDRI x64 ...
```

---

## Build-Prozess

### Wie ImageMagick in den Build eingebunden wird

Die Build-Konfiguration (`app/forge.config.ts`) ist bereits korrekt eingerichtet:

```typescript
extraResource: [
  './bin/SumatraPDF',
  './bin/ImageMagick',  // ← Wird automatisch in Build kopiert
]
```

**Was passiert beim Build:**
1. Electron Forge kopiert `app/bin/ImageMagick/` → `resources/bin/ImageMagick/`
2. Die App sucht zur Laufzeit in dieser Reihenfolge:
   - ✅ **1. Priorität:** `process.resourcesPath/bin/ImageMagick/magick.exe` (Bundled)
   - 2. Priorität: `app.getAppPath()/bin/ImageMagick/magick.exe` (Development)
   - 3. Priorität: System-Installation (`C:\Program Files\ImageMagick-...`)
   - 4. Priorität: System PATH

### Build-Checklist

Vor jedem Production Build:

- [ ] ImageMagick Portable heruntergeladen
- [ ] Alle Dateien nach `app/bin/ImageMagick/` kopiert
- [ ] `magick.exe` vorhanden (ca. 100 KB)
- [ ] Alle `CORE_RL_*.dll` vorhanden (ca. 15-20 Dateien)
- [ ] Alle `IM_MOD_*.dll` vorhanden (ca. 100+ Dateien)
- [ ] `magick.exe --version` funktioniert
- [ ] Build erstellt: `npm run make`
- [ ] Installer-Größe prüfen (sollte ~200 MB größer sein)

### Build testen

Nach dem Build auf einem **frischen System** testen:
1. Installer ausführen
2. App starten
3. Email-Account verbinden
4. Hermes/GLS/DHL Label scannen
5. Verifizieren dass Labels korrekt verarbeitet werden
6. Verifizieren dass Thumbnails angezeigt werden (keine Platzhalter)

---

## Entwicklung (Lokale Installation)

Für die lokale Entwicklung kannst du ImageMagick auch systemweit installieren:

### Option A: Portable Version (empfohlen für Build-Testing)
- Kopiere Dateien wie oben beschrieben nach `app/bin/ImageMagick/`

### Option B: System-Installation (für Development)
1. Download: https://imagemagick.org/script/download.php#windows
2. Installiere "ImageMagick-7.x.x-Q16-HDRI-x64-dll.exe" (Installer)
3. Standard-Pfad: `C:\Program Files\ImageMagick-7.x.x\`
4. Die App findet es automatisch

**Vorteil Option B:** Keine Dateien kopieren nötig, aber Build enthält ImageMagick nicht!

---

## Troubleshooting

### Problem: "ImageMagick nicht gefunden" nach Build

**Ursache:** ImageMagick wurde nicht in den Build eingebunden

**Lösung:**
1. Prüfe ob `app/bin/ImageMagick/magick.exe` existiert
2. Prüfe ob alle DLLs vorhanden sind
3. Build neu erstellen: `npm run make`
4. Prüfe Installer-Größe (sollte ~200 MB größer sein)

### Problem: "magick.exe funktioniert nicht"

**Ursache:** DLLs fehlen oder falsche Version

**Lösung:**
1. Lösche `app/bin/ImageMagick/` komplett
2. Lade ImageMagick Portable neu herunter
3. Kopiere **ALLE** Dateien (nicht nur magick.exe)
4. Teste mit `.\magick.exe --version`

### Problem: "PDF kann nicht konvertiert werden"

**Ursache:** PDF-Module fehlen

**Lösung:**
1. Prüfe ob `IM_MOD_RL_pdf_.dll` vorhanden ist
2. Prüfe ob `delegates.xml` und `policy.xml` vorhanden sind
3. Alle Dateien aus Portable-ZIP kopieren

---

## Lizenz

ImageMagick ist Open Source Software unter der Apache 2.0 Lizenz.

**Offizielle Website:** https://imagemagick.org/  
**Lizenz:** https://imagemagick.org/script/license.php  
**Redistribution:** Erlaubt für kommerzielle und nicht-kommerzielle Zwecke

---

## Weitere Informationen

**Verwendung in AutoLabel:**
- Label-Verarbeitung: `app/src/main/labels/profiles/vinted.ts`
- Thumbnail-Generierung: `app/src/main/labels/pdf-thumbnail.ts`
- Pfad-Suche: `findImageMagick()` Funktionen in beiden Dateien

**Support:**
- Bei Problemen: Logs in der App prüfen (Suche nach "[Thumbnail]" oder "[Vinted Profile]")
- Die App zeigt Fehlermeldungen wenn ImageMagick nicht gefunden wird

