import { defineConfig, loadEnv } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    // Load env file from project root (parent directory) where .env is located
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const projectRoot = resolve(__dirname, '..');
    const env = loadEnv(mode, projectRoot, '');

    const backendPort = process.env.BACKEND_PORT || env.BACKEND_PORT || '3000';
    const frontendPort = process.env.FRONTEND_PORT || env.FRONTEND_PORT || '8095';

    return {
        plugins: [solid()],
        server: {
            port: parseInt(frontendPort),
            proxy: {
                '/api': {
                    target: `http://localhost:${backendPort}`,
                    changeOrigin: true,
                },
            },
        },
    };
});
