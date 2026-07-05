import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// ─── Configure Cloudinary ────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  url:       string;
  publicId:  string;
  width:     number;
  height:    number;
  format:    string;
  bytes:     number;
}

// ─── Upload Report Photo ─────────────────────────────────────────────────────

/**
 * Uploads a report photo buffer to Cloudinary.
 * Auto quality/format, max 1920px wide, stored under civicfix/reports/.
 */
export async function uploadReportPhoto(
  buffer: Buffer,
  options?: { publicId?: string }
): Promise<UploadResult> {
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder:         'civicfix/reports',
          public_id:      options?.publicId,
          resource_type:  'image',
          transformation: [
            { width: 1920, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned no result'));
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    format:   result.format,
    bytes:    result.bytes,
  };
}

// ─── Upload Repair Photo ─────────────────────────────────────────────────────

/**
 * Uploads a repair photo buffer to Cloudinary.
 * Auto quality/format, max 1920px wide, stored under civicfix/repairs/.
 */
export async function uploadRepairPhoto(
  buffer: Buffer,
  options?: { publicId?: string }
): Promise<UploadResult> {
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder:         'civicfix/repairs',
          public_id:      options?.publicId,
          resource_type:  'image',
          transformation: [
            { width: 1920, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned no result'));
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    format:   result.format,
    bytes:    result.bytes,
  };
}

// ─── Upload Avatar ───────────────────────────────────────────────────────────

/**
 * Uploads a user avatar buffer to Cloudinary.
 * Crops to face, resizes to 400×400, stored under civicfix/avatars/.
 */
export async function uploadAvatar(
  buffer: Buffer,
  userId: string
): Promise<UploadResult> {
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder:         'civicfix/avatars',
          public_id:      `avatar_${userId}`,
          resource_type:  'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary avatar upload returned no result'));
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    format:   result.format,
    bytes:    result.bytes,
  };
}

// ─── Delete Photo ────────────────────────────────────────────────────────────

/**
 * Permanently deletes an asset from Cloudinary by its publicId.
 */
export async function deletePhoto(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary delete failed for publicId "${publicId}": ${result.result}`);
  }
}

// ─── Get Optimized URL ───────────────────────────────────────────────────────

/**
 * Returns a Cloudinary transformation URL with auto format/quality.
 * Optionally resizes to a specific width.
 */
export function getOptimizedUrl(publicId: string, width?: number): string {
  const transformations: Record<string, unknown>[] = [
    { quality: 'auto', fetch_format: 'auto' },
  ];

  if (width) {
    transformations.unshift({ width, crop: 'limit' });
  }

  return cloudinary.url(publicId, {
    secure:         true,
    transformation: transformations,
  });
}
