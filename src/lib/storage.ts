import { put, del, list } from '@vercel/blob';
import { createHash } from 'crypto';

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  file: File | Blob,
  pathname: string,
  options?: {
    access?: 'public';
    contentType?: string;
  }
) {
  const blob = await put(pathname, file, {
    access: options?.access || 'public',
    contentType: options?.contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string) {
  await del(url);
}

/**
 * List files in Vercel Blob storage
 */
export async function listFiles(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}) {
  const result = await list(options);
  return result;
}

/**
 * Generate a hash for file deduplication
 */
export async function generateFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate a unique pathname for a file
 */
export function generatePathname(
  auditRunId: string,
  category: 'documents' | 'populations' | 'exports',
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${category}/${auditRunId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Validate file type
 */
export function isValidFileType(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
}

/**
 * Document file types
 */
export const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt'];

/**
 * Population file types
 */
export const POPULATION_EXTENSIONS = ['xlsx', 'xls', 'csv'];

/**
 * Export file types
 */
export const EXPORT_EXTENSIONS = ['xlsx', 'pdf', 'json'];
