import express from 'express';

import authController from '../controllers/authController';

const { signUp, login, logout, updatePassword, protect } = authController;

const router = express.Router();

// Authentication
router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout', logout);

router.use(protect);
router.patch('/change-password', updatePassword);

export default router;
