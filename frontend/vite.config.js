import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [
        // React and Tailwind plugins are required for this project setup.
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // File types to support raw imports. Never add .css, .tsx, or .ts files here.
    assetsInclude: ['**/*.svg', '**/*.csv'],
});
