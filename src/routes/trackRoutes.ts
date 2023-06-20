import express from 'express';
import multer from 'multer';
import { uploadToS3 } from '../utils/uploadFile';

import trackController from '../controllers/trackController';

const router = express.Router();

router
  .route('/')
  .get(trackController.getAllTracks)
  .post(
    multer().fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'url', maxCount: 1 },
    ]),
    trackController.validateBeforeUpload,
    uploadToS3,
    trackController.createTrack
  );

router
  .route('/:id')
  .get(trackController.getTrack)
  .patch(trackController.updateTrack)
  .delete(trackController.deleteTrack);

export default router;
