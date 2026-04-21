import express from 'express';
import * as authController from '../controllers/auth.controllers';
import { isAdmin } from '../middleware/role.middleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/users', isAdmin, authController.getAllUsers);
router.delete('/users/:id', isAdmin, authController.deleteUser);

export default router;