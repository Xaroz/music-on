import express from 'express';

import userController from '../controllers/userController';
import authController from '../controllers/authController';

const router = express.Router();

const { signUp, login, logout } = authController;

// Authentication
router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout', logout);

// CRUD
router.post('/', userController.createUser);

export default router;