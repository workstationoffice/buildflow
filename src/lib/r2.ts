import AWS from "aws-sdk";

const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await s3.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }).promise();

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
}

export function getR2Key(tenantId: string, folder: string, filename: string): string {
  return `${tenantId}/${folder}/${Date.now()}-${filename}`;
}
