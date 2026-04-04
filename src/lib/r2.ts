import AWS from "aws-sdk";

function getS3() {
  return new AWS.S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    region: "auto",
    signatureVersion: "v4",
  });
}

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await getS3().putObject({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }).promise();

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await getS3().deleteObject({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }).promise();
}

export function getR2Key(tenantId: string, folder: string, filename: string): string {
  return `${tenantId}/${folder}/${Date.now()}-${filename}`;
}
