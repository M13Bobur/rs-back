import { mkdirSync } from 'node:fs';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function repairPhotoStorage() {
  return diskStorage({
    destination: (req, _file, cb) => {
      const repairId = String(req.params.id ?? 'unknown');
      const dir = join(process.cwd(), 'uploads', 'repairs', repairId);
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

export function repairPhotoFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new Error('Faqat rasm fayllari ruxsat etiladi'), false);
    return;
  }
  cb(null, true);
}

export const REPAIR_PHOTO_MAX_SIZE = 5 * 1024 * 1024;
