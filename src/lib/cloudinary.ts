/**
 * Browser uploads to Cloudinary with an *unsigned upload preset*.
 *
 * Only the cloud name and the preset name are needed in the browser; the Cloudinary
 * API secret is never shipped to the client. Because of that, the browser can create
 * images but cannot delete them: removing a row from the gallery leaves the file in
 * Cloudinary (delete it from the Cloudinary console if needed).
 *
 * Env (set in .env locally and in Render's environment, then rebuild):
 *   VITE_CLOUDINARY_CLOUD_NAME
 *   VITE_CLOUDINARY_UPLOAD_PRESET   (Cloudinary console > Settings > Upload > an "Unsigned" preset)
 */

const CLOUD_NAME = import.meta.env['VITE_CLOUDINARY_CLOUD_NAME'] as string | undefined;
const UPLOAD_PRESET = import.meta.env['VITE_CLOUDINARY_UPLOAD_PRESET'] as string | undefined;

/** Folder the website media goes into, so it stays separate from anything else in the account. */
export const MEDIA_FOLDER = 'yahaya/website-media';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
/** Cloudinary's free plan limit for a single image. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export interface UploadedImage {
  /** Delivery URL with automatic format/quality and a sensible size cap: this is what we store. */
  url: string;
  /** The original upload, untouched. */
  originalUrl: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

export class UploadError extends Error {}

/** Returns a reason the file can't be uploaded, or null if it is fine. */
export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, WebP, AVIF or GIF image.';
  if (file.size > MAX_IMAGE_BYTES) return `Images must be 10 MB or smaller (this one is ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  return null;
}

/**
 * Turn a Cloudinary upload URL into an optimised delivery URL:
 * f_auto picks WebP/AVIF per browser, q_auto picks the quality, and c_limit,w_1600
 * caps the width without ever enlarging. Non-Cloudinary URLs are returned unchanged.
 */
export function optimisedUrl(url: string, width = 1600) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (/\/upload\/[^/]*(f_auto|q_auto)/.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

/** A small thumbnail version of a Cloudinary URL, for admin grids. */
export function thumbnailUrl(url: string) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace(/\/upload\/(?:[^/]*(?:f_auto|q_auto)[^/]*\/)?/, '/upload/f_auto,q_auto,c_fill,w_480,h_320/');
}

/** Upload one image. Reports progress (0-1) and can be cancelled with an AbortSignal. */
export function uploadImage(
  file: File,
  { onProgress, signal, folder = MEDIA_FOLDER }: { onProgress?: (fraction: number) => void; signal?: AbortSignal; folder?: string } = {},
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new UploadError('Image uploads are not set up: add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'));
      return;
    }
    const invalid = validateImage(file);
    if (invalid) {
      reject(new UploadError(invalid));
      return;
    }

    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', UPLOAD_PRESET!);
    body.append('folder', folder);
    // A unique name per upload: the preset keeps original file names and never overwrites,
    // so two different photos both called IMG_0001.jpg would otherwise collide.
    body.append('public_id', uniquePublicId(file.name));

    // XMLHttpRequest rather than fetch, because fetch cannot report upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME!)}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        onProgress?.(1);
        resolve({
          url: optimisedUrl(data.secure_url),
          originalUrl: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
        });
      } else {
        const message: string = data?.error?.message ?? `Upload failed (${xhr.status}).`;
        reject(
          new UploadError(
            /preset/i.test(message)
              ? 'Cloudinary rejected the upload preset. Check that VITE_CLOUDINARY_UPLOAD_PRESET names an unsigned preset.'
              : message,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new UploadError('Network error while uploading. Check your connection and try again.'));
    xhr.onabort = () => reject(new UploadError('Upload cancelled.'));
    if (signal) {
      if (signal.aborted) {
        reject(new UploadError('Upload cancelled.'));
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}

/** "Dubai Tour 2024.JPG" -> "dubai-tour-2024-k3f9x2": readable, URL-safe and unique. */
function uniquePublicId(name: string) {
  const slug = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'image'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** "dubai-tour_2024.jpg" -> "Dubai tour 2024": a starting title the admin can edit. */
export function titleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Untitled image';
}
