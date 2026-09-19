const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

// ============================================
// CREATE SUPPORT TICKET
// ============================================
const createSupportTicket = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            subject,
            category,
            message
        } = req.body;

        if (!subject || !subject.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Subject is required'
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const allowedCategories = [
            'account',
            'payment',
            'order',
            'product',
            'technical',
            'other'
        ];

        const selectedCategory =
            category && allowedCategories.includes(category)
                ? category
                : 'other';

        const ticket = await SupportTicket.create({
            user: userId,
            subject: subject.trim(),
            category: selectedCategory,
            message: message.trim()
        });

        const populatedTicket = await SupportTicket.findById(
            ticket._id
        ).populate(
            'user',
            'name email phone role'
        );

        return res.status(201).json({
            success: true,
            message:
                'Support ticket created successfully. Our admin team will review it.',
            ticket: populatedTicket
        });
    } catch (error) {
        console.error(
            'Create Support Ticket Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'An unexpected server error occurred.'
        });
    }
};


// ============================================
// GET MY SUPPORT TICKETS
// ============================================
const getMySupportTickets = async (req, res) => {
    try {
        const userId = req.user.id;

        const tickets = await SupportTicket.find({
            user: userId
        })
            .sort({ createdAt: -1 })
            .populate(
                'user',
                'name email phone role'
            );

        return res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        console.error(
            'Get My Support Tickets Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'An unexpected server error occurred.'
        });
    }
};


// ============================================
// GET SINGLE SUPPORT TICKET
// ============================================
const getSupportTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid support ticket ID'
            });
        }

        const ticket = await SupportTicket.findById(id)
            .populate(
                'user',
                'name email phone role'
            );

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found'
            });
        }

        // Only the ticket owner or admin can view it
        const isOwner =
            ticket.user._id.toString() === userId;

        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to view this support ticket'
            });
        }

        return res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        console.error(
            'Get Support Ticket Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'An unexpected server error occurred.'
        });
    }
};


// ============================================
// GET ALL SUPPORT TICKETS - ADMIN
// ============================================
const getAllSupportTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .sort({ createdAt: -1 })
            .populate(
                'user',
                'name email phone role accountStatus'
            );

        return res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        console.error(
            'Get All Support Tickets Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'An unexpected server error occurred.'
        });
    }
};


// ============================================
// ADMIN RESPONDS TO SUPPORT TICKET
// ============================================
const respondToSupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid support ticket ID'
            });
        }

        if (
            !adminResponse ||
            !adminResponse.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Admin response is required'
            });
        }

        const ticket =
            await SupportTicket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found'
            });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({
                success: false,
                message:
                    'This support ticket is already closed'
            });
        }

        ticket.adminResponse =
            adminResponse.trim();

        ticket.status = 'resolved';
        ticket.respondedAt = new Date();

        await ticket.save();

        const updatedTicket =
            await SupportTicket.findById(ticket._id)
                .populate(
                    'user',
                    'name email phone role'
                );

        return res.status(200).json({
            success: true,
            message:
                'Support response sent successfully',
            ticket: updatedTicket
        });
    } catch (error) {
        console.error(
            'Respond To Support Ticket Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'An unexpected server error occurred.'
        });
    }
};


// ============================================
// UPDATE SUPPORT TICKET STATUS - ADMIN
// ============================================
const updateSupportTicketStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            'open',
            'in-progress',
            'resolved',
            'closed'
        ];

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid support ticket ID'
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid support ticket status'
            });
        }

        const ticket =
            await SupportTicket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found'
            });
        }

        ticket.status = status;

        await ticket.save();

        const updatedTicket =
            await SupportTicket.findById(ticket._id)
                .populate(
                    'user',
                    'name email phone role'
                );

        return res.status(200).json({
            success: true,
            message:
                'Support ticket status updated successfully',
            ticket: updatedTicket
        });
    } catch (error) {
        console.error(
            'Update Support Ticket Status Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'An unexpected server error occurred.'
        });
    }
};


module.exports = {
    createSupportTicket,
    getMySupportTickets,
    getSupportTicketById,
    getAllSupportTickets,
    respondToSupportTicket,
    updateSupportTicketStatus
};