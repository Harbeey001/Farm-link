const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp'
];

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1
    },

    fileFilter: (req, file, cb) => {
        const mimeTypeAllowed =
            allowedMimeTypes.includes(file.mimetype);

        const originalName =
            file.originalname.toLowerCase();

        const extensionAllowed =
            allowedExtensions.some((extension) =>
                originalName.endsWith(extension)
            );

        if (!mimeTypeAllowed || !extensionAllowed) {
            return cb(
                new Error(
                    'Only JPG, JPEG, PNG, and WebP image files are allowed'
                )
            );
        }

        cb(null, true);
    }
});

module.exports = upload;