import multer from 'multer';
import path from 'path';

// Keep uploads in memory so image signatures are verified before any write.\n// File filter to accept only images
const fileFilter = (_req: import('express').Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedExtensions.includes(extension) && allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Create multer instance
export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
