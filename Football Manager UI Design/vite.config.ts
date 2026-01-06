import { defineConfig } from 'vite';

// This is a placeholder config for Figma Make compatibility
// This React Native project does NOT use Vite and won't run in Figma Make
// Download the project and run it with Expo instead

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
  // No plugins - this prevents Tailwind/Vite errors
  plugins: [],
});
