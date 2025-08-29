module.exports = {
    apps: [
        {
            name: "api-gateway",
            script: "./index.js",
            env: {
                PORT: 3000,
                IDENTITY_SERVICE_URL: "http://localhost:3001",
                POST_SERVICE_URL: "http://localhost:3002",
                MEDIA_SERVICE_URL: "http://localhost:3003"
            }
        }
    ]
}
