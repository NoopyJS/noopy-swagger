import 'reflect-metadata';

interface SwaggerMetadata {
    path: string;
    method: string;
    summary?: string;
    description?: string;
    requestBody?: {
        required: boolean;
        content: {
            [contentType: string]: {
                schema: {
                    type: string;
                    properties: Record<string, { type: string, example: string }>;
                    required?: string[];
                }
            }
        }
    };
    parameters?: Record<string, any>[];
    responses?: Record<string, any>;
}

export function Swagger(metadata: SwaggerMetadata) {
    return function (target: any, propertyKey: string) {
        const existingMetadata =
            Reflect.getMetadata('swagger:endpoints', target.constructor) || [];

        existingMetadata.push({
            propertyKey,
            metadata,
        });

        Reflect.defineMetadata('swagger:endpoints', existingMetadata, target.constructor);
    };
}
