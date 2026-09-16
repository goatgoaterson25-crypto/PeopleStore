import * as Minio from 'minio';

const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucket = process.env.MINIO_BUCKET || 'apps';

export const minio = new Minio.Client({
  endPoint,
  port,
  useSSL: false,
  accessKey,
  secretKey,
});

export async function ensureBucket() {
  const exists = await minio.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await minio.makeBucket(bucket, 'us-east-1');
    console.log('Created MinIO bucket:', bucket);
  }
}

export async function uploadApk(objectName, buffer, size) {
  await minio.putObject(bucket, objectName, buffer, size, {
    'Content-Type': 'application/vnd.android.package-archive',
  });
  return objectName;
}

export async function getApkStream(objectName) {
  return minio.getObject(bucket, objectName);
}

export { bucket };
