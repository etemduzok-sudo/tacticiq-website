import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.json'],
  build: {
    // Chunk boyutu uyarı sınırı
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manuel chunk'lar - vendor kütüphanelerini ayır
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          // UI kütüphaneleri
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // MUI kütüphaneleri
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Grafik ve chart kütüphaneleri
          'vendor-charts': ['recharts'],
          // Animasyon kütüphaneleri
          'vendor-motion': ['motion'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Diğer yardımcı kütüphaneler
          'vendor-utils': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'sonner',
            'lucide-react',
          ],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
})