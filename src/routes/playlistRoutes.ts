import express from 'express';

import authController from '../controllers/authController';
import playlistController from '../controllers/playlistController';

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(playlistController.getAllPlaylists)
  .post(authController.setCreatedBy, playlistController.createPlaylist);

router
  .route('/:id')
  .get(playlistController.getPlaylist)
  .patch(playlistController.updatePlaylist)
  .delete(playlistController.deletePlaylist);

export default router;
