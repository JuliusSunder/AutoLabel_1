import { defineConfig } from 'vite';

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
      ],
    },
  },
});
