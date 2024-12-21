import {Calculator} from "@noopyjs/swagger";
import {Swagger} from "@noopyjs/swagger";

class TestController {
    constructor(private calculator: Calculator) {
    }

    @Swagger({
        path: '/api/test',
        method: 'post',
        summary: 'Add two numbers',
        description: 'Returns the sum of two numbers.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            a: { type: 'integer' },
                            b: { type: 'integer' }
                        },
                        required: ['a', 'b']
                    }
                }
            }
        },
        responses: {
            '200': { description: 'Successful response', content: { 'application/json': {} } },
        },
    })
    add(data: { a: number, b: number }): number {
        const { a, b } = data;
        return this.calculator.add(a, b);
    }
}