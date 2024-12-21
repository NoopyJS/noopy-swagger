import ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import {SwaggerMetadata} from "../interfaces/swagger-metadata.interface.js";

function findControllerFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(findControllerFiles(file));
        } else if (file.endsWith('.controller.ts')) {
            results.push(file);
        }
    });
    return results;
}

function analyzeSwaggerDecorators(filePaths: string[]): any {
    const swaggerDoc: any = {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
        },
        paths: {},
    };

    filePaths.forEach((filePath) => {
        const program = ts.createProgram([filePath], {});
        const sourceFile = program.getSourceFile(filePath);

        if (!sourceFile) return;

        ts.forEachChild(sourceFile, (node) => {
            if (ts.isClassDeclaration(node)) {
                node.members.forEach((member) => {
                    if (ts.isMethodDeclaration(member)) {
                        const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;
                        if (decorators) {
                            decorators.forEach((decorator: any) => {
                                const expression = decorator.expression;

                                if (
                                    ts.isCallExpression(expression) &&
                                    ts.isIdentifier(expression.expression) &&
                                    expression.expression.text === 'Swagger'
                                ) {
                                    const metadata = extractMetadata(expression.arguments[0]);
                                    if (metadata) {
                                        const {path, method, ...rest} = metadata;

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

function extractMetadata(argument: ts.Expression): SwaggerMetadata | null {
    if (!ts.isObjectLiteralExpression(argument)) return null;

    const metadata: any = {};

    argument.properties.forEach((property) => {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
            const key = property.name.text;
            metadata[key] = getLiteralValue(property.initializer);
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

                if (key !== undefined) {
                    obj[key] = getLiteralValue(prop.initializer);
                }
            }
        });
        return obj;
    } else if (ts.isArrayLiteralExpression(node)) {
        return node.elements.map(getLiteralValue);
    }
    return null;
}

const pwd = process.cwd();
const __dirname = path.join(pwd, '/src');
const filesToAnalyze = findControllerFiles(path.join(pwd, '/src'));

const swaggerDoc = analyzeSwaggerDecorators(filesToAnalyze);

fs.writeFileSync(
    path.join(__dirname, '../swagger.json'),
    JSON.stringify(swaggerDoc, null, 2)
);

console.log('✅ swagger.json generated successfully!');
