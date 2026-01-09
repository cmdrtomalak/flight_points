import { defineConfig, loadEnv } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

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
