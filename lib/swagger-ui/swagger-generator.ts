import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// Interface for Swagger Metadata
interface SwaggerMetadata {
    path: string;
    method: string;
    summary?: string;
    description?: string;
    responses?: Record<number, any>;
}

function findControllerFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            // Recurse into subdirectories
            results = results.concat(findControllerFiles(file));
        } else if (file.endsWith('.controller.ts')) {
            // Collect .controller.ts files
            results.push(file);
        }
    });
    return results;
}

// Function to analyze TypeScript files and extract @Swagger decorators
function analyzeSwaggerDecorators(filePaths: string[]): any {
    const swaggerDoc: any = {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
        },
        paths: {},
    };

    // Parse each file
    filePaths.forEach((filePath) => {
        const program = ts.createProgram([filePath], {});
        const sourceFile = program.getSourceFile(filePath);

        if (!sourceFile) return;

        ts.forEachChild(sourceFile, (node) => {
            if (ts.isClassDeclaration(node)) {
                // Check each member of the class (methods)
                node.members.forEach((member) => {
                    if (ts.isMethodDeclaration(member)) {
                        const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;
                        // Extract decorator metadata
                        if (decorators) {
                            decorators.forEach((decorator: any) => {
                                const expression = decorator.expression;

                                // Check if it's @Swagger decorator
                                if (
                                    ts.isCallExpression(expression) &&
                                    ts.isIdentifier(expression.expression) &&
                                    expression.expression.text === 'Swagger'
                                ) {
                                    // Extract the object passed to @Swagger
                                    const metadata = extractMetadata(expression.arguments[0]);
                                    if (metadata) {
                                        const {path, method, ...rest} = metadata;

                                        // Build the Swagger paths structure
                                        if (!swaggerDoc.paths[path]) {
                                            swaggerDoc.paths[path] = {};
                                        }
                                        swaggerDoc.paths[path][method] = rest;
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    return swaggerDoc;
}

// Function to extract key-value pairs from the decorator's object argument
function extractMetadata(argument: ts.Expression): SwaggerMetadata | null {
    if (!ts.isObjectLiteralExpression(argument)) return null;

    const metadata: any = {};

    argument.properties.forEach((property) => {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
            const key = property.name.text;
            const value = getLiteralValue(property.initializer);
            metadata[key] = value;
        }
    });

    return metadata;
}

function getLiteralValue(node: ts.Expression): any {
    if (ts.isStringLiteral(node)) {
        return node.text;
    } else if (ts.isNumericLiteral(node)) {
        return Number(node.text);
    } else if (ts.isObjectLiteralExpression(node)) {
        const obj: any = {};
        node.properties.forEach((prop) => {
            if (ts.isPropertyAssignment(prop) && prop.name) {
                const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)
                    ? prop.name.text
                    : undefined;

                if (key !== undefined) { // Ensure key is defined
                    const value = getLiteralValue(prop.initializer);
                    obj[key] = value;
                }
            }
        });
        return obj;
    } else if (ts.isArrayLiteralExpression(node)) {
        return node.elements.map(getLiteralValue);
    }
    return null;
}

// Paths to analyze (add your TypeScript controller paths here)
const pwd = process.cwd();
const __dirname = path.join(pwd, '/src');
const filesToAnalyze = findControllerFiles(path.join(pwd, '/src'));

// Generate Swagger JSON
const swaggerDoc = analyzeSwaggerDecorators(filesToAnalyze);

// Write to swagger.json
fs.writeFileSync(
    path.join(__dirname, '../swagger.json'),
    JSON.stringify(swaggerDoc, null, 2)
);

console.log('✅ swagger.json generated successfully!');
