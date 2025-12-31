# 🎨 AutoLabel Website - Favicon Setup

## ✅ Implementierung abgeschlossen

Die AutoLabel-Website verwendet jetzt das offizielle Logo als Favicon in allen gängigen Browsern und Plattformen.

## 📦 Was wurde implementiert?

### 1. Favicon-Dateien
Alle Favicon-Größen wurden aus dem Logo (`public/logo/logo.png`) generiert:

**Generierte Dateien** (in `app/`):
- `favicon.ico` - Standard-Browser-Icon (32×32px)
- `favicon-16x16.png` - Kleine Browser-Tabs
- `favicon-32x32.png` - Standard-Browser-Tabs
- `apple-touch-icon.png` - iOS/Safari (180×180px)
- `icon-192.png` - Android/Chrome (192×192px)
- `icon-512.png` - PWA/High-Resolution (512×512px)

### 2. Next.js Metadata
Die `app/layout.tsx` wurde mit vollständiger Favicon-Konfiguration erweitert:

```typescript
icons: {
  icon: [
    { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  apple: [
    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
  shortcut: '/favicon.ico',
}
```

### 3. Build-Script
Ein automatisiertes Script (`build-favicons.js`) wurde erstellt, um Favicons aus dem Logo zu generieren.

## 🚀 Verwendung

### Favicons neu generieren
Falls das Logo aktualisiert wird:

```bash
cd website
node build-favicons.js
```

Das Script:
- Lädt das Logo aus `public/logo/logo.png`
- Generiert alle benötigten Größen
- Speichert sie in `app/` (Next.js App-Verzeichnis)
- Behält transparenten Hintergrund bei

### Development
```bash
cd website
npm run dev
```

Öffne `http://localhost:3000` und prüfe das Browser-Tab-Icon.

### Production Build
```bash
cd website
npm run build
npm start
```

## 🎯 Browser-Unterstützung

### Desktop-Browser
- ✅ **Chrome/Edge**: Verwendet `favicon-32x32.png`
- ✅ **Firefox**: Verwendet `favicon-32x32.png`
- ✅ **Safari**: Verwendet `favicon-32x32.png`

### Mobile Browser
- ✅ **iOS Safari**: Verwendet `apple-touch-icon.png` (180×180px)
- ✅ **Android Chrome**: Verwendet `icon-192.png` (192×192px)

### PWA (Progressive Web App)
- ✅ **App-Icon**: Verwendet `icon-512.png` (512×512px)
- ✅ **Splash Screen**: Verwendet `icon-512.png`

## 📝 Technische Details

### Logo-Eigenschaften
- **Quelle**: `public/logo/logo.png`
- **Original-Größe**: 1024×1040px
- **Hintergrund**: Transparent
- **Farben**: Schwarz (#000000) + Dunkelgrün (#1a5f3f)
- **Design**: "AL" Monogramm

### Sharp-Konfiguration
```javascript
await sharp(LOGO_PATH)
  .resize(size, size, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent
  })
  .png()
  .toFile(outputPath);
```

### Next.js Metadata API
Next.js 14+ verwendet die neue Metadata API:
- Automatisches Caching
- Optimierte Auslieferung
- SEO-freundlich
- TypeScript-Unterstützung

## 🔍 Testen

### Browser-Tab-Icon
1. Öffne die Website in verschiedenen Browsern
2. Prüfe das Icon im Browser-Tab
3. Erstelle ein Lesezeichen und prüfe das Icon

### Mobile
1. Öffne die Website auf dem Smartphone
2. "Zum Homescreen hinzufügen"
3. Prüfe das App-Icon auf dem Homescreen

### PWA
1. Installiere die Website als PWA
2. Prüfe das App-Icon im App-Drawer
3. Prüfe den Splash-Screen beim Start

## 📚 Weiterführende Dokumentation

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Web App Manifest Icons](https://developer.mozilla.org/en-US/docs/Web/Manifest/icons)
- [Apple Touch Icons](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

## ✨ Ergebnis

Nach dem Deployment zeigt die AutoLabel-Website:
- ✅ AutoLabel-Logo im Browser-Tab (statt Vercel-Icon)
- ✅ AutoLabel-Logo in Lesezeichen
- ✅ AutoLabel-Logo auf iOS-Homescreen
- ✅ AutoLabel-Logo auf Android-Homescreen
- ✅ AutoLabel-Logo in PWA-Installation

