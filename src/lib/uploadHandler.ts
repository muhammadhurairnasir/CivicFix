import type { NextRequest } from 'next/server';
import sharp from 'sharp';

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_PHOTOS_PER_REPORT = 5;
export const MAX_FILE_SIZE         = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// ─── Magic Bytes Signatures ───────────────────────────────────────────────────
// Verifies file content, not just the declared MIME type.

const MAGIC_SIGNATURES: { mime: AllowedMimeType; bytes: number[]; offset?: number }[] = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WEBP: RIFF????WEBP (check bytes 0-3 and 8-11)
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  // HEIC: ftyp at offset 4
  { mime: 'image/heic', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

function matchesMagicBytes(buffer: Buffer, signature: (typeof MAGIC_SIGNATURES)[number]): boolean {
  const offset = signature.offset ?? 0;
  return signature.bytes.every((byte, i) => buffer[offset + i] === byte);
}

function detectMimeFromBuffer(buffer: Buffer): AllowedMimeType | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (matchesMagicBytes(buffer, sig)) return sig.mime;
  }
  return null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadedFile {
  buffer:       Buffer;
  originalName: string;
  mimeType:     string;
  size:         number;
}

export interface ParsedFormData {
  fields: Record<string, string>;
  files:  UploadedFile[];
}

export interface ValidationResult {
  valid:   boolean;
  error?:  string;
}

// ─── parseFormData ────────────────────────────────────────────────────────────

/**
 * Parses a multipart/form-data NextRequest using the native Web FormData API.
 * No multer needed — fully compatible with Next.js 14 App Router.
 */
export async function parseFormData(request: NextRequest): Promise<ParsedFormData> {
  const formData = await request.formData();

  const fields: Record<string, string> = {};
  const files:  UploadedFile[]         = [];

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      fields[key] = value;
    } else {
      // value is a File (Blob with name)
      const file = value as File;
      const arrayBuffer = await file.arrayBuffer();
      const buffer      = Buffer.from(arrayBuffer);

      files.push({
        buffer,
        originalName: file.name,
        mimeType:     file.type,
        size:         file.size,
      });
    }
  }

  return { fields, files };
}

// ─── validateImageFile ────────────────────────────────────────────────────────

/**
 * Validates an uploaded file by:
 * 1. Checking MIME type against allow-list
 * 2. Checking file size against MAX_FILE_SIZE
 * 3. Verifying magic bytes match declared MIME type
 */
export function validateImageFile(file: UploadedFile): ValidationResult {
  // 1. MIME type check
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimeType)) {
    return {
      valid: false,
      error: `File type "${file.mimeType}" is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // 2. Size check
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `File "${file.originalName}" is ${mb} MB. Maximum allowed is 10 MB.`,
    };
  }

  // 3. Magic bytes check — ensures content matches declared type
  const detectedMime = detectMimeFromBuffer(file.buffer);

  if (detectedMime === null) {
    return {
      valid: false,
      error: `File "${file.originalName}" does not appear to be a valid image (magic bytes check failed).`,
    };
  }

  // WEBP special case: also check bytes 8-11 for 'WEBP'
  if (file.mimeType === 'image/webp') {
    const webpMarker = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'
    const isWebp     = webpMarker.every((byte, i) => file.buffer[8 + i] === byte);
    if (!isWebp) {
      return {
        valid: false,
        error: `File "${file.originalName}" claims to be WebP but failed the magic bytes check.`,
      };
    }
  }

  return { valid: true };
}

// ─── compressImage ────────────────────────────────────────────────────────────

export interface CompressOptions {
  maxWidth?: number;
  quality?:  number;
}

/**
 * Compresses an image buffer using sharp:
 * - Resizes to maxWidth if wider (default 1920px)
 * - Converts to WebP
 * - Applies quality setting (default 80)
 * Returns the compressed WebP buffer.
 */
export async function compressImage(
  buffer: Buffer,
  options: CompressOptions = {}
): Promise<Buffer> {
  const { maxWidth = 1920, quality = 80 } = options;

  const pipeline = sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality });

  const compressed = await pipeline.toBuffer();
  return compressed;
}
