import { Router } from 'express';
import userController from '../controllers/user.controller';

const router = Router();

router.post('/', userController.addUser.bind(userController));
router.get('/', userController.listUsers.bind(userController));
router.get('/:id', userController.getUser.bind(userController));
router.put('/:id', userController.modifyUser.bind(userController));
router.delete('/:id', userController.removeUser.bind(userController));

export default router;