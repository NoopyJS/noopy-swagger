import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import swaggerUiDist from 'swagger-ui-dist';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const swaggerJsonPath = path.join(__dirname, '/swagger.json');

const swaggerUiPath = swaggerUiDist.getAbsoluteFSPath();

const PORT = 3000;

/**
 * Utility to serve static files.
 * @param filePath - Full path to the file
 * @param res - HTTP response object
 * @param contentType - MIME type of the file
 */
function serveStaticFile(
    filePath: string,
    res: http.ServerResponse,
    contentType: string
): void {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

/**
 * Main HTTP server to handle routes.
 */
const server = http.createServer((req, res) => {
    const { url, method } = req;

    if (url === '/api-docs' || url === '/api-docs/') {
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
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(swaggerHtml);
    }
    else if (url?.startsWith('/api-docs')) {
        const filePath = path.join(swaggerUiPath, url.replace('/api-docs/', ''));
        const ext = path.extname(filePath);
        const mimeTypes: { [key: string]: string } = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.svg': 'image/svg+xml',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        serveStaticFile(filePath, res, contentType);
    }
    else if (url === '/swagger.json') {
        fs.readFile(swaggerJsonPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading swagger.json');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    }
    else if (url === '/api/hello' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Hello, World!' }));
    }
    else if (url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
      <h1>Welcome to My Custom Swagger API</h1>
      <p>Visit <a href="/api-docs">Swagger UI</a></p>
    `);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
