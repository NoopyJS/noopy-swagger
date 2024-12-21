import 'reflect-metadata';
import {SwaggerMetadata} from "../interfaces/swagger-metadata.interface";

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
