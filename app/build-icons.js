/**
 * Icon Generator for AutoLabel
 * Generates Windows .ico and macOS .icns from source logo
 * 
 * Run: node build-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');

// Paths
const LOGO_SOURCE = path.join(__dirname, '..', 'website', 'public', 'logo', 'logo.png');
const ICONS_DIR = path.join(__dirname, 'icons');

// Icon sizes needed
const WINDOWS_SIZES = [256, 128, 64, 48, 32, 16];
const MACOS_SIZES = [512, 256, 128, 64, 32, 16];

async function generateIcons() {
  console.log('🎨 AutoLabel Icon Generator\n');
  
  // Verify source logo exists
  if (!fs.existsSync(LOGO_SOURCE)) {
    console.error('❌ Logo source not found:', LOGO_SOURCE);
    process.exit(1);
  }
  
  // Create icons directory
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log('✓ Created icons directory');
  }
  
  // Load source image
  const logoBuffer = fs.readFileSync(LOGO_SOURCE);
  const logoMetadata = await sharp(logoBuffer).metadata();
  const hasTransparency = logoMetadata.hasAlpha || logoMetadata.channels === 4;
  console.log(`✓ Loaded logo: ${logoMetadata.width}x${logoMetadata.height}px`);
  console.log(`  Channels: ${logoMetadata.channels} (${hasTransparency ? '✓ Has transparency' : '✗ No transparency'})\n`);
  
  // Generate PNG icons for all sizes (used for both Windows and macOS)
  console.log('Generating PNG icons...');
  const allSizes = [...new Set([...WINDOWS_SIZES, ...MACOS_SIZES])].sort((a, b) => b - a);
  const pngBuffers = [];
  
  for (const size of allSizes) {
    const outputPath = path.join(ICONS_DIR, `icon_${size}x${size}.png`);
    const pngBuffer = await sharp(logoBuffer)
      .ensureAlpha() // Stelle sicher, dass Alpha-Kanal vorhanden ist
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparenter Hintergrund
      })
      .png({ 
        force: true, // Erzwinge PNG-Format mit Alpha-Kanal
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toBuffer();
    
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`  ✓ ${size}x${size}px`);
    
    // Collect PNG buffers for ICO generation (only Windows sizes)
    if (WINDOWS_SIZES.includes(size)) {
      pngBuffers.push(pngBuffer);
    }
  }
  
  // Generate Windows .ico file
  console.log('\nGenerating Windows .ico file...');
  try {
    const icoBuffer = await toIco(pngBuffers);
    const icoPath = path.join(ICONS_DIR, 'icon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`  ✓ icon.ico created`);
  } catch (err) {
    console.warn(`  ⚠ Warning: Could not generate .ico file: ${err.message}`);
  }
  
  console.log('\nIcon generation complete!\n');
  console.log('Generated files:');
  console.log(`  ${ICONS_DIR}/icon_*.png`);
  console.log(`  ${ICONS_DIR}/icon.ico`);
  console.log('\nNext steps:');
  console.log('  1. Update forge.config.ts with icon paths');
  console.log('  2. Run: npm run make');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});

