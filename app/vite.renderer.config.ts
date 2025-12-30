import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Expose environment variables to renderer process
    'import.meta.env.VITE_WEBSITE_URL': JSON.stringify(
      process.env.VITE_WEBSITE_URL || process.env.WEBSITE_URL || 'http://localhost:3000'
    ),
  },
});
