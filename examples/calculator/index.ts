// import {Calculator} from '@noopyjs/swagger';
import * as http from 'http';
import bodyParser from 'body-parser';
// import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUiDist from 'swagger-ui-dist';
import {readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from "url";
import { promises as fsPromises } from 'fs';
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


declare module 'http' {
    interface IncomingMessage {
        params: { [p: string]: string } | null;
    }

    interface ServerResponse {
        send: (content: any) => void;
    }
}

type RequestMethod = 'GET' | 'POST';

interface RouteHandler {
    (req: http.IncomingMessage & { params: { [key: string]: string } }, res: http.ServerResponse): void;
}

interface Routes {
    GET: { [path: string]: RouteHandler };
    POST: { [path: string]: RouteHandler };
}

type Middleware = (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;

class Noopy {
    private readonly routes: Routes;
    private readonly middlewares: Middleware[];

    constructor() {
        this.routes = {
            GET: {},
            POST: {},
        };
        this.middlewares = [];
    }

    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    get(path: string, callback: RouteHandler) {
        this.routes.GET[path] = callback;
    }

    post(path: string, callback: RouteHandler) {
        this.routes.POST[path] = callback;
    }

    private applyMiddlewares(req: http.IncomingMessage, res: http.ServerResponse, callback: () => void) {
        const runNextMiddleware = (index: number) => {
            if (index >= this.middlewares.length) {
                callback();
            } else {
                this.middlewares[index](req, res, () => runNextMiddleware(index + 1));
            }
        };
        runNextMiddleware(0);
    }

    listen(port: number, callback?: () => void) {
        const server = http.createServer((req, res) => {
            res.send = (content: any) => {
                if (typeof content === 'object') {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(content));
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(content);
                }
            };

            const method = req.method as RequestMethod;
            const url = req.url || '';
            let handler: RouteHandler | null = null;
            let params: { [p: string]: string } | null = {};

            if (url === '/swagger.json' && method === 'GET') {
                const swaggerDoc = readFileSync(resolve(__dirname, './swagger.json'), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(swaggerDoc);
                return;
            }

            if (url === '/docs' && method === 'GET') {
                const html = `
                    <!DOCTYPE html>
                    <html lang="fr">
                    <head>
                        <title>Swagger UI</title>
                        <link rel="stylesheet" type="text/css" href="/swagger-ui.css">
                        <script src="/swagger-ui-bundle.js"></script>
                        <script src="/swagger-ui-standalone-preset.js"></script>
                    </head>
                    <body>
                        <div id="swagger-ui"></div>
                        <script>
                            window.onload = () => {
                                window.ui = SwaggerUIBundle({
                                    url: "/swagger.json",
                                    dom_id: '#swagger-ui',
                                    deepLinking: true,
                                    presets: [
                                        SwaggerUIBundle.presets.apis,
                                        SwaggerUIStandalonePreset
                                    ],
                                    plugins: [
                                        SwaggerUIBundle.plugins.DownloadUrl
                                    ],
                                    layout: "StandaloneLayout"
                                });
                            }
                        </script>
                    </body>
                    </html>
                `;
                res.setHeader('Content-Type', 'text/html');
                res.end(html);
                return;
            }

            if (url === '/swagger-ui.css' && method === 'GET') {
                const cssPath = resolve(swaggerUiDist.absolutePath(), 'swagger-ui.css');
                const css = readFileSync(cssPath);
                res.setHeader('Content-Type', 'text/css');
                res.end(css);
                return;
            }

            const serveFile = (path: string, type: string, res: http.ServerResponse) => {
                fs.readFile(path, (err, data) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': type });
                        res.end(data);
                    }
                });
            };

            if (url === '/swagger-ui-bundle.js' && method === 'GET') {
                const jsPath = resolve(swaggerUiDist.absolutePath(), 'swagger-ui-bundle.js');
                console.log(jsPath);
                serveFile(jsPath, 'application/javascript', res);
                return;
            }

            if (url === '/swagger-ui-standalone-preset.js' && method === 'GET') {
                const jsPath = resolve(swaggerUiDist.absolutePath(), 'swagger-ui-standalone-preset.js');
                const js = readFileSync(jsPath);
                res.setHeader('Content-Type', 'application/javascript');
                console.log('Serving swagger-ui-standalone-preset.js');
                res.end(js);
                return;
            }

            if (url === '/swagger-initializer.js' && method === 'GET') {
                const jsPath = resolve(swaggerUiDist.absolutePath(), 'swagger-initializer.js');
                console.log('Initializer PATH ==========', jsPath);
                const js = readFileSync(jsPath, 'utf-8');
                res.setHeader('Content-Type', 'application/javascript');
                console.log('Serving swagger-initializer.js');
                res.end(js);
                return;
            }

            for (const route in this.routes[method]) {
                params = this.matchRoute(url, route);
                if (params) {
                    handler = this.routes[method][route];
                    break;
                }
            }

            if (!handler) {
                res.statusCode = 404;
                res.send({message: '404 - Not Found', code: 404});
                return;
            }

            req.params = params;

            this.applyMiddlewares(req, res, () => {
                handler(req as any, res);
            });
        });
        server.listen(port, callback);
    }

    private matchRoute(url: string, route: string): { [key: string]: string } | null {
        const paramNames: string[] = [];
        const regexPath = route.replace(/:(\w+)/g, (full, paramName) => {
            paramNames.push(paramName);
            return '([^\\/]+)';
        });
        const regex = new RegExp(`^${regexPath}$`);
        const match = url.match(regex);

        if (!match) {
            return null;
        }

        const params: { [key: string]: string } = {};
        paramNames.forEach((paramName, index) => {
            params[paramName] = match[index + 1];
        });

        return params;
    }
}

export default Noopy;


const noopy = new Noopy();
noopy.use(bodyParser.json());
noopy.use(bodyParser.urlencoded({extended: true}));

noopy.get('/', (req, res) => {
    res.send('Hello World');
});

noopy.get('/calculator', (req, res) => {
    res.send('This is a calculator');
});

noopy.listen(3000, () => {
    console.log('Server is running on port 3000');
});

