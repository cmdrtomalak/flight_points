module.exports = {
    apps: [
        {
            name: 'flight-points-backend',
            cwd: './',
            script: 'bun',
            args: 'run dev',
            env: {
                BACKEND_PORT: process.env.BACKEND_PORT || 3000,
                FRONTEND_PORT: process.env.FRONTEND_PORT || 8095,
            },
            watch: false,
            autorestart: true,
        },
        {
            name: 'flight-points-frontend',
            cwd: './frontend',
            script: 'bun',
            args: 'run dev',
            env: {
                BACKEND_PORT: process.env.BACKEND_PORT || 3000,
                FRONTEND_PORT: process.env.FRONTEND_PORT || 8095,
            },
            watch: false,
            autorestart: true,
        },
    ],
};
