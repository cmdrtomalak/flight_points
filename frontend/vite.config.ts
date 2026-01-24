import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [solid()],
    root: resolve(__dirname),
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
