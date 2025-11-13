import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET!;

export async function uploadAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const key = `audio/${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: audioBuffer,
      ACL: 'public-read',
      ContentType: 'audio/mpeg',
    })
  );

  return `https://${BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
}

export async function uploadMetadata(metadata: any): Promise<string> {
  const key = 'episodes.json';

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(metadata, null, 2),
      ACL: 'public-read',
      ContentType: 'application/json',
    })
  );

  return `https://${BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
}

export async function getMetadata(): Promise<any> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: 'episodes.json',
      })
    );

    const body = await response.Body?.transformToString();
    return body ? JSON.parse(body) : { episodes: [], teasers: [] };
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      // File doesn't exist yet, return empty structure
      return { episodes: [], teasers: [] };
    }
    throw error;
  }
}
