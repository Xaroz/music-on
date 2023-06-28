import express from 'express';

import authController from '../controllers/authController';
import genreController from '../controllers/genreController';

import { UserRoles } from '../models/userModel';

const router = express.Router();

router
  .route('/')
  .get(genreController.getAllGenres)
  .post(
    authController.protect,
    authController.restrictTo(UserRoles.ADMIN),
    genreController.createGenre
  );

router
  .route('/:id')
  .get(genreController.getGenre)
  .patch(
    authController.protect,
    authController.restrictTo(UserRoles.ADMIN),
    genreController.updateGenre
  )
  .delete(
    authController.protect,
    authController.restrictTo(UserRoles.ADMIN),
    genreController.deleteGenre
  );

export default router;
