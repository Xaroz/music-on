import express from 'express';

import trackController from '../controllers/trackController';

const router = express.Router();

router
  .route('/')
  .get(trackController.getAllTracks)
  .post(
    trackController.multerUploadFields,
    trackController.validateBeforeUpload,
    trackController.uploadCreateToS3,
    trackController.createTrack
  );

router
  .route('/:id')
  .get(trackController.getTrack)
  .patch(
    trackController.multerUploadFields,
    trackController.uploadPatchToS3,
    trackController.updateTrack
  )
  .delete(trackController.deleteTrack);

export default router;
