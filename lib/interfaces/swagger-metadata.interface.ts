export interface SwaggerMetadata {
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