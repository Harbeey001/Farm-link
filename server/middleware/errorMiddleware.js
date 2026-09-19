const notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.originalUrl}`
    );

    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    console.error('Server Error:', err);

    // ==========================
    // CORS ERRORS
    // ==========================

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'Access denied by server policy.'
        });
    }


    // ==========================
    // MULTER UPLOAD ERRORS
    // ==========================

    if (err.name === 'MulterError') {

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File is too large. Maximum size is 5 MB.'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'File upload failed.'
        });
    }


    // ==========================
    // CUSTOM IMAGE VALIDATION
    // ==========================

    if (
        err.message ===
        'Only JPG, JPEG, PNG, and WebP image files are allowed'
    ) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }


    // ==========================
    // INVALID JSON
    // ==========================

    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        'body' in err
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON request.'
        });
    }


    // ==========================
    // STATUS CODE
    // ==========================

    const statusCode =
        res.statusCode && res.statusCode !== 200
            ? res.statusCode
            : 500;


    // ==========================
    // GENERAL ERROR RESPONSE
    // ==========================

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? 'An unexpected server error occurred.'
                : err.message
    });
};

module.exports = {
    notFound,
    errorHandler
};
