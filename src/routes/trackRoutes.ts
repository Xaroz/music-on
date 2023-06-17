import express from 'express';

import trackController from '../controllers/trackController';

const router = express.Router();

router
  .route('/')
  .get(trackController.getAllTracks)
  .post(trackController.createTrack);

router
  .route('/:id')
  .get(trackController.getTrack)
  .patch(trackController.updateTrack)
  .delete(trackController.deleteTrack);

export default router;
