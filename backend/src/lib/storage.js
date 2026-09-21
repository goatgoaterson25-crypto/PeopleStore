import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/apks';

function safeJoin(objectName) {
  const cleaned = String(objectName).replace(/\.\./g, '').replace(/^\/+/, '');
  return path.join(UPLOAD_DIR, cleaned);
}

export async function ensureBucket() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('APK storage ready at', UPLOAD_DIR);
}

export async function uploadApk(objectName, buffer, size) {
  const dest = safeJoin(objectName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  console.log('Stored APK', dest, size, 'bytes');
  return objectName;
}

export async function getApkStream(objectName) {
  const dest = safeJoin(objectName);
  if (!fs.existsSync(dest)) {
    throw Object.assign(new Error('APK file missing on disk'), { status: 404 });
  }
  return fs.createReadStream(dest);
}

export { UPLOAD_DIR as bucket };
