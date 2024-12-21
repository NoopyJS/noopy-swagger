import { Request, Response } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../models/userModel';
import { Swagger } from '@noopyjs/swagger';

class UserController {

    @Swagger({
        path: '/api/users',
        method: 'post',
        summary: 'Add a new user',
        description: 'Creates a new user in the system.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'John Doe' },
                            email: { type: 'string', example: 'john@example.com' },
                        },
                    },
                },
            },
        },
        responses: {
            201: { description: 'Successful response', content: { 'application/json': {} } },
            400: { description: 'Invalid request parameters', content: { 'application/json': {} } },
        },
    })
    addUser(req: Request, res: Response) {
        const { name, email } = req.body;
        const newUser = createUser(name, email);
        res.status(201).json(newUser);
    }

    @Swagger({
        path: '/api/users',
        method: 'get',
        summary: 'Get all users',
        description: 'Returns a list of all users in the system.',
        responses: {
            200: { description: 'Successful response', content: { 'application/json': {} } },
        },
    })
    listUsers(req: Request, res: Response) {
        const users = getUsers();
        res.json(users);
    }

    getUser(req: Request, res: Response) {
        const user = getUserById(Number(req.params.id));
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    }

    modifyUser(req: Request, res: Response) {
        const { name, email } = req.body;
        const user = updateUser(Number(req.params.id), name, email);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    }

    removeUser(req: Request, res: Response) {
        const success = deleteUser(Number(req.params.id));
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    }
}

export default new UserController();