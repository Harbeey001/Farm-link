const Notification = require('../models/Notification');

const createNotification = async ({
    recipient,
    type,
    title,
    message,
    relatedId = null
}) => {
    try {
        return await Notification.create({
            recipient,
            type,
            title,
            message,
            relatedId
        });
    } catch (error) {
        console.error(
            'Create notification error:',
            error
        );

        return null;
    }
};

module.exports = {
    createNotification
};