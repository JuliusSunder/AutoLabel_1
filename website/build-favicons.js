/**
 * Favicon Generator für AutoLabel Website
 * 
 * Generiert verschiedene Favicon-Größen aus dem Logo für optimale Browser-Kompatibilität:
 * - favicon.ico (32x32) - Standard-Browser-Icon
 * - apple-touch-icon.png (180x180) - iOS/Safari
 * - icon-192.png (192x192) - Android/Chrome
 * - icon-512.png (512x512) - PWA
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, 'public', 'logo', 'logo.png');
const OUTPUT_DIR = path.join(__dirname, 'app');

// Favicon-Größen für verschiedene Plattformen
const SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

async function generateFavicons() {
  console.log('🎨 Generiere Favicons für AutoLabel Website...\n');

  // Prüfe ob Logo existiert
  if (!fs.existsSync(LOGO_PATH)) {
    console.error(`❌ Logo nicht gefunden: ${LOGO_PATH}`);
    process.exit(1);
  }

  // Erstelle Output-Verzeichnis falls nicht vorhanden
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    // Lade Logo-Informationen
    const logoInfo = await sharp(LOGO_PATH).metadata();
    console.log(`📸 Logo geladen: ${logoInfo.width}×${logoInfo.height}px\n`);

    // Generiere alle Größen
    for (const { size, name } of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      await sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparenter Hintergrund
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}×${size}px)`);
    }

    // Generiere favicon.ico (32x32)
    const faviconPath = path.join(OUTPUT_DIR, 'favicon.ico');
    await sharp(LOGO_PATH)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png() // Sharp kann nicht direkt .ico erstellen, aber Browser akzeptieren .png als .ico
      .toFile(faviconPath);
    
    console.log(`✅ favicon.ico (32×32px)`);

    console.log('\n✨ Alle Favicons erfolgreich generiert!');
    console.log(`📁 Speicherort: ${OUTPUT_DIR}`);
    console.log('\n📝 Nächster Schritt: Aktualisiere app/layout.tsx mit den neuen Favicon-Pfaden');

  } catch (error) {
    console.error('❌ Fehler beim Generieren der Favicons:', error);
    process.exit(1);
  }
}

// Script ausführen
generateFavicons();

