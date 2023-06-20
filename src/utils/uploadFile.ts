import AWS from 'aws-sdk';
import { NextFunction, Request, Response } from 'express';

const s3 = new AWS.S3({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const coverImage = files?.coverImage ? files?.coverImage[0] : undefined;
  const url = files?.url ? files?.url[0] : undefined;

  if (!coverImage || !url) {
    return res
      .status(400)
      .json({ status: 'fail', err: 'Cover image and URL must be defined' });
  }

  if (!coverImage.mimetype.startsWith('image/')) {
    return res
      .status(400)
      .json({ status: 'fail', err: 'Cover image must be an image file' });
  }

  if (!url.mimetype.startsWith('audio/')) {
    return res
      .status(400)
      .json({ status: 'fail', err: 'URL must be an audio file' });
  }

  const coverImageParams = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `${Date.now()}-${coverImage.originalname}`,
    Body: coverImage.buffer,
  };

  const urlParams = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `${Date.now()}-${url.originalname}`,
    Body: url.buffer,
  };

  try {
    const [coverImageData, urlData] = await Promise.all([
      s3.upload(coverImageParams).promise(),
      s3.upload(urlParams).promise(),
    ]);

    req.body.coverImage = coverImageData.Location;
    req.body.url = urlData.Location;
    next();
  } catch (err) {
    res.status(400).json({ status: 'fail', err: err });
  }
};
