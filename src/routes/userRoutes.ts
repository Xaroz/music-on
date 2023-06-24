import express from 'express';

import userController from '../controllers/userController';
import authController from '../controllers/authController';

import { UserRoles } from '../models/userModel';

const { signUp, login, logout, updatePassword, protect, restrictTo } =
  authController;

const router = express.Router();

// Authentication
router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout', logout);

router.use(protect);
router.patch('/change-password', updatePassword);

router.use(restrictTo(UserRoles.ADMIN));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
