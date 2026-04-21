import express from 'express';
import * as authController from '../controllers/auth.controllers';
import { authMiddleware } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/users', authMiddleware, isAdmin, authController.getAllUsers);
router.get('/users/:id', authMiddleware, isAdmin, authController.getUserById);
router.put('/users/:id', authMiddleware, isAdmin, authController.updateUser);
router.delete('/users/:id', authMiddleware, isAdmin, authController.deleteUser);

export default router;
