import { defineConfig } from 'vite';
import 'dotenv/config';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        // Native modules that should not be bundled
        'sharp',
        'better-sqlite3',
        'imap',
        'mailparser',
        'canvas',
        'pdfjs-dist',
        'pdfjs-dist/legacy/build/pdf.mjs',
        // electron-store is bundled (no native dependencies)
      ],
    },
  },
  define: {
    // Make environment variables available in main process
    'process.env.WEBSITE_URL': JSON.stringify(
      process.env.WEBSITE_URL || process.env.VITE_WEBSITE_URL || 'http://localhost:3000'
    ),
  },
});
