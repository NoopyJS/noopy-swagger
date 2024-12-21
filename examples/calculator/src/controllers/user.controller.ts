import { Swagger } from '@noopyjs/swagger';

class UserController {
    @Swagger({
        path: '/api/users',
        method: 'get',
        summary: 'Get all users',
        description: 'Returns a list of all users in the system.',
        responses: {
            '200': { description: 'Successful response', content: { 'application/json': {} } },
        },
    })
    getAllUsers() {
        // Logique pour récupérer les utilisateurs
    }

    @Swagger({
        path: '/api/users/:id',
        method: 'get',
        summary: 'Get a user by ID',
        responses: {
            '200': { description: 'Successful response' },
            '404': { description: 'User not found' },
        },
    })
    getUserById() {
        // Logique pour récupérer un utilisateur par ID
    }
}
