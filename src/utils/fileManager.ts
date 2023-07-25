import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const getS3Params = (
  file: Express.Multer.File
): AWS.S3.PutObjectRequest => {
  return {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
  };
};

export const uploadFilesToS3 = async (
  files: Array<AWS.S3.PutObjectRequest>
) => {
  const data = files.map((file) => {
    return s3.upload(file).promise();
  });

  try {
    const uploadedData = await Promise.all(data);
    return uploadedData;
  } catch (err) {
    return undefined;
  }
};

export const removesFilesFromS3 = async (urls: string[]) => {
  const keys: AWS.S3.ObjectIdentifierList = urls
    .filter((url) => {
      const { pathname } = new URL(url);
      return pathname.split('/').length > 1;
    })
    .map((url) => {
      const { pathname } = new URL(url);

      const path = pathname.split('/')[1];
      // Object key may have spaces or unicode non-ASCII characters
      const srcKey = decodeURIComponent(path.replace(/\+/g, ' '));
      return { Key: srcKey };
    });

  try {
    const res = await s3
      .deleteObjects({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Delete: {
          Objects: keys,
        },
      })
      .promise();
    return res;
  } catch (err) {
    return err;
  }
};
