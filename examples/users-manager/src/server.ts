import app from './app.js';
import config from 'config';
import * as fs from 'fs';
import * as path from 'path';
import swaggerUiDist from 'swagger-ui-dist';
import express from "express";

const PORT = config.get('Customer.server.port');

const swaggerJsonPath = path.join(__dirname, '../swagger.json');

app.get('/api-docs', (req, res) => {
    const swaggerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Swagger UI</title>
        <link rel="stylesheet" href="/api-docs/swagger-ui.css">
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="/api-docs/swagger-ui-bundle.js"></script>
        <script src="/api-docs/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = () => {
                window.ui = SwaggerUIBundle({
                    url: '/swagger.json',
                    dom_id: '#swagger-ui',
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    layout: "StandaloneLayout"
                });
            };
        </script>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(swaggerHtml);
});

app.use('/api-docs', express.static(swaggerUiDist.getAbsoluteFSPath()));

app.get('/swagger.json', (req, res) => {
    fs.readFile(swaggerJsonPath, 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Error loading swagger.json');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(data);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});