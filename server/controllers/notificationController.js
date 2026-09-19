const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id
        })
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error(
            'Get notifications error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to fetch notifications'
        });
    }
};

const markNotificationAsRead = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const notification =
            await Notification.findOne({
                _id: id,
                recipient: req.user.id
            });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({
            success: true,
            message:
                'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error(
            'Mark notification read error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update notification'
        });
    }
};

const markAllNotificationsAsRead = async (
    req,
    res
) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.id,
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        );

        return res.status(200).json({
            success: true,
            message:
                'All notifications marked as read'
        });
    } catch (error) {
        console.error(
            'Mark all notifications read error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to update notifications'
        });
    }
};

module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};