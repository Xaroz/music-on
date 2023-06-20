import express from 'express';

import authController from '../controllers/authController';

const router = express.Router();

const { signUp, login, logout, updatePassword, protect } = authController;

// Authentication
router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout', logout);

router.use(protect);
router.patch('/changePassword', updatePassword);

export default router;