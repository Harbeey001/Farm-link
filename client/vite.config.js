import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),

        VitePWA({
    registerType: 'autoUpdate',

    devOptions: {
    enabled: false,
},

    manifest: {
        name: 'FarmLink',
        short_name: 'FarmLink',
        description:
            'A marketplace connecting farmers and buyers directly.',
        theme_color: '#198754',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
            {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    },
}),
    ],
});