import { config } from '../config';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'uploads');
const LOCAL_BASE_URL = '/uploads';

// Local storage fallback used when no Vercel Blob token is configured (dev mode).
async function uploadFileLocal(file: File, folder: string): Promise<string> {
  // Ensure the folder exists
  const dir = path.join(STORAGE_DIR, folder);
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }

  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'bin';
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${timestamp}_${sanitizedName}`;

  const fullPath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  // Return a URL that the dev server can serve (mounted in index.ts)
  return `${LOCAL_BASE_URL}/${folder}/${filename}`;
}

// Vercel Blob storage (production)
async function uploadFileBlob(file: File, folder: string): Promise<string> {
  const { put } = await import('@vercel/blob');
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${folder}/${timestamp}_${sanitizedName}`;

  const blob = await put(key, file, {
    access: 'public',
    addRandomSuffix: true,
    token: config.blobToken || undefined,
  });

  return blob.url;
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  // In production (Vercel) or when a Blob token is present, use Vercel Blob.
  if (config.nodeEnv === 'production' || config.blobToken) {
    return uploadFileBlob(file, folder);
  }
  // Dev local fallback: save to disk.
  return uploadFileLocal(file, folder);
}

// Delete a previously uploaded file. Works for both local and Blob storage.
export async function deleteFile(url: string): Promise<void> {
  // Local file?
  if (url.startsWith(LOCAL_BASE_URL) || url.startsWith('/uploads')) {
    try {
      const relPath = url.replace(LOCAL_BASE_URL, '');
      const fullPath = path.join(STORAGE_DIR, relPath);
      await fs.unlink(fullPath);
      console.log(`Local file deleted: ${url}`);
    } catch (error) {
      console.error(`Failed to delete local file at ${url}:`, error);
    }
    return;
  }

  // Blob file
  try {
    const { del } = await import('@vercel/blob');
    await del(url, { token: config.blobToken || undefined });
    console.log(`Blob file deleted: ${url}`);
  } catch (error) {
    console.error(`Failed to delete blob file at ${url}:`, error);
    throw new Error(`Impossible de supprimer le fichier`);
  }
}

export async function listFiles(folder: string): Promise<{ url: string; name: string; size: number; uploadedAt: Date }[]> {
  if (config.nodeEnv === 'production' || config.blobToken) {
    try {
      const { list } = await import('@vercel/blob');
      const blobs = await list({
        prefix: folder,
        token: config.blobToken || undefined,
      });
      return blobs.blobs.map((blob) => ({
        url: blob.url,
        name: blob.pathname,
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt),
      }));
    } catch (error) {
      console.error(`Failed to list files in ${folder}:`, error);
      throw new Error(`Impossible de lister les fichiers du dossier ${folder}`);
    }
  }

  // Local fallback
  try {
    const dir = path.join(STORAGE_DIR, folder);
    const files = await fs.readdir(dir);
    const stats = await Promise.all(
      files.map(async (name) => {
        const full = path.join(dir, name);
        const s = await fs.stat(full);
        return { url: `${LOCAL_BASE_URL}/${folder}/${name}`, name, size: s.size, uploadedAt: s.mtime };
      })
    );
    return stats;
  } catch (error) {
    console.error(`Failed to list local files in ${folder}:`, error);
    return [];
  }
}
