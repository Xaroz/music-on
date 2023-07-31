import express from 'express';

import authController from '../controllers/authController';
import trackController from '../controllers/trackController';

import { UserRoles } from '../models/userModel';

const router = express.Router();

router
  .route('/')
  .get(trackController.getAllTracks)
  .post(
    authController.protect,
    authController.restrictTo(UserRoles.ADMIN, UserRoles.ARTIST),
    trackController.multerUploadFields,
    authController.setCreatedBy,
    trackController.convertToArray,
    trackController.validateBeforeUpload,
    trackController.validateDataExistence,
    trackController.uploadCreateToS3,
    trackController.createTrack
  );

router
  .route('/:id')
  .get(trackController.getTrack)
  .patch(
    authController.protect,
    authController.restrictTo(UserRoles.ADMIN, UserRoles.ARTIST),
    trackController.multerUploadFields,
    trackController.validateDataExistence,
    trackController.checkTrackOwner,
    trackController.uploadPatchToS3,
    trackController.updateTrack
  )
  .delete(
    authController.protect,
    authController.restrictTo(UserRoles.ADMIN, UserRoles.ARTIST),
    trackController.checkTrackOwner,
    trackController.deleteTrack
  );

export default router;
