require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'flight-points',
            cwd: './',
            script: 'bun',
            args: 'run start',
            env: {
                BACKEND_PORT: process.env.BACKEND_PORT || 3003,
            },
            watch: false,
            autorestart: true,
        },
    ],
};
