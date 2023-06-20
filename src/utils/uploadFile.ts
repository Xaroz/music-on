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
