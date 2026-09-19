import React, { useEffect, useState } from 'react';
import {
    LifeBuoy,
    Send,
    RefreshCw,
    MessageCircle,
    Clock3,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    CreditCard,
    ShoppingBag,
    Package,
    Wrench,
    UserRound,
    MoreHorizontal
} from 'lucide-react';
import api from '../services/api';

const categories = [
    {
        value: 'account',
        label: 'Account',
        description: 'Login, registration, suspension or account issues',
        icon: UserRound
    },
    {
        value: 'payment',
        label: 'Payment',
        description: 'Payment, transaction or Paystack issues',
        icon: CreditCard
    },
    {
        value: 'order',
        label: 'Order',
        description: 'Issues with requests, orders or delivery',
        icon: ShoppingBag
    },
    {
        value: 'product',
        label: 'Product',
        description: 'Product listing, quantity or marketplace issues',
        icon: Package
    },
    {
        value: 'technical',
        label: 'Technical',
        description: 'Website errors or technical problems',
        icon: Wrench
    },
    {
        value: 'other',
        label: 'Other',
        description: 'Anything else you need help with',
        icon: MoreHorizontal
    }
];

const getCategoryLabel = (category) => {
    const found = categories.find(
        (item) => item.value === category
    );

    return found ? found.label : 'Other';
};

const getStatusConfig = (status) => {
    switch (status) {
        case 'open':
            return {
                label: 'Open',
                className: 'status-open',
                icon: AlertCircle
            };

        case 'in-progress':
            return {
                label: 'In Progress',
                className: 'status-progress',
                icon: Clock3
            };

        case 'resolved':
            return {
                label: 'Resolved',
                className: 'status-resolved',
                icon: CheckCircle2
            };

        case 'closed':
            return {
                label: 'Closed',
                className: 'status-closed',
                icon: XCircle
            };

        default:
            return {
                label: 'Open',
                className: 'status-open',
                icon: AlertCircle
            };
    }
};

const formatDate = (date) => {
    if (!date) {
        return '';
    }

    return new Date(date).toLocaleString(
        'en-NG',
        {
            dateStyle: 'medium',
            timeStyle: 'short'
        }
    );
};

const Support = () => {
    const [tickets, setTickets] = useState([]);

    const [form, setForm] = useState({
        subject: '',
        category: 'account',
        message: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [expandedTicket, setExpandedTicket] =
        useState(null);

    // ============================================
    // FETCH MY SUPPORT TICKETS
    // ============================================
    const fetchTickets = async (showRefreshLoader = false) => {
    try {
        setError('');

        if (showRefreshLoader) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const response = await api.get('/support/my-tickets');

        if (response.data?.success) {
            setTickets(
                Array.isArray(response.data.tickets)
                    ? response.data.tickets
                    : []
            );
        } else {
            setTickets([]);
        }
    } catch (err) {
        console.error(
            'Fetch Support Tickets Error:',
            err
        );

        setError(
            err.response?.data?.message ||
            'Unable to load your support tickets.'
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};

   useEffect(() => {
    let ignore = false;

    const loadTickets = async () => {
        try {
            setError('');
            setLoading(true);

            const response = await api.get(
                '/support/my-tickets'
            );

            if (ignore) return;

            if (response.data?.success) {
                setTickets(
                    Array.isArray(response.data.tickets)
                        ? response.data.tickets
                        : []
                );
            } else {
                setTickets([]);
            }
        } catch (err) {
            if (ignore) return;

            console.error(
                'Fetch Support Tickets Error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load your support tickets.'
            );
        } finally {
            if (!ignore) {
                setLoading(false);
            }
        }
    };

    loadTickets();

    return () => {
        ignore = true;
    };
}, []);

    // ============================================
    // FORM CHANGE
    // ============================================
    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setError('');
        setSuccess('');
    };

    // ============================================
    // SUBMIT SUPPORT TICKET
    // ============================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        const subject = form.subject.trim();
        const message = form.message.trim();

        if (!subject) {
            setError(
                'Please enter a subject for your support request.'
            );
            return;
        }

        if (!message) {
            setError(
                'Please describe the issue you are experiencing.'
            );
            return;
        }

        if (message.length < 10) {
            setError(
                'Please provide a little more detail about your issue.'
            );
            return;
        }

        try {
            setSubmitting(true);

            const response = await api.post(
                '/support',
                {
                    subject,
                    category: form.category,
                    message
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    'Unable to create support ticket.'
                );
            }

            setSuccess(
                'Your support ticket has been submitted successfully. Our admin team will review it.'
            );

            setForm({
                subject: '',
                category: 'account',
                message: ''
            });

            await fetchTickets();

            if (response.data.ticket?._id) {
                setExpandedTicket(
                    response.data.ticket._id
                );
            }
        } catch (err) {
            console.error(
                'Create Support Ticket Error:',
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to submit your support ticket.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // TOGGLE TICKET
    // ============================================
    const toggleTicket = (ticketId) => {
        setExpandedTicket((previous) =>
            previous === ticketId
                ? null
                : ticketId
        );
    };

    // ============================================
    // QUICK HELP
    // ============================================
    const handleCategoryHelp = (category) => {
        setForm((previous) => ({
            ...previous,
            category
        }));

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="support-page">
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .support-page {
                    min-height: 100vh;
                    background:
                        linear-gradient(
                            180deg,
                            #f0fdf4 0%,
                            #f8fafc 38%,
                            #ffffff 100%
                        );
                    padding-bottom: 60px;
                }

                .support-container {
                    width: min(1180px, 92%);
                    margin: 0 auto;
                }

                .support-hero {
                    padding: 58px 0 42px;
                }

                .support-hero-inner {
                    display: grid;
                    grid-template-columns: 1.35fr 0.65fr;
                    gap: 30px;
                    align-items: center;
                }

                .support-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 13px;
                    border-radius: 999px;
                    background: #dcfce7;
                    color: #166534;
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 16px;
                }

                .support-hero h1 {
                    margin: 0;
                    color: #0f172a;
                    font-size: clamp(32px, 5vw, 52px);
                    line-height: 1.05;
                    font-weight: 800;
                    letter-spacing: -1.5px;
                }

                .support-hero h1 span {
                    color: #16a34a;
                }

                .support-hero p {
                    max-width: 680px;
                    margin: 18px 0 0;
                    color: #64748b;
                    font-size: 16px;
                    line-height: 1.7;
                }

                .support-hero-card {
                    background: #ffffff;
                    border: 1px solid #dcfce7;
                    border-radius: 24px;
                    padding: 25px;
                    box-shadow:
                        0 18px 45px rgba(15, 23, 42, 0.08);
                }

                .support-hero-icon {
                    width: 58px;
                    height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 18px;
                    background: #16a34a;
                    color: white;
                    margin-bottom: 15px;
                }

                .support-hero-card h3 {
                    margin: 0 0 8px;
                    color: #0f172a;
                    font-size: 19px;
                    font-weight: 800;
                }

                .support-hero-card p {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .support-alert {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 14px 16px;
                    border-radius: 13px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .support-alert svg {
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .support-alert-error {
                    background: #fef2f2;
                    color: #b91c1c;
                    border: 1px solid #fecaca;
                }

                .support-alert-success {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }

                .support-grid {
                    display: grid;
                    grid-template-columns: 0.9fr 1.1fr;
                    gap: 26px;
                    align-items: start;
                }

                .support-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 22px;
                    box-shadow:
                        0 12px 35px rgba(15, 23, 42, 0.06);
                    overflow: hidden;
                }

                .support-card-header {
                    padding: 22px 23px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .support-card-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                    color: #0f172a;
                    font-size: 19px;
                    font-weight: 800;
                }

                .support-card-header p {
                    margin: 7px 0 0;
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .support-form {
                    padding: 23px;
                }

                .support-field {
                    margin-bottom: 18px;
                }

                .support-field:last-child {
                    margin-bottom: 0;
                }

                .support-field label {
                    display: block;
                    margin-bottom: 7px;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 700;
                }

                .support-field input,
                .support-field select,
                .support-field textarea {
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    border-radius: 12px;
                    background: #ffffff;
                    color: #0f172a;
                    font-family: inherit;
                    font-size: 14px;
                    outline: none;
                    transition:
                        border-color 0.2s,
                        box-shadow 0.2s;
                }

                .support-field input,
                .support-field select {
                    height: 46px;
                    padding: 0 13px;
                }

                .support-field textarea {
                    min-height: 145px;
                    resize: vertical;
                    padding: 12px 13px;
                    line-height: 1.6;
                }

                .support-field input:focus,
                .support-field select:focus,
                .support-field textarea:focus {
                    border-color: #22c55e;
                    box-shadow:
                        0 0 0 3px rgba(34, 197, 94, 0.12);
                }

                .support-char-count {
                    text-align: right;
                    color: #94a3b8;
                    font-size: 11px;
                    margin-top: 5px;
                }

                .support-submit {
                    width: 100%;
                    min-height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    border: 0;
                    border-radius: 12px;
                    background: #16a34a;
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition:
                        transform 0.2s,
                        background 0.2s;
                }

                .support-submit:hover:not(:disabled) {
                    background: #15803d;
                    transform: translateY(-1px);
                }

                .support-submit:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .support-spinner {
                    animation: support-spin 0.8s linear infinite;
                }

                @keyframes support-spin {
                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }

                .support-tickets {
                    padding: 15px;
                }

                .support-ticket {
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    margin-bottom: 12px;
                    overflow: hidden;
                    background: #ffffff;
                }

                .support-ticket:last-child {
                    margin-bottom: 0;
                }

                .support-ticket-button {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    border: 0;
                    background: transparent;
                    padding: 17px;
                    text-align: left;
                    cursor: pointer;
                }

                .support-ticket-button:hover {
                    background: #f8fafc;
                }

                .support-ticket-main {
                    min-width: 0;
                    flex: 1;
                }

                .support-ticket-subject {
                    margin: 0 0 7px;
                    color: #0f172a;
                    font-size: 14px;
                    font-weight: 800;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .support-ticket-meta {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 11px;
                }

                .support-category {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: #f1f5f9;
                    color: #475569;
                    font-weight: 700;
                }

                .support-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .status-open {
                    background: #fff7ed;
                    color: #c2410c;
                }

                .status-progress {
                    background: #eff6ff;
                    color: #1d4ed8;
                }

                .status-resolved {
                    background: #f0fdf4;
                    color: #15803d;
                }

                .status-closed {
                    background: #f1f5f9;
                    color: #475569;
                }

                .support-ticket-details {
                    border-top: 1px solid #e2e8f0;
                    padding: 18px;
                    background: #f8fafc;
                }

                .support-message-block {
                    margin-bottom: 16px;
                }

                .support-message-block:last-child {
                    margin-bottom: 0;
                }

                .support-message-label {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    margin-bottom: 7px;
                    color: #475569;
                    font-size: 12px;
                    font-weight: 800;
                }

                .support-message {
                    margin: 0;
                    padding: 13px;
                    border-radius: 11px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #334155;
                    font-size: 13px;
                    line-height: 1.65;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .support-admin-response {
                    border-color: #bbf7d0;
                    background: #f0fdf4;
                }

                .support-no-response {
                    color: #94a3b8;
                    font-size: 12px;
                    font-style: italic;
                }

                .support-refresh {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    min-height: 40px;
                    padding: 0 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    background: #ffffff;
                    color: #475569;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .support-refresh:hover {
                    background: #f8fafc;
                }

                .support-tickets-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .support-empty {
                    padding: 48px 20px;
                    text-align: center;
                }

                .support-empty-icon {
                    width: 58px;
                    height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 14px;
                    border-radius: 18px;
                    background: #f0fdf4;
                    color: #16a34a;
                }

                .support-empty h3 {
                    margin: 0 0 7px;
                    color: #334155;
                    font-size: 16px;
                }

                .support-empty p {
                    max-width: 330px;
                    margin: 0 auto;
                    color: #94a3b8;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .quick-help {
                    margin-top: 26px;
                }

                .quick-help h2 {
                    margin: 0 0 14px;
                    color: #0f172a;
                    font-size: 18px;
                    font-weight: 800;
                }

                .quick-help-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 13px;
                }

                .quick-help-button {
                    display: flex;
                    align-items: flex-start;
                    gap: 11px;
                    padding: 15px;
                    border: 1px solid #e2e8f0;
                    border-radius: 15px;
                    background: #ffffff;
                    text-align: left;
                    cursor: pointer;
                    transition:
                        border-color 0.2s,
                        transform 0.2s;
                }

                .quick-help-button:hover {
                    border-color: #86efac;
                    transform: translateY(-2px);
                }

                .quick-help-icon {
                    width: 37px;
                    height: 37px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: #f0fdf4;
                    color: #16a34a;
                }

                .quick-help-text strong {
                    display: block;
                    margin-bottom: 3px;
                    color: #334155;
                    font-size: 12px;
                }

                .quick-help-text span {
                    display: block;
                    color: #94a3b8;
                    font-size: 11px;
                    line-height: 1.45;
                }

                .support-loading {
                    padding: 50px 20px;
                    text-align: center;
                    color: #64748b;
                }

                .support-loading svg {
                    margin-bottom: 10px;
                    animation: support-spin 0.8s linear infinite;
                }

                @media (max-width: 900px) {
                    .support-hero-inner,
                    .support-grid {
                        grid-template-columns: 1fr;
                    }

                    .support-hero-card {
                        max-width: 600px;
                    }

                    .quick-help-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 600px) {
                    .support-container {
                        width: min(94%, 1180px);
                    }

                    .support-hero {
                        padding: 35px 0 28px;
                    }

                    .support-hero h1 {
                        font-size: 34px;
                    }

                    .support-card-header,
                    .support-form {
                        padding: 18px;
                    }

                    .support-tickets {
                        padding: 10px;
                    }

                    .support-ticket-button {
                        padding: 14px;
                    }

                    .support-status {
                        font-size: 10px;
                    }

                    .quick-help-grid {
                        grid-template-columns: 1fr;
                    }

                    .support-ticket-meta {
                        gap: 6px;
                    }
                }
            `}</style>

            {/* ============================================
                HERO
            ============================================ */}
            <section className="support-hero">
                <div className="support-container">
                    <div className="support-hero-inner">
                        <div>
                            <div className="support-badge">
                                <LifeBuoy size={15} />
                                FarmLink Support
                            </div>

                            <h1>
                                How can we{' '}
                                <span>help you?</span>
                            </h1>

                            <p>
                                Having an issue with your
                                account, payment, order,
                                product, or FarmLink in
                                general? Send us a support
                                request and our admin team
                                will review it.
                            </p>
                        </div>

                        <div className="support-hero-card">
                            <div className="support-hero-icon">
                                <MessageCircle
                                    size={27}
                                />
                            </div>

                            <h3>
                                We're here to help
                            </h3>

                            <p>
                                Describe your issue clearly
                                and include useful details
                                so our support team can
                                assist you faster.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="support-container">
                {/* ========================================
                    ALERTS
                ======================================== */}
                {error && (
                    <div className="support-alert support-alert-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="support-alert support-alert-success">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {/* ========================================
                    MAIN SUPPORT GRID
                ======================================== */}
                <div className="support-grid">
                    {/* ====================================
                        CREATE TICKET
                    ==================================== */}
                    <section className="support-card">
                        <div className="support-card-header">
                            <h2>
                                <Send
                                    size={19}
                                    color="#16a34a"
                                />
                                Contact Support
                            </h2>

                            <p>
                                Tell us what is happening
                                and we'll get back to you.
                            </p>
                        </div>

                        <form
                            className="support-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="support-field">
                                <label htmlFor="subject">
                                    Subject
                                </label>

                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    value={form.subject}
                                    onChange={handleChange}
                                    maxLength={120}
                                    placeholder="e.g. I cannot access my account"
                                />
                            </div>

                            <div className="support-field">
                                <label htmlFor="category">
                                    Issue Category
                                </label>

                                <select
                                    id="category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category.value
                                                }
                                                value={
                                                    category.value
                                                }
                                            >
                                                {
                                                    category.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="support-field">
                                <label htmlFor="message">
                                    Describe your issue
                                </label>

                                <textarea
                                    id="message"
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    maxLength={2000}
                                    placeholder="Please explain what happened and any relevant details..."
                                />

                                <div className="support-char-count">
                                    {form.message.length}
                                    /2000
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="support-submit"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw
                                            size={17}
                                            className="support-spinner"
                                        />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={17} />
                                        Submit Support Request
                                    </>
                                )}
                            </button>
                        </form>
                    </section>

                    {/* ====================================
                        MY TICKETS
                    ==================================== */}
                    <section className="support-card">
                        <div className="support-card-header">
                            <div className="support-tickets-title">
                                <div>
                                    <h2>
                                        <MessageCircle
                                            size={19}
                                            color="#16a34a"
                                        />
                                        My Support Tickets
                                    </h2>

                                    <p>
                                        Track your requests
                                        and admin responses.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="support-refresh"
                                    onClick={() =>
                                        fetchTickets(true)
                                    }
                                    disabled={refreshing}
                                >
                                    <RefreshCw
                                        size={14}
                                        className={
                                            refreshing
                                                ? 'support-spinner'
                                                : ''
                                        }
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="support-loading">
                                <RefreshCw
                                    size={25}
                                    className="support-spinner"
                                />
                                <div>
                                    Loading your tickets...
                                </div>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="support-empty">
                                <div className="support-empty-icon">
                                    <HelpCircle
                                        size={27}
                                    />
                                </div>

                                <h3>
                                    No support tickets yet
                                </h3>

                                <p>
                                    If you need help, submit
                                    a support request using
                                    the form and it will
                                    appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="support-tickets">
                                {tickets.map((ticket) => {
                                    const status =
                                        getStatusConfig(
                                            ticket.status
                                        );

                                    const StatusIcon =
                                        status.icon;

                                    const isExpanded =
                                        expandedTicket ===
                                        ticket._id;

                                    return (
                                        <article
                                            key={
                                                ticket._id
                                            }
                                            className="support-ticket"
                                        >
                                            <button
                                                type="button"
                                                className="support-ticket-button"
                                                onClick={() =>
                                                    toggleTicket(
                                                        ticket._id
                                                    )
                                                }
                                            >
                                                <div className="support-ticket-main">
                                                    <h3 className="support-ticket-subject">
                                                        {
                                                            ticket.subject
                                                        }
                                                    </h3>

                                                    <div className="support-ticket-meta">
                                                        <span className="support-category">
                                                            {
                                                                getCategoryLabel(
                                                                    ticket.category
                                                                )
                                                            }
                                                        </span>

                                                        <span>
                                                            {
                                                                formatDate(
                                                                    ticket.createdAt
                                                                )
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div
                                                    className={`support-status ${status.className}`}
                                                >
                                                    <StatusIcon
                                                        size={12}
                                                    />
                                                    {
                                                        status.label
                                                    }
                                                </div>

                                                {isExpanded ? (
                                                    <ChevronUp
                                                        size={17}
                                                        color="#64748b"
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        size={17}
                                                        color="#64748b"
                                                    />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="support-ticket-details">
                                                    <div className="support-message-block">
                                                        <div className="support-message-label">
                                                            <MessageCircle
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                            Your message
                                                        </div>

                                                        <p className="support-message">
                                                            {
                                                                ticket.message
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="support-message-block">
                                                        <div className="support-message-label">
                                                            <LifeBuoy
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                            Admin response
                                                        </div>

                                                        {ticket.adminResponse ? (
                                                            <p className="support-message support-admin-response">
                                                                {
                                                                    ticket.adminResponse
                                                                }
                                                            </p>
                                                        ) : (
                                                            <div className="support-no-response">
                                                                Our support
                                                                team has not
                                                                responded
                                                                yet. Please
                                                                check back
                                                                later.
                                                            </div>
                                                        )}
                                                    </div>

                                                    {ticket.respondedAt && (
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    '12px',
                                                                color:
                                                                    '#64748b',
                                                                fontSize:
                                                                    '11px'
                                                            }}
                                                        >
                                                            Last
                                                            responded:{' '}
                                                            {formatDate(
                                                                ticket.respondedAt
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* ========================================
                    QUICK HELP
                ======================================== */}
                <section className="quick-help">
                    <h2>
                        What do you need help with?
                    </h2>

                    <div className="quick-help-grid">
                        {categories.map(
                            (category) => {
                                const CategoryIcon =
                                    category.icon;

                                return (
                                    <button
                                        type="button"
                                        key={
                                            category.value
                                        }
                                        className="quick-help-button"
                                        onClick={() =>
                                            handleCategoryHelp(
                                                category.value
                                            )
                                        }
                                    >
                                        <div className="quick-help-icon">
                                            <CategoryIcon
                                                size={18}
                                            />
                                        </div>

                                        <div className="quick-help-text">
                                            <strong>
                                                {
                                                    category.label
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    category.description
                                                }
                                            </span>
                                        </div>
                                    </button>
                                );
                            }
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Support;