import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Package,
    ClipboardList,
    ShieldCheck,
    Server,
    LogOut,
    RefreshCw,
    TrendingUp,
    ShoppingCart,
    UserCheck,
    Clock3,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    ChevronRight,
    Ban,
    CircleCheck,
    CirclePause,
    Activity,
    Database,
    CreditCard,
    Cloud,
    LockKeyhole,
    ArrowUpRight,
    HelpCircle,
    MessageSquare,
    Send,
    Filter,
    User,
    Mail,
    Phone,
    MapPin,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [requests, setRequests] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);

    // Backend-supported periods:
    // weekly, monthly, annually
    const [period, setPeriod] = useState('weekly');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [supportLoading, setSupportLoading] = useState(false);
    const [error, setError] = useState('');

    const [userSearch, setUserSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [requestSearch, setRequestSearch] = useState('');
    const [supportSearch, setSupportSearch] = useState('');
    const [supportStatusFilter, setSupportStatusFilter] = useState('all');
    const [supportCategoryFilter, setSupportCategoryFilter] = useState('all');

    const [updatingUser, setUpdatingUser] = useState(null);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [responseText, setResponseText] = useState({});
    const [respondingTicket, setRespondingTicket] = useState(null);
    const [updatingTicketStatus, setUpdatingTicketStatus] = useState(null);

    const token = localStorage.getItem('farmlink_token');

    const currentSection = useMemo(() => {
        const pathname = location.pathname;

        if (pathname === '/admin-dashboard') return 'dashboard';
        if (pathname === '/admin-dashboard/users') return 'users';
        if (pathname === '/admin-dashboard/products') return 'products';
        if (pathname === '/admin-dashboard/requests') return 'requests';
        if (pathname === '/admin-dashboard/support') return 'support';
        if (pathname === '/admin-dashboard/access') return 'access';
        if (pathname === '/admin-dashboard/system') return 'system';

        return 'dashboard';
    }, [location.pathname]);

    const navItems = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: '/admin-dashboard',
        },
        {
            key: 'users',
            label: 'Users',
            icon: Users,
            path: '/admin-dashboard/users',
        },
        {
            key: 'products',
            label: 'Products',
            icon: Package,
            path: '/admin-dashboard/products',
        },
        {
            key: 'requests',
            label: 'Requests',
            icon: ClipboardList,
            path: '/admin-dashboard/requests',
        },
        {
            key: 'support',
            label: 'Support',
            icon: HelpCircle,
            path: '/admin-dashboard/support',
        },
        {
            key: 'access',
            label: 'Admin Access',
            icon: ShieldCheck,
            path: '/admin-dashboard/access',
        },
        {
            key: 'system',
            label: 'Platform Status',
            icon: Server,
            path: '/admin-dashboard/system',
        },
    ];

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    });

    const fetchSupportTickets = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setSupportLoading(true);
            }

            const response = await fetch(
                `${API_BASE_URL}/support/admin/all`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Failed to load support tickets'
                );
            }

            setSupportTickets(
                data?.tickets ||
                data?.data ||
                []
            );
        } catch (err) {
            console.error(
                'Support tickets error:',
                err
            );

            if (currentSection === 'support') {
                setError(
                    err.message ||
                    'Unable to load support tickets.'
                );
            }
        } finally {
            setSupportLoading(false);
        }
    };

    const fetchAdminData = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const [
                statsRes,
                usersRes,
                productsRes,
                requestsRes,
            ] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/admin/stats?period=${period}`,
                    {
                        headers: getAuthHeaders(),
                    }
                ),
                fetch(
                    `${API_BASE_URL}/admin/users`,
                    {
                        headers: getAuthHeaders(),
                    }
                ),
                fetch(
                    `${API_BASE_URL}/admin/products`,
                    {
                        headers: getAuthHeaders(),
                    }
                ),
                fetch(
                    `${API_BASE_URL}/admin/requests`,
                    {
                        headers: getAuthHeaders(),
                    }
                ),
            ]);

            if (!statsRes.ok) {
                throw new Error(
                    'Failed to load platform statistics'
                );
            }

            if (!usersRes.ok) {
                throw new Error(
                    'Failed to load users'
                );
            }

            if (!productsRes.ok) {
                throw new Error(
                    'Failed to load products'
                );
            }

            if (!requestsRes.ok) {
                throw new Error(
                    'Failed to load requests'
                );
            }

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();
            const productsData = await productsRes.json();
            const requestsData = await requestsRes.json();

            /*
             * The API may return:
             * { success: true, data: [...] }
             * or
             * { success: true, users: [...] }
             * or the array directly.
             */

            const extractArray = (response, key) => {
                if (Array.isArray(response)) {
                    return response;
                }

                if (Array.isArray(response?.data)) {
                    return response.data;
                }

                if (Array.isArray(response?.[key])) {
                    return response[key];
                }

                if (Array.isArray(response?.data?.[key])) {
                    return response.data[key];
                }

                return [];
            };

            const extractStats = (response) => {
                if (
                    response?.data &&
                    !Array.isArray(response.data) &&
                    typeof response.data === 'object'
                ) {
                    return response.data;
                }

                if (
                    response?.stats &&
                    typeof response.stats === 'object'
                ) {
                    return response.stats;
                }

                return response || {};
            };

            setStats(extractStats(statsData));

            setUsers(
                extractArray(
                    usersData,
                    'users'
                )
            );

            setProducts(
                extractArray(
                    productsData,
                    'products'
                )
            );

            setRequests(
                extractArray(
                    requestsData,
                    'requests'
                )
            );

            await fetchSupportTickets();
        } catch (err) {
            console.error(
                'Admin dashboard error:',
                err
            );

            setError(
                err.message ||
                'Unable to load admin dashboard data.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let ignore = false;

        const loadDashboard = async () => {
            if (ignore) return;

            await fetchAdminData();
        };

        loadDashboard();

        return () => {
            ignore = true;
        };
    }, [period]);

    const formatCurrency = (value) => {
        const amount = Number(value || 0);

        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-NG').format(
            Number(value || 0)
        );
    };

    const formatDate = (date) => {
        if (!date) return '—';

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }

        return parsed.toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (date) => {
        if (!date) return '—';

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }

        return parsed.toLocaleString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPeriodLabel = () => {
        const labels = {
            weekly: 'This week',
            monthly: 'This month',
            annually: 'This year',
        };

        return labels[period] || 'This week';
    };

    const getStatusClass = (status) => {
        const normalized =
            String(status || '').toLowerCase();

        if (
            [
                'active',
                'available',
                'accepted',
                'paid',
                'completed',
                'confirmed',
                'resolved',
            ].includes(normalized)
        ) {
            return 'success';
        }

        if (
            [
                'pending',
                'processing',
                'unpaid',
                'inactive',
                'open',
                'in-progress',
            ].includes(normalized)
        ) {
            return 'warning';
        }

        if (
            [
                'rejected',
                'failed',
                'cancelled',
                'blocked',
                'suspended',
                'sold',
                'closed',
            ].includes(normalized)
        ) {
            return 'danger';
        }

        return 'neutral';
    };

    const getUserStatusIcon = (status) => {
        if (status === 'active') {
            return <CircleCheck size={14} />;
        }

        if (status === 'suspended') {
            return <CirclePause size={14} />;
        }

        if (status === 'blocked') {
            return <Ban size={14} />;
        }

        return <Activity size={14} />;
    };

    const getSupportStatusIcon = (status) => {
        if (status === 'resolved') {
            return <CheckCircle2 size={14} />;
        }

        if (status === 'closed') {
            return <XCircle size={14} />;
        }

        if (status === 'in-progress') {
            return <Clock3 size={14} />;
        }

        return <HelpCircle size={14} />;
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const updateUserStatus = async (
        userId,
        accountStatus
    ) => {
        try {
            setUpdatingUser(userId);

            const response = await fetch(
                `${API_BASE_URL}/admin/users/${userId}/status`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        accountStatus,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Unable to update user status.'
                );
            }

            setUsers((currentUsers) =>
                currentUsers.map((user) =>
                    user._id === userId
                        ? {
                            ...user,
                            accountStatus,
                        }
                        : user
                )
            );
        } catch (err) {
            console.error(
                'Update user status error:',
                err
            );

            alert(
                err.message ||
                'Unable to update the user status.'
            );
        } finally {
            setUpdatingUser(null);
        }
    };

    const updateUserVerification = async (
        userId,
        verificationStatus
    ) => {
        try {
            setUpdatingUser(userId);

            const response = await fetch(
                `${API_BASE_URL}/admin/users/${userId}/verification`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        verificationStatus,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Unable to update user verification.'
                );
            }

            setUsers((currentUsers) =>
                currentUsers.map((user) =>
                    user._id === userId
                        ? {
                            ...user,
                            verificationStatus,
                        }
                        : user
                )
            );
        } catch (err) {
            console.error(
                'Update user verification error:',
                err
            );

            alert(
                err.message ||
                'Unable to update user verification.'
            );
        } finally {
            setUpdatingUser(null);
        }
    };

    const respondToTicket = async (ticketId) => {
        const message = String(
            responseText[ticketId] || ''
        ).trim();

        if (!message) {
            alert(
                'Please enter a response before sending.'
            );
            return;
        }

        try {
            setRespondingTicket(ticketId);

            const response = await fetch(
                `${API_BASE_URL}/support/admin/${ticketId}/respond`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        adminResponse: message,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Unable to respond to ticket.'
                );
            }

            const updatedTicket =
                data?.ticket;

            if (updatedTicket) {
                setSupportTickets(
                    (currentTickets) =>
                        currentTickets.map(
                            (ticket) =>
                                ticket._id === ticketId
                                    ? updatedTicket
                                    : ticket
                        )
                );
            } else {
                await fetchSupportTickets();
            }

            setResponseText((current) => ({
                ...current,
                [ticketId]: '',
            }));
        } catch (err) {
            console.error(
                'Respond to support ticket error:',
                err
            );

            alert(
                err.message ||
                'Unable to send support response.'
            );
        } finally {
            setRespondingTicket(null);
        }
    };

    const updateTicketStatus = async (
        ticketId,
        status
    ) => {
        try {
            setUpdatingTicketStatus(ticketId);

            const response = await fetch(
                `${API_BASE_URL}/support/admin/${ticketId}/status`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Unable to update ticket status.'
                );
            }

            const updatedTicket =
                data?.ticket;

            if (updatedTicket) {
                setSupportTickets(
                    (currentTickets) =>
                        currentTickets.map(
                            (ticket) =>
                                ticket._id === ticketId
                                    ? updatedTicket
                                    : ticket
                        )
                );
            } else {
                await fetchSupportTickets();
            }
        } catch (err) {
            console.error(
                'Update ticket status error:',
                err
            );

            alert(
                err.message ||
                'Unable to update ticket status.'
            );
        } finally {
            setUpdatingTicketStatus(null);
        }
    };

    const filteredUsers = useMemo(() => {
        const query =
            userSearch.trim().toLowerCase();

        if (!query) return users;

        return users.filter((user) =>
            [
                user.name,
                user.email,
                user.role,
                user.phone,
                user.location,
                user.accountStatus,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value)
                        .toLowerCase()
                        .includes(query)
                )
        );
    }, [users, userSearch]);

    const filteredProducts = useMemo(() => {
        const query =
            productSearch.trim().toLowerCase();

        if (!query) return products;

        return products.filter((product) =>
            [
                product.name,
                product.category,
                product.location,
                product.status,
                product.farmer?.name,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value)
                        .toLowerCase()
                        .includes(query)
                )
        );
    }, [products, productSearch]);

    const filteredRequests = useMemo(() => {
        const query =
            requestSearch.trim().toLowerCase();

        if (!query) return requests;

        return requests.filter((request) =>
            [
                request.status,
                request.message,
                request.product?.name,
                request.buyer?.name,
                request.buyer?.email,
                request.farmer?.name,
                request.farmer?.email,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value)
                        .toLowerCase()
                        .includes(query)
                )
        );
    }, [requests, requestSearch]);

    const filteredSupportTickets = useMemo(() => {
        const query =
            supportSearch.trim().toLowerCase();

        return supportTickets.filter(
            (ticket) => {
                const matchesSearch =
                    !query ||
                    [
                        ticket.subject,
                        ticket.category,
                        ticket.status,
                        ticket.message,
                        ticket.user?.name,
                        ticket.user?.email,
                    ]
                        .filter(Boolean)
                        .some((value) =>
                            String(value)
                                .toLowerCase()
                                .includes(query)
                        );

                const matchesStatus =
                    supportStatusFilter ===
                    'all' ||
                    ticket.status ===
                    supportStatusFilter;

                const matchesCategory =
                    supportCategoryFilter ===
                    'all' ||
                    ticket.category ===
                    supportCategoryFilter;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesCategory
                );
            }
        );
    }, [
        supportTickets,
        supportSearch,
        supportStatusFilter,
        supportCategoryFilter,
    ]);

    const dashboardStats = useMemo(() => {
        const source = stats || {};

        const salesReport =
            source.salesReport || {};

        const allTimeSales =
            source.allTimeSales || {};

        return {
            users:
                source.users ??
                source.totalUsers ??
                users.length,

            farmers:
                source.farmers ??
                source.totalFarmers ??
                users.filter(
                    (user) =>
                        user.role === 'farmer'
                ).length,

            buyers:
                source.buyers ??
                source.totalBuyers ??
                users.filter(
                    (user) =>
                        user.role === 'buyer'
                ).length,

            products:
                source.products ??
                source.totalProducts ??
                products.length,

            requests:
                source.requests ??
                source.totalRequests ??
                requests.length,

            pendingRequests:
                source.pendingRequests ??
                requests.filter(
                    (request) =>
                        request.status ===
                        'pending'
                ).length,

            revenue:
                salesReport.totalSales ??
                allTimeSales.totalSales ??
                source.revenue ??
                source.totalRevenue ??
                source.sales ??
                0,

            platformFee:
                salesReport.platformFee ??
                allTimeSales.platformFee ??
                source.platformFee ??
                source.totalPlatformFee ??
                0,
        };
    }, [
        stats,
        users,
        products,
        requests,
    ]);

    const supportSummary = useMemo(() => {
        return {
            total: supportTickets.length,

            open: supportTickets.filter(
                (ticket) =>
                    ticket.status === 'open'
            ).length,

            inProgress: supportTickets.filter(
                (ticket) =>
                    ticket.status === 'in-progress'
            ).length,

            resolved: supportTickets.filter(
                (ticket) =>
                    ticket.status === 'resolved'
            ).length,

            closed: supportTickets.filter(
                (ticket) =>
                    ticket.status === 'closed'
            ).length,
        };
    }, [supportTickets]);

    const trendData = useMemo(() => {
        const possible =
            stats?.salesReport?.trend ||
            stats?.trend ||
            stats?.salesTrend ||
            [];

        if (!Array.isArray(possible)) {
            return [];
        }

        return possible.map((item) => ({
            label:
                item.label ||
                item.period ||
                item.date ||
                '',

            value:
                Number(
                    item.value ??
                    item.amount ??
                    item.sales ??
                    0
                ) || 0,
        }));
    }, [stats]);

    const maxTrendValue = Math.max(
        ...trendData.map(
            (item) => item.value
        ),
        1
    );

    const pageMeta = {
        dashboard: {
            title: 'Dashboard',
            subtitle:
                'Monitor FarmLink activity, growth and platform performance.',
        },
        users: {
            title: 'User Management',
            subtitle:
                'Manage buyers, farmers and account access.',
        },
        products: {
            title: 'Product Management',
            subtitle:
                'Monitor agricultural products listed on FarmLink.',
        },
        requests: {
            title: 'Request Management',
            subtitle:
                'Monitor buyer requests and farmer responses.',
        },
        support: {
            title: 'Support Center',
            subtitle:
                'Review user issues and respond to support tickets.',
        },
        access: {
            title: 'Admin Access',
            subtitle:
                'Review administrative permissions and security controls.',
        },
        system: {
            title: 'Platform Status',
            subtitle:
                'Monitor the health and configuration of FarmLink services.',
        },
    };

    // Keep the rest of your existing AdminDashboard.jsx
    // from renderHeader() downward exactly as it is.


    const renderHeader = () => (
        <header className="admin-topbar">
            <div>
                <div className="admin-breadcrumb">
                    Administration
                    <ChevronRight size={14} />
                    <span>
                        {
                            pageMeta[
                                currentSection
                            ].title
                        }
                    </span>
                </div>

                <h1>
                    {
                        pageMeta[
                            currentSection
                        ].title
                    }
                </h1>

                <p>
                    {
                        pageMeta[
                            currentSection
                        ].subtitle
                    }
                </p>
            </div>

            <div className="admin-topbar-actions">
                <button
                    className="admin-refresh-btn"
                    onClick={() => {
                        if (
                            currentSection ===
                            'support'
                        ) {
                            fetchSupportTickets(
                                true
                            );
                        } else {
                            fetchAdminData(true);
                        }
                    }}
                    disabled={
                        refreshing ||
                        supportLoading
                    }
                >
                    <RefreshCw
                        size={17}
                        className={
                            refreshing ||
                                supportLoading
                                ? 'admin-spin'
                                : ''
                        }
                    />

                    {refreshing ||
                        supportLoading
                        ? 'Refreshing'
                        : 'Refresh'}
                </button>

                {currentSection ===
                    'dashboard' && (
                        <select
                            value={period}
                            onChange={(event) =>
                                setPeriod(
                                    event.target.value
                                )
                            }
                            className="admin-period-select"
                        >
                            <option value="weekly">
                                This week
                            </option>

                            <option value="monthly">
                                This month
                            </option>

                            <option value="annually">
                                This year
                            </option>
                        </select>
                    )}
            </div>
        </header>
    );

    const renderMetricCard = ({
        icon,
        label,
        value,
        description,
        className = '',
    }) => (
        <div
            className={`admin-metric-card ${className}`}
        >
            <div className="admin-metric-top">
                <div className="admin-metric-icon">
                    {icon}
                </div>

                <ArrowUpRight size={17} />
            </div>

            <div className="admin-metric-value">
                {value}
            </div>

            <div className="admin-metric-label">
                {label}
            </div>

            {description && (
                <div className="admin-metric-description">
                    {description}
                </div>
            )}
        </div>
    );

    const renderDashboard = () => (
        <>
            <section className="admin-welcome">
                <div>
                    <span className="admin-eyebrow">
                        FarmLink Control Center
                    </span>

                    <h2>
                        Platform overview
                    </h2>

                    <p>
                        A quick view of users,
                        products, requests and
                        platform activity for{' '}
                        {getPeriodLabel().toLowerCase()}.
                    </p>
                </div>

                <div className="admin-welcome-status">
                    <span className="admin-live-dot" />
                    Platform operational
                </div>
            </section>

            <section className="admin-metrics-grid">
                {renderMetricCard({
                    icon: <Users size={20} />,
                    label: 'Total Users',
                    value: formatNumber(
                        dashboardStats.users
                    ),
                    description: `${formatNumber(
                        dashboardStats.farmers
                    )} farmers · ${formatNumber(
                        dashboardStats.buyers
                    )} buyers`,
                })}

                {renderMetricCard({
                    icon: <Package size={20} />,
                    label: 'Products',
                    value: formatNumber(
                        dashboardStats.products
                    ),
                    description:
                        'Produce currently registered on the platform',
                })}

                {renderMetricCard({
                    icon: (
                        <ClipboardList
                            size={20}
                        />
                    ),
                    label: 'Requests',
                    value: formatNumber(
                        dashboardStats.requests
                    ),
                    description: `${formatNumber(
                        dashboardStats.pendingRequests
                    )} pending requests`,
                })}

                {renderMetricCard({
                    icon: (
                        <CreditCard
                            size={20}
                        />
                    ),
                    label: 'Platform Revenue',
                    value: formatCurrency(
                        dashboardStats.revenue
                    ),
                    description:
                        'Recorded transaction value',
                })}
            </section>

            <section className="admin-content-grid">
                <div className="admin-panel admin-chart-panel">
                    <div className="admin-panel-header">
                        <div>
                            <span className="admin-panel-kicker">
                                Sales analytics
                            </span>

                            <h3>
                                Revenue performance
                            </h3>
                        </div>

                        <span className="admin-panel-period">
                            {getPeriodLabel()}
                        </span>
                    </div>

                    {trendData.length >
                        0 ? (
                        <div className="admin-trend-chart">
                            {trendData.map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        className="admin-trend-column"
                                        key={`${item.label}-${index}`}
                                    >
                                        <div className="admin-trend-value">
                                            {formatCurrency(
                                                item.value
                                            )}
                                        </div>

                                        <div className="admin-trend-track">
                                            <div
                                                className="admin-trend-bar"
                                                style={{
                                                    height: `${Math.max(
                                                        6,
                                                        (item.value /
                                                            maxTrendValue) *
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>

                                        <span>
                                            {
                                                item.label
                                            }
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="admin-empty-chart">
                            <TrendingUp size={30} />

                            <strong>
                                Sales analytics ready
                            </strong>

                            <span>
                                Transaction trend
                                data will appear
                                here as sales
                                activity grows.
                            </span>
                        </div>
                    )}
                </div>

                <div className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <span className="admin-panel-kicker">
                                Snapshot
                            </span>

                            <h3>
                                Platform health
                            </h3>
                        </div>

                        <Activity size={19} />
                    </div>

                    <div className="admin-health-list">
                        <div className="admin-health-row">
                            <div>
                                <Database
                                    size={18}
                                />

                                <span>
                                    Database
                                </span>
                            </div>

                            <span className="admin-status success">
                                <CircleCheck
                                    size={14}
                                />

                                Connected
                            </span>
                        </div>

                        <div className="admin-health-row">
                            <div>
                                <Cloud size={18} />

                                <span>
                                    Image storage
                                </span>
                            </div>

                            <span className="admin-status success">
                                <CircleCheck
                                    size={14}
                                />

                                Available
                            </span>
                        </div>

                        <div className="admin-health-row">
                            <div>
                                <CreditCard
                                    size={18}
                                />

                                <span>
                                    Payments
                                </span>
                            </div>

                            <span className="admin-status warning">
                                <CirclePause
                                    size={14}
                                />

                                Test mode
                            </span>
                        </div>

                        <div className="admin-health-row">
                            <div>
                                <LockKeyhole
                                    size={18}
                                />

                                <span>
                                    Authentication
                                </span>
                            </div>

                            <span className="admin-status success">
                                <CircleCheck
                                    size={14}
                                />

                                Protected
                            </span>
                        </div>
                    </div>

                    <div className="admin-fee-box">
                        <span>
                            FarmLink platform fee
                        </span>

                        <strong>
                            2.5%
                        </strong>
                    </div>
                </div>
            </section>

            <section className="admin-content-grid">
                <div className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <span className="admin-panel-kicker">
                                User activity
                            </span>

                            <h3>
                                Account distribution
                            </h3>
                        </div>

                        <button
                            className="admin-text-btn"
                            onClick={() =>
                                navigate(
                                    '/admin-dashboard/users'
                                )
                            }
                        >
                            View users
                            <ArrowUpRight
                                size={15}
                            />
                        </button>
                    </div>

                    <div className="admin-distribution">
                        <div className="admin-distribution-item">
                            <div className="admin-distribution-icon farmer">
                                <UserCheck
                                    size={20}
                                />
                            </div>

                            <div>
                                <strong>
                                    {formatNumber(
                                        dashboardStats.farmers
                                    )}
                                </strong>

                                <span>
                                    Farmers
                                </span>
                            </div>
                        </div>

                        <div className="admin-distribution-item">
                            <div className="admin-distribution-icon buyer">
                                <ShoppingCart
                                    size={20}
                                />
                            </div>

                            <div>
                                <strong>
                                    {formatNumber(
                                        dashboardStats.buyers
                                    )}
                                </strong>

                                <span>
                                    Buyers
                                </span>
                            </div>
                        </div>

                        <div className="admin-distribution-item">
                            <div className="admin-distribution-icon product">
                                <Package
                                    size={20}
                                />
                            </div>

                            <div>
                                <strong>
                                    {formatNumber(
                                        dashboardStats.products
                                    )}
                                </strong>

                                <span>
                                    Products
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <span className="admin-panel-kicker">
                                Requests
                            </span>

                            <h3>
                                Current activity
                            </h3>
                        </div>

                        <button
                            className="admin-text-btn"
                            onClick={() =>
                                navigate(
                                    '/admin-dashboard/requests'
                                )
                            }
                        >
                            View requests
                            <ArrowUpRight
                                size={15}
                            />
                        </button>
                    </div>

                    <div className="admin-request-summary">
                        <div>
                            <span className="admin-summary-number">
                                {formatNumber(
                                    dashboardStats.pendingRequests
                                )}
                            </span>

                            <span>
                                Pending requests
                            </span>
                        </div>

                        <div>
                            <span className="admin-summary-number">
                                {formatNumber(
                                    requests.filter(
                                        (
                                            request
                                        ) =>
                                            request.status ===
                                            'accepted'
                                    ).length
                                )}
                            </span>

                            <span>
                                Accepted
                            </span>
                        </div>

                        <div>
                            <span className="admin-summary-number">
                                {formatNumber(
                                    requests.filter(
                                        (
                                            request
                                        ) =>
                                            request.status ===
                                            'rejected'
                                    ).length
                                )}
                            </span>

                            <span>
                                Rejected
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );

    const renderUsers = () => (
        <section className="admin-panel admin-full-panel">
            <div className="admin-panel-header admin-table-heading">
                <div>
                    <span className="admin-panel-kicker">
                        Account directory
                    </span>

                    <h3>
                        All registered users
                    </h3>

                    <p>
                        Review account information
                        and control account status.
                    </p>
                </div>

                <div className="admin-table-tools">
                    <div className="admin-search">
                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(event) =>
                                setUserSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <span className="admin-count-badge">
                        {filteredUsers.length}{' '}
                        users
                    </span>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Location</th>
                            <th>Joined</th>
                            <th>Terms</th>
                            <th>Verification</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredUsers.length ===
                            0 ? (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="admin-table-empty"
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(
                                (user) => (
                                    <tr
                                        key={
                                            user._id
                                        }
                                    >
                                        <td>
                                            <div className="admin-user-cell">
                                                <div className="admin-avatar">
                                                    {user.name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        ?.toUpperCase() ||
                                                        'U'}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {user.name ||
                                                            'Unnamed user'}
                                                    </strong>

                                                    <span>
                                                        {user.email ||
                                                            'No email'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="admin-role">
                                                {
                                                    user.role
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            {user.location ||
                                                '—'}
                                        </td>

                                        <td>
                                            {formatDate(
                                                user.createdAt
                                            )}
                                        </td>
                                        <td>
                                            {user.termsAccepted ? 'Accepted' : 'Not accepted'}
                                        </td>

                                        <td>
                                            {user.role === 'admin' ? (
                                                <span className="admin-protected-label">
                                                    Protected
                                                </span>
                                            ) : (
                                                <select
                                                    className="admin-status-select"
                                                    value={
                                                        user.verificationStatus ||
                                                        'unverified'
                                                    }
                                                    disabled={
                                                        updatingUser === user._id
                                                    }
                                                    onChange={(event) =>
                                                        updateUserVerification(
                                                            user._id,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="unverified">
                                                        Unverified
                                                    </option>

                                                    <option value="verified">
                                                        Verified
                                                    </option>
                                                </select>
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-status ${getStatusClass(
                                                    user.accountStatus
                                                )}`}
                                            >
                                                {getUserStatusIcon(
                                                    user.accountStatus
                                                )}

                                                {user.accountStatus ||
                                                    'active'}
                                            </span>
                                        </td>

                                        <td>
                                            {user.role ===
                                                'admin' ? (
                                                <span className="admin-protected-label">
                                                    Protected
                                                </span>
                                            ) : (
                                                <select
                                                    className="admin-status-select"
                                                    value={
                                                        user.accountStatus ||
                                                        'active'
                                                    }
                                                    disabled={
                                                        updatingUser ===
                                                        user._id
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateUserStatus(
                                                            user._id,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="active">
                                                        Active
                                                    </option>

                                                    <option value="suspended">
                                                        Suspended
                                                    </option>

                                                    <option value="blocked">
                                                        Blocked
                                                    </option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );

    const renderProducts = () => (
        <section className="admin-panel admin-full-panel">
            <div className="admin-panel-header admin-table-heading">
                <div>
                    <span className="admin-panel-kicker">
                        Marketplace inventory
                    </span>

                    <h3>
                        All listed products
                    </h3>

                    <p>
                        Monitor produce uploaded
                        by farmers across
                        FarmLink.
                    </p>
                </div>

                <div className="admin-table-tools">
                    <div className="admin-search">
                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search products..."
                            value={
                                productSearch
                            }
                            onChange={(event) =>
                                setProductSearch(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <span className="admin-count-badge">
                        {
                            filteredProducts.length
                        }{' '}
                        products
                    </span>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>
                                Product
                            </th>
                            <th>
                                Category
                            </th>
                            <th>
                                Farmer
                            </th>
                            <th>
                                Quantity
                            </th>
                            <th>
                                Price
                            </th>
                            <th>
                                Status
                            </th>
                            <th>
                                Listed
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredProducts.length ===
                            0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="admin-table-empty"
                                >
                                    No products
                                    found.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map(
                                (
                                    product
                                ) => (
                                    <tr
                                        key={
                                            product._id
                                        }
                                    >
                                        <td>
                                            <div className="admin-product-cell">
                                                {product.image ? (
                                                    <img
                                                        src={
                                                            product.image
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                    />
                                                ) : (
                                                    <div className="admin-product-placeholder">
                                                        <Package
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                <strong>
                                                    {product.name ||
                                                        'Unnamed product'}
                                                </strong>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="admin-category">
                                                {product.category ||
                                                    '—'}
                                            </span>
                                        </td>

                                        <td>
                                            {product
                                                .farmer
                                                ?.name ||
                                                'Unknown farmer'}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                product.quantity
                                            )}{' '}
                                            {product.unit ||
                                                ''}
                                        </td>

                                        <td>
                                            <strong>
                                                {formatCurrency(
                                                    product.price
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-status ${getStatusClass(
                                                    product.status
                                                )}`}
                                            >
                                                {product.status ||
                                                    'available'}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(
                                                product.createdAt
                                            )}
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );

    const renderRequests = () => (
        <section className="admin-panel admin-full-panel">
            <div className="admin-panel-header admin-table-heading">
                <div>
                    <span className="admin-panel-kicker">
                        Marketplace activity
                    </span>

                    <h3>
                        Buyer requests
                    </h3>

                    <p>
                        Monitor requests between
                        buyers and farmers.
                    </p>
                </div>

                <div className="admin-table-tools">
                    <div className="admin-search">
                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={
                                requestSearch
                            }
                            onChange={(event) =>
                                setRequestSearch(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <span className="admin-count-badge">
                        {
                            filteredRequests.length
                        }{' '}
                        requests
                    </span>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>
                                Product
                            </th>
                            <th>
                                Buyer
                            </th>
                            <th>
                                Farmer
                            </th>
                            <th>
                                Quantity
                            </th>
                            <th>
                                Status
                            </th>
                            <th>
                                Requested
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRequests.length ===
                            0 ? (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="admin-table-empty"
                                >
                                    No requests
                                    found.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map(
                                (
                                    request
                                ) => (
                                    <tr
                                        key={
                                            request._id
                                        }
                                    >
                                        <td>
                                            <div>
                                                <strong>
                                                    {request
                                                        .product
                                                        ?.name ||
                                                        'Unknown product'}
                                                </strong>

                                                {request.message && (
                                                    <span className="admin-table-secondary">
                                                        {
                                                            request.message
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <div>
                                                <strong>
                                                    {request
                                                        .buyer
                                                        ?.name ||
                                                        'Unknown buyer'}
                                                </strong>

                                                <span className="admin-table-secondary">
                                                    {request
                                                        .buyer
                                                        ?.email ||
                                                        ''}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            {request
                                                .farmer
                                                ?.name ||
                                                'Unknown farmer'}
                                        </td>

                                        <td>
                                            {formatNumber(
                                                request.quantity
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-status ${getStatusClass(
                                                    request.status
                                                )}`}
                                            >
                                                {request.status ===
                                                    'accepted' && (
                                                        <CheckCircle2
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    )}

                                                {request.status ===
                                                    'rejected' && (
                                                        <XCircle
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    )}

                                                {request.status ===
                                                    'pending' && (
                                                        <Clock3
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    )}

                                                {request.status ||
                                                    'pending'}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(
                                                request.createdAt
                                            )}
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );

    const renderSupport = () => (
        <div className="admin-support-page">
            <section className="admin-support-summary-grid">
                <div className="admin-support-summary-card">
                    <div className="admin-support-summary-icon">
                        <MessageSquare
                            size={20}
                        />
                    </div>

                    <div>
                        <strong>
                            {formatNumber(
                                supportSummary.total
                            )}
                        </strong>

                        <span>
                            Total tickets
                        </span>
                    </div>
                </div>

                <div className="admin-support-summary-card">
                    <div className="admin-support-summary-icon open">
                        <HelpCircle
                            size={20}
                        />
                    </div>

                    <div>
                        <strong>
                            {formatNumber(
                                supportSummary.open
                            )}
                        </strong>

                        <span>
                            Open
                        </span>
                    </div>
                </div>

                <div className="admin-support-summary-card">
                    <div className="admin-support-summary-icon progress">
                        <Clock3
                            size={20}
                        />
                    </div>

                    <div>
                        <strong>
                            {formatNumber(
                                supportSummary.inProgress
                            )}
                        </strong>

                        <span>
                            In progress
                        </span>
                    </div>
                </div>

                <div className="admin-support-summary-card">
                    <div className="admin-support-summary-icon resolved">
                        <CheckCircle2
                            size={20}
                        />
                    </div>

                    <div>
                        <strong>
                            {formatNumber(
                                supportSummary.resolved
                            )}
                        </strong>

                        <span>
                            Resolved
                        </span>
                    </div>
                </div>
            </section>

            <section className="admin-panel admin-full-panel">
                <div className="admin-panel-header admin-table-heading">
                    <div>
                        <span className="admin-panel-kicker">
                            Customer support
                        </span>

                        <h3>
                            Support tickets
                        </h3>

                        <p>
                            Review user issues,
                            respond to them and
                            manage ticket status.
                        </p>
                    </div>

                    <div className="admin-support-total-badge">
                        <MessageSquare
                            size={15}
                        />

                        {filteredSupportTickets.length}{' '}
                        shown
                    </div>
                </div>

                <div className="admin-support-filters">
                    <div className="admin-search admin-support-search">
                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search tickets, users, subjects..."
                            value={
                                supportSearch
                            }
                            onChange={(event) =>
                                setSupportSearch(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div className="admin-filter-select">
                        <Filter size={15} />

                        <select
                            value={
                                supportStatusFilter
                            }
                            onChange={(event) =>
                                setSupportStatusFilter(
                                    event.target
                                        .value
                                )
                            }
                        >
                            <option value="all">
                                All statuses
                            </option>

                            <option value="open">
                                Open
                            </option>

                            <option value="in-progress">
                                In Progress
                            </option>

                            <option value="resolved">
                                Resolved
                            </option>

                            <option value="closed">
                                Closed
                            </option>
                        </select>
                    </div>

                    <div className="admin-filter-select">
                        <Filter size={15} />

                        <select
                            value={
                                supportCategoryFilter
                            }
                            onChange={(event) =>
                                setSupportCategoryFilter(
                                    event.target
                                        .value
                                )
                            }
                        >
                            <option value="all">
                                All categories
                            </option>

                            <option value="account">
                                Account
                            </option>

                            <option value="payment">
                                Payment
                            </option>

                            <option value="order">
                                Order
                            </option>

                            <option value="product">
                                Product
                            </option>

                            <option value="technical">
                                Technical
                            </option>

                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>
                </div>

                {supportLoading ? (
                    <div className="admin-support-loading">
                        <RefreshCw
                            size={24}
                            className="admin-spin"
                        />

                        <span>
                            Loading support
                            tickets...
                        </span>
                    </div>
                ) : filteredSupportTickets.length ===
                    0 ? (
                    <div className="admin-support-empty">
                        <div className="admin-support-empty-icon">
                            <MessageSquare
                                size={27}
                            />
                        </div>

                        <strong>
                            No support tickets
                        </strong>

                        <span>
                            There are no tickets
                            matching the current
                            filters.
                        </span>
                    </div>
                ) : (
                    <div className="admin-ticket-list">
                        {filteredSupportTickets.map(
                            (ticket) => {
                                const isExpanded =
                                    expandedTicket ===
                                    ticket._id;

                                return (
                                    <article
                                        key={
                                            ticket._id
                                        }
                                        className={`admin-ticket-card ${isExpanded
                                            ? 'expanded'
                                            : ''
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            className="admin-ticket-header"
                                            onClick={() =>
                                                setExpandedTicket(
                                                    isExpanded
                                                        ? null
                                                        : ticket._id
                                                )
                                            }
                                        >
                                            <div className="admin-ticket-main">
                                                <div className="admin-ticket-icon">
                                                    <MessageSquare
                                                        size={
                                                            19
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-ticket-title">
                                                    <strong>
                                                        {
                                                            ticket.subject
                                                        }
                                                    </strong>

                                                    <div className="admin-ticket-meta">
                                                        <span>
                                                            {ticket
                                                                .user
                                                                ?.name ||
                                                                'Unknown user'}
                                                        </span>

                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            {
                                                                ticket.category
                                                            }
                                                        </span>

                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            {formatDate(
                                                                ticket.createdAt
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="admin-ticket-header-right">
                                                <span
                                                    className={`admin-status ${getStatusClass(
                                                        ticket.status
                                                    )}`}
                                                >
                                                    {getSupportStatusIcon(
                                                        ticket.status
                                                    )}

                                                    {String(
                                                        ticket.status ||
                                                        'open'
                                                    ).replace(
                                                        '-',
                                                        ' '
                                                    )}
                                                </span>

                                                {isExpanded ? (
                                                    <ChevronUp
                                                        size={
                                                            18
                                                        }
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        size={
                                                            18
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="admin-ticket-content">
                                                <div className="admin-ticket-user">
                                                    <div className="admin-ticket-user-heading">
                                                        <User
                                                            size={
                                                                17
                                                            }
                                                        />

                                                        <strong>
                                                            User information
                                                        </strong>
                                                    </div>

                                                    <div className="admin-ticket-user-grid">
                                                        <div>
                                                            <span>
                                                                <User
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                Name
                                                            </span>

                                                            <strong>
                                                                {ticket
                                                                    .user
                                                                    ?.name ||
                                                                    '—'}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                <Mail
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                Email
                                                            </span>

                                                            <strong>
                                                                {ticket
                                                                    .user
                                                                    ?.email ||
                                                                    '—'}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                <Phone
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                Phone
                                                            </span>

                                                            <strong>
                                                                {ticket
                                                                    .user
                                                                    ?.phone ||
                                                                    '—'}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                <ShieldCheck
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                Role
                                                            </span>

                                                            <strong>
                                                                {ticket
                                                                    .user
                                                                    ?.role ||
                                                                    '—'}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="admin-ticket-message">
                                                    <div className="admin-ticket-section-label">
                                                        User message
                                                    </div>

                                                    <div className="admin-ticket-message-box">
                                                        {
                                                            ticket.message
                                                        }
                                                    </div>
                                                </div>

                                                {ticket.adminResponse && (
                                                    <div className="admin-ticket-response-existing">
                                                        <div className="admin-ticket-section-label">
                                                            Previous admin response
                                                        </div>

                                                        <div className="admin-ticket-message-box response">
                                                            {
                                                                ticket.adminResponse
                                                            }

                                                            {ticket.respondedAt && (
                                                                <span className="admin-ticket-response-time">
                                                                    Responded{' '}
                                                                    {formatDateTime(
                                                                        ticket.respondedAt
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="admin-ticket-actions">
                                                    <div className="admin-ticket-status-control">
                                                        <label>
                                                            Ticket
                                                            status
                                                        </label>

                                                        <select
                                                            value={
                                                                ticket.status ||
                                                                'open'
                                                            }
                                                            disabled={
                                                                updatingTicketStatus ===
                                                                ticket._id
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateTicketStatus(
                                                                    ticket._id,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            <option value="open">
                                                                Open
                                                            </option>

                                                            <option value="in-progress">
                                                                In Progress
                                                            </option>

                                                            <option value="resolved">
                                                                Resolved
                                                            </option>

                                                            <option value="closed">
                                                                Closed
                                                            </option>
                                                        </select>
                                                    </div>

                                                    {ticket.status !==
                                                        'closed' && (
                                                            <div className="admin-ticket-reply">
                                                                <label>
                                                                    Reply
                                                                    to
                                                                    user
                                                                </label>

                                                                <textarea
                                                                    placeholder="Write a helpful response to the user..."
                                                                    value={
                                                                        responseText[
                                                                        ticket
                                                                            ._id
                                                                        ] ||
                                                                        ''
                                                                    }
                                                                    maxLength={
                                                                        2000
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        setResponseText(
                                                                            (
                                                                                current
                                                                            ) => ({
                                                                                ...current,
                                                                                [ticket._id]:
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                            })
                                                                        )
                                                                    }
                                                                />

                                                                <div className="admin-ticket-reply-footer">
                                                                    <span>
                                                                        {
                                                                            (
                                                                                responseText[
                                                                                ticket
                                                                                    ._id
                                                                                ] ||
                                                                                ''
                                                                            ).length
                                                                        }{' '}
                                                                        / 2000
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            respondToTicket(
                                                                                ticket._id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            respondingTicket ===
                                                                            ticket._id
                                                                        }
                                                                    >
                                                                        <Send
                                                                            size={
                                                                                15
                                                                            }
                                                                        />

                                                                        {respondingTicket ===
                                                                            ticket._id
                                                                            ? 'Sending...'
                                                                            : 'Send response'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </section>
        </div>
    );

    const renderAccess = () => (
        <div className="admin-access-grid">
            <section className="admin-panel">
                <div className="admin-panel-header">
                    <div>
                        <span className="admin-panel-kicker">
                            Security
                        </span>

                        <h3>
                            Administrative access
                        </h3>
                    </div>

                    <ShieldCheck
                        size={22}
                    />
                </div>

                <div className="admin-access-hero">
                    <div className="admin-access-icon">
                        <LockKeyhole
                            size={27}
                        />
                    </div>

                    <div>
                        <strong>
                            Protected administrator
                            area
                        </strong>

                        <p>
                            Administrative routes
                            require a valid
                            authenticated
                            administrator account.
                        </p>
                    </div>
                </div>

                <div className="admin-access-list">
                    <div>
                        <span>
                            Authentication
                        </span>

                        <strong>
                            JWT protected
                        </strong>
                    </div>

                    <div>
                        <span>
                            Role control
                        </span>

                        <strong>
                            Admin only
                        </strong>
                    </div>

                    <div>
                        <span>
                            Public registration
                        </span>

                        <strong>
                            Buyer / Farmer only
                        </strong>
                    </div>

                    <div>
                        <span>
                            Account enforcement
                        </span>

                        <strong>
                            Active / Suspended /
                            Blocked
                        </strong>
                    </div>
                </div>
            </section>

            <section className="admin-panel">
                <div className="admin-panel-header">
                    <div>
                        <span className="admin-panel-kicker">
                            Account policy
                        </span>

                        <h3>
                            Administrator safeguards
                        </h3>
                    </div>

                    <UserCheck
                        size={22}
                    />
                </div>

                <div className="admin-policy-list">
                    <div>
                        <CheckCircle2
                            size={19}
                        />

                        <span>
                            Administrator accounts
                            cannot be modified
                            through normal user
                            controls.
                        </span>
                    </div>

                    <div>
                        <CheckCircle2
                            size={19}
                        />

                        <span>
                            Suspended and blocked
                            accounts are prevented
                            from accessing the
                            platform.
                        </span>
                    </div>

                    <div>
                        <CheckCircle2
                            size={19}
                        />

                        <span>
                            New public registrations
                            cannot create
                            administrator accounts.
                        </span>
                    </div>

                    <div>
                        <AlertTriangle
                            size={19}
                        />

                        <span>
                            Change the temporary
                            admin password before
                            production deployment.
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderSystem = () => (
        <>
            <section className="admin-system-hero">
                <div className="admin-system-icon">
                    <Server size={29} />
                </div>

                <div>
                    <span className="admin-eyebrow">
                        System monitoring
                    </span>

                    <h2>
                        FarmLink services are
                        operational
                    </h2>

                    <p>
                        The main application services
                        are connected and ready for
                        continued development.
                    </p>
                </div>

                <div className="admin-system-badge">
                    <span className="admin-live-dot" />
                    Operational
                </div>
            </section>

            <section className="admin-system-grid">
                <div className="admin-system-card">
                    <div className="admin-system-card-icon">
                        <Database size={21} />
                    </div>

                    <span>
                        Database
                    </span>

                    <strong>
                        MongoDB
                    </strong>

                    <div className="admin-system-status">
                        <CircleCheck
                            size={15}
                        />

                        Connected
                    </div>
                </div>

                <div className="admin-system-card">
                    <div className="admin-system-card-icon">
                        <Cloud size={21} />
                    </div>

                    <span>
                        Media storage
                    </span>

                    <strong>
                        Cloudinary
                    </strong>

                    <div className="admin-system-status">
                        <CircleCheck
                            size={15}
                        />

                        Available
                    </div>
                </div>

                <div className="admin-system-card">
                    <div className="admin-system-card-icon">
                        <CreditCard
                            size={21}
                        />
                    </div>

                    <span>
                        Payment gateway
                    </span>

                    <strong>
                        Paystack
                    </strong>

                    <div className="admin-system-status warning">
                        <CirclePause
                            size={15}
                        />

                        Test mode
                    </div>
                </div>

                <div className="admin-system-card">
                    <div className="admin-system-card-icon">
                        <LockKeyhole
                            size={21}
                        />
                    </div>

                    <span>
                        Authentication
                    </span>

                    <strong>
                        JWT
                    </strong>

                    <div className="admin-system-status">
                        <CircleCheck
                            size={15}
                        />

                        Protected
                    </div>
                </div>
            </section>

            <section className="admin-panel">
                <div className="admin-panel-header">
                    <div>
                        <span className="admin-panel-kicker">
                            Environment
                        </span>

                        <h3>
                            Development configuration
                        </h3>
                    </div>
                </div>

                <div className="admin-environment-list">
                    <div>
                        <span>
                            Frontend
                        </span>

                        <strong>
                            React + Vite
                        </strong>
                    </div>

                    <div>
                        <span>
                            Backend
                        </span>

                        <strong>
                            Node.js + Express
                        </strong>
                    </div>

                    <div>
                        <span>
                            Database
                        </span>

                        <strong>
                            MongoDB + Mongoose
                        </strong>
                    </div>

                    <div>
                        <span>
                            Payments
                        </span>

                        <strong>
                            Paystack Test
                            Environment
                        </strong>
                    </div>

                    <div>
                        <span>
                            FarmLink platform fee
                        </span>

                        <strong>
                            2.5%
                        </strong>
                    </div>
                </div>
            </section>
        </>
    );

    const renderCurrentSection = () => {
        switch (currentSection) {
            case 'users':
                return renderUsers();

            case 'products':
                return renderProducts();

            case 'requests':
                return renderRequests();

            case 'support':
                return renderSupport();

            case 'access':
                return renderAccess();

            case 'system':
                return renderSystem();

            case 'dashboard':
            default:
                return renderDashboard();
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-loading">
                    <div className="admin-loading-spinner">
                        <RefreshCw
                            size={28}
                            className="admin-spin"
                        />
                    </div>

                    <h2>
                        Loading Admin Dashboard
                    </h2>

                    <p>
                        Preparing your FarmLink
                        platform overview...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .admin-page {
                    min-height: 100vh;
                    background:
                        radial-gradient(
                            circle at top right,
                            rgba(34, 197, 94, 0.08),
                            transparent 30%
                        ),
                        #f5f7f6;
                    color: #17231c;
                    display: flex;
                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .admin-sidebar {
                    width: 260px;
                    min-height: 100vh;
                    background:
                        linear-gradient(
                            180deg,
                            #102a1c 0%,
                            #0c2117 100%
                        );
                    color: #fff;
                    padding: 26px 18px;
                    position: sticky;
                    top: 0;
                    align-self: flex-start;
                    display: flex;
                    flex-direction: column;
                    z-index: 20;
                }

                .admin-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 4px 10px 28px;
                }

                .admin-brand-mark {
                    width: 42px;
                    height: 42px;
                    border-radius: 13px;
                    background: rgba(255, 255, 255, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }

                .admin-brand-text strong {
                    display: block;
                    font-size: 17px;
                    letter-spacing: -0.3px;
                }

                .admin-brand-text span {
                    color: #a9c5b3;
                    font-size: 11px;
                    margin-top: 2px;
                    display: block;
                }

                .admin-nav {
                    display: grid;
                    gap: 7px;
                }

                .admin-nav-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #789a86;
                    padding: 12px 11px 8px;
                    font-weight: 800;
                }

                .admin-nav-item {
                    width: 100%;
                    border: 0;
                    background: transparent;
                    color: #b9cdbf;
                    padding: 12px 13px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 650;
                    text-align: left;
                    transition: 0.2s ease;
                }

                .admin-nav-item:hover {
                    background: rgba(255,255,255,0.07);
                    color: #fff;
                }

                .admin-nav-item.active {
                    background: #fff;
                    color: #123622;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.12);
                }

                .admin-nav-item svg {
                    flex-shrink: 0;
                }

                .admin-sidebar-bottom {
                    margin-top: auto;
                    padding-top: 22px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }

                .admin-security-mini {
                    padding: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    margin-bottom: 10px;
                }

                .admin-security-mini span {
                    display: block;
                    color: #87a594;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                }

                .admin-security-mini strong {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #d8f5e3;
                    font-size: 12px;
                }

                .admin-logout {
                    width: 100%;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.04);
                    color: #c9d8ce;
                    padding: 11px 13px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-weight: 650;
                }

                .admin-logout:hover {
                    background: rgba(239,68,68,0.13);
                    color: #fecaca;
                    border-color: rgba(239,68,68,0.2);
                }

                .admin-main {
                    min-width: 0;
                    flex: 1;
                    padding: 30px;
                }

                .admin-topbar {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 28px;
                }

                .admin-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: #83928a;
                    font-size: 11px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .admin-breadcrumb span {
                    color: #3d5145;
                }

                .admin-topbar h1 {
                    margin: 0;
                    font-size: 29px;
                    line-height: 1.1;
                    letter-spacing: -1px;
                }

                .admin-topbar p {
                    margin: 7px 0 0;
                    color: #718078;
                    font-size: 13px;
                }

                .admin-topbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                }

                .admin-refresh-btn,
                .admin-period-select {
                    border: 1px solid #dce5df;
                    background: #fff;
                    color: #2d4135;
                    min-height: 39px;
                    padding: 0 13px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 700;
                }

                .admin-refresh-btn {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                }

                .admin-refresh-btn:hover {
                    border-color: #b9cbbf;
                    background: #fafcfb;
                }

                .admin-refresh-btn:disabled {
                    cursor: wait;
                    opacity: 0.7;
                }

                .admin-period-select {
                    cursor: pointer;
                }

                .admin-welcome {
                    background:
                        linear-gradient(
                            125deg,
                            #123923,
                            #1d5432
                        );
                    color: #fff;
                    border-radius: 18px;
                    padding: 24px 26px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 17px;
                    box-shadow: 0 16px 35px rgba(18,57,35,0.12);
                }

                .admin-eyebrow {
                    display: block;
                    color: #91c4a3;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1.4px;
                    margin-bottom: 7px;
                }

                .admin-welcome h2 {
                    margin: 0;
                    font-size: 23px;
                    letter-spacing: -0.6px;
                }

                .admin-welcome p {
                    margin: 7px 0 0;
                    color: #c2d9ca;
                    font-size: 12px;
                    max-width: 570px;
                    line-height: 1.6;
                }

                .admin-welcome-status,
                .admin-system-badge {
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.09);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 9px 12px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 750;
                }

                .admin-live-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #61d88a;
                    box-shadow: 0 0 0 4px rgba(97,216,138,0.12);
                    display: inline-block;
                }

                .admin-metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 14px;
                    margin-bottom: 17px;
                }

                .admin-metric-card {
                    background: #fff;
                    border: 1px solid #e4ebe6;
                    border-radius: 15px;
                    padding: 17px;
                    box-shadow: 0 5px 18px rgba(28,55,39,0.035);
                }

                .admin-metric-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #99a69f;
                }

                .admin-metric-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: #edf7f0;
                    color: #20713e;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .admin-metric-value {
                    font-size: 25px;
                    font-weight: 800;
                    letter-spacing: -0.8px;
                    margin-top: 15px;
                }

                .admin-metric-label {
                    color: #415248;
                    font-size: 12px;
                    font-weight: 750;
                    margin-top: 2px;
                }

                .admin-metric-description {
                    color: #87948d;
                    font-size: 10px;
                    margin-top: 6px;
                    line-height: 1.45;
                }

                .admin-content-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.8fr);
                    gap: 17px;
                    margin-bottom: 17px;
                }

                .admin-panel {
                    background: #fff;
                    border: 1px solid #e4ebe6;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 5px 18px rgba(28,55,39,0.035);
                    min-width: 0;
                }

                .admin-full-panel {
                    width: 100%;
                }

                .admin-panel-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 15px;
                    margin-bottom: 19px;
                }

                .admin-panel-kicker {
                    display: block;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 1.3px;
                    color: #91a097;
                    font-weight: 800;
                    margin-bottom: 4px;
                }

                .admin-panel h3 {
                    margin: 0;
                    font-size: 16px;
                    letter-spacing: -0.3px;
                }

                .admin-panel-header > svg {
                    color: #5b7766;
                }

                .admin-panel-period {
                    font-size: 10px;
                    font-weight: 750;
                    color: #718178;
                    background: #f1f5f2;
                    padding: 6px 9px;
                    border-radius: 7px;
                }

                .admin-trend-chart {
                    height: 250px;
                    display: flex;
                    align-items: flex-end;
                    gap: 12px;
                    padding: 10px 5px 0;
                    overflow-x: auto;
                }

                .admin-trend-column {
                    min-width: 42px;
                    flex: 1;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                }

                .admin-trend-value {
                    font-size: 8px;
                    color: #74847a;
                    white-space: nowrap;
                }

                .admin-trend-track {
                    width: 100%;
                    max-width: 35px;
                    height: 185px;
                    background: #eef3ef;
                    border-radius: 8px;
                    display: flex;
                    align-items: flex-end;
                    overflow: hidden;
                }

                .admin-trend-bar {
                    width: 100%;
                    background: #2f8b4f;
                    border-radius: 8px;
                    min-height: 6px;
                }

                .admin-trend-column > span {
                    font-size: 9px;
                    color: #87938c;
                    white-space: nowrap;
                }

                .admin-empty-chart {
                    min-height: 250px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: #92a097;
                    text-align: center;
                    gap: 7px;
                }

                .admin-empty-chart strong {
                    color: #405148;
                    font-size: 13px;
                }

                .admin-empty-chart span {
                    font-size: 11px;
                    max-width: 270px;
                    line-height: 1.5;
                }

                .admin-health-list {
                    display: grid;
                    gap: 2px;
                }

                .admin-health-row {
                    padding: 12px 0;
                    border-bottom: 1px solid #edf1ee;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .admin-health-row:last-child {
                    border-bottom: 0;
                }

                .admin-health-row > div {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    color: #44554b;
                    font-size: 12px;
                    font-weight: 650;
                }

                .admin-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    border-radius: 999px;
                    padding: 5px 8px;
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: capitalize;
                    white-space: nowrap;
                }

                .admin-status.success {
                    color: #176b35;
                    background: #e9f7ed;
                }

                .admin-status.warning {
                    color: #946400;
                    background: #fff6df;
                }

                .admin-status.danger {
                    color: #a22c2c;
                    background: #fdecec;
                }

                .admin-status.neutral {
                    color: #536159;
                    background: #eef2ef;
                }

                .admin-fee-box {
                    margin-top: 12px;
                    padding: 12px;
                    background: #f4f8f5;
                    border-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 11px;
                    color: #697970;
                }

                .admin-fee-box strong {
                    color: #1f6739;
                    font-size: 14px;
                }

                .admin-text-btn {
                    border: 0;
                    background: transparent;
                    color: #227342;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: 800;
                }

                .admin-distribution {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .admin-distribution-item {
                    border: 1px solid #edf1ee;
                    border-radius: 11px;
                    padding: 13px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .admin-distribution-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .admin-distribution-icon.farmer {
                    color: #287644;
                    background: #eaf6ed;
                }

                .admin-distribution-icon.buyer {
                    color: #4966a4;
                    background: #eef2fb;
                }

                .admin-distribution-icon.product {
                    color: #9a7117;
                    background: #fff6df;
                }

                .admin-distribution-item strong,
                .admin-distribution-item span {
                    display: block;
                }

                .admin-distribution-item strong {
                    font-size: 16px;
                }

                .admin-distribution-item span {
                    color: #8a968f;
                    font-size: 9px;
                    margin-top: 2px;
                }

                .admin-request-summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .admin-request-summary > div {
                    padding: 14px;
                    background: #f7f9f7;
                    border-radius: 11px;
                }

                .admin-summary-number,
                .admin-request-summary span:last-child {
                    display: block;
                }

                .admin-summary-number {
                    font-size: 20px;
                    font-weight: 800;
                }

                .admin-request-summary span:last-child {
                    color: #7d8b83;
                    font-size: 9px;
                    margin-top: 3px;
                }

                .admin-table-heading {
                    align-items: center;
                }

                .admin-table-heading p {
                    color: #89968f;
                    font-size: 10px;
                    margin: 5px 0 0;
                }

                .admin-table-tools {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .admin-search {
                    min-width: 210px;
                    height: 37px;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 0 10px;
                    border: 1px solid #dfe7e2;
                    background: #fafcfb;
                    border-radius: 9px;
                    color: #84918a;
                }

                .admin-search input {
                    width: 100%;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    font-size: 11px;
                    color: #25372c;
                }

                .admin-count-badge {
                    white-space: nowrap;
                    padding: 8px 9px;
                    background: #eef5f0;
                    color: #326847;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 800;
                }

                .admin-table-wrapper {
                    overflow-x: auto;
                    margin: 0 -20px -20px;
                    padding: 0 20px 20px;
                }

                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 760px;
                }

                .admin-table th {
                    padding: 10px 12px;
                    text-align: left;
                    background: #f7f9f7;
                    color: #829087;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .admin-table td {
                    padding: 12px;
                    border-bottom: 1px solid #edf1ee;
                    color: #4e5e55;
                    font-size: 10px;
                    vertical-align: middle;
                }

                .admin-table tbody tr:last-child td {
                    border-bottom: 0;
                }

                .admin-table tbody tr:hover {
                    background: #fbfcfb;
                }

                .admin-user-cell {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    min-width: 180px;
                }

                .admin-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    background: #eaf5ed;
                    color: #26733f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 850;
                    flex-shrink: 0;
                }

                .admin-user-cell strong,
                .admin-user-cell span {
                    display: block;
                }

                .admin-user-cell strong {
                    color: #293b30;
                    font-size: 11px;
                }

                .admin-user-cell span,
                .admin-table-secondary {
                    color: #8a968f;
                    font-size: 9px;
                    margin-top: 2px;
                }

                .admin-role,
                .admin-category {
                    text-transform: capitalize;
                    color: #496357;
                    background: #f1f5f2;
                    padding: 5px 8px;
                    border-radius: 7px;
                    font-size: 9px;
                    font-weight: 750;
                }

                .admin-status-select {
                    border: 1px solid #dfe7e2;
                    border-radius: 7px;
                    background: #fff;
                    color: #43544a;
                    font-size: 9px;
                    padding: 6px 7px;
                    cursor: pointer;
                }

                .admin-status-select:disabled {
                    opacity: 0.5;
                    cursor: wait;
                }

                .admin-protected-label {
                    color: #718078;
                    font-size: 9px;
                    font-weight: 700;
                }

                .admin-product-cell {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    min-width: 170px;
                }

                .admin-product-cell img,
                .admin-product-placeholder {
                    width: 35px;
                    height: 35px;
                    border-radius: 9px;
                    object-fit: cover;
                    background: #edf4ef;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6c8a77;
                    flex-shrink: 0;
                }

                .admin-product-cell strong {
                    color: #34463b;
                    font-size: 10px;
                }

                .admin-table-secondary {
                    display: block;
                }

                .admin-table-empty {
                    text-align: center;
                    padding: 45px !important;
                    color: #8b9891 !important;
                }

                .admin-access-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 17px;
                }

                .admin-access-hero {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    padding: 15px;
                    background: #f2f8f4;
                    border: 1px solid #e2eee5;
                    border-radius: 12px;
                }

                .admin-access-icon {
                    width: 45px;
                    height: 45px;
                    border-radius: 12px;
                    background: #dff1e5;
                    color: #287443;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .admin-access-hero strong {
                    font-size: 12px;
                }

                .admin-access-hero p {
                    color: #7c8b82;
                    font-size: 10px;
                    line-height: 1.5;
                    margin: 4px 0 0;
                }

                .admin-access-list {
                    margin-top: 15px;
                }

                .admin-access-list > div {
                    padding: 11px 0;
                    border-bottom: 1px solid #edf1ee;
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    font-size: 10px;
                }

                .admin-access-list > div:last-child {
                    border-bottom: 0;
                }

                .admin-access-list span {
                    color: #7c8982;
                }

                .admin-access-list strong {
                    color: #31453a;
                    text-align: right;
                }

                .admin-policy-list {
                    display: grid;
                    gap: 10px;
                }

                .admin-policy-list > div {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    padding: 11px;
                    border-radius: 10px;
                    background: #f7f9f7;
                    color: #59685f;
                    font-size: 10px;
                    line-height: 1.5;
                }

                .admin-policy-list svg {
                    color: #3c8756;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .admin-policy-list > div:last-child svg {
                    color: #b57c14;
                }

                .admin-system-hero {
                    background: #fff;
                    border: 1px solid #e4ebe6;
                    border-radius: 16px;
                    padding: 22px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 17px;
                }

                .admin-system-icon {
                    width: 53px;
                    height: 53px;
                    border-radius: 14px;
                    background: #e9f6ed;
                    color: #277541;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .admin-system-hero h2 {
                    margin: 0;
                    font-size: 18px;
                }

                .admin-system-hero p {
                    margin: 5px 0 0;
                    color: #7c8982;
                    font-size: 11px;
                }

                .admin-system-badge {
                    margin-left: auto;
                    color: #236a3b;
                    background: #eaf7ee;
                    border-color: #d8ecdf;
                }

                .admin-system-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 14px;
                    margin-bottom: 17px;
                }

                .admin-system-card {
                    background: #fff;
                    border: 1px solid #e4ebe6;
                    border-radius: 14px;
                    padding: 16px;
                }

                .admin-system-card-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: #edf6ef;
                    color: #2e7447;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 13px;
                }

                .admin-system-card > span,
                .admin-system-card > strong {
                    display: block;
                }

                .admin-system-card > span {
                    color: #87948d;
                    font-size: 9px;
                }

                .admin-system-card > strong {
                    color: #33463a;
                    font-size: 13px;
                    margin-top: 3px;
                }

                .admin-system-status {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: #26713f;
                    font-size: 9px;
                    font-weight: 800;
                    margin-top: 12px;
                }

                .admin-system-status.warning {
                    color: #a07116;
                }

                .admin-environment-list {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0 30px;
                }

                .admin-environment-list > div {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 13px 0;
                    border-bottom: 1px solid #edf1ee;
                    font-size: 10px;
                }

                .admin-environment-list span {
                    color: #7f8d85;
                }

                .admin-environment-list strong {
                    color: #3c4f44;
                    text-align: right;
                }

                /* ============================================
                   SUPPORT CENTER
                ============================================ */

                .admin-support-page {
                    display: grid;
                    gap: 17px;
                }

                .admin-support-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 14px;
                }

                .admin-support-summary-card {
                    background: #fff;
                    border: 1px solid #e4ebe6;
                    border-radius: 14px;
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 5px 18px rgba(28,55,39,0.035);
                }

                .admin-support-summary-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #eaf6ed;
                    color: #287443;
                    flex-shrink: 0;
                }

                .admin-support-summary-icon.open {
                    background: #fff6df;
                    color: #9a7117;
                }

                .admin-support-summary-icon.progress {
                    background: #eef2fb;
                    color: #536da7;
                }

                .admin-support-summary-icon.resolved {
                    background: #eaf6ed;
                    color: #287443;
                }

                .admin-support-summary-card strong,
                .admin-support-summary-card span {
                    display: block;
                }

                .admin-support-summary-card strong {
                    font-size: 20px;
                    letter-spacing: -0.4px;
                }

                .admin-support-summary-card span {
                    color: #7f8c84;
                    font-size: 9px;
                    margin-top: 2px;
                }

                .admin-support-total-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #eef5f0;
                    color: #326847;
                    border-radius: 8px;
                    padding: 8px 10px;
                    font-size: 10px;
                    font-weight: 800;
                }

                .admin-support-filters {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 18px;
                    padding: 11px;
                    background: #f7f9f7;
                    border: 1px solid #edf1ee;
                    border-radius: 11px;
                }

                .admin-support-search {
                    flex: 1;
                    min-width: 240px;
                    background: #fff;
                }

                .admin-filter-select {
                    height: 37px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid #dfe7e2;
                    background: #fff;
                    border-radius: 9px;
                    padding: 0 9px;
                    color: #84918a;
                }

                .admin-filter-select select {
                    border: 0;
                    outline: 0;
                    background: transparent;
                    color: #43544a;
                    font-size: 10px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .admin-support-loading {
                    min-height: 220px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 10px;
                    color: #718078;
                    font-size: 11px;
                }

                .admin-support-empty {
                    min-height: 240px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    text-align: center;
                    gap: 6px;
                    color: #89968f;
                }

                .admin-support-empty-icon {
                    width: 55px;
                    height: 55px;
                    border-radius: 16px;
                    background: #edf6ef;
                    color: #3b8053;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                }

                .admin-support-empty strong {
                    color: #405148;
                    font-size: 13px;
                }

                .admin-support-empty span {
                    font-size: 10px;
                }

                .admin-ticket-list {
                    display: grid;
                    gap: 10px;
                }

                .admin-ticket-card {
                    border: 1px solid #e3eae5;
                    border-radius: 13px;
                    background: #fff;
                    overflow: hidden;
                    transition: 0.2s ease;
                }

                .admin-ticket-card:hover {
                    border-color: #ccdacf;
                    box-shadow: 0 6px 20px rgba(28,55,39,0.04);
                }

                .admin-ticket-card.expanded {
                    border-color: #bdd2c3;
                    box-shadow: 0 8px 25px rgba(28,55,39,0.055);
                }

                .admin-ticket-header {
                    width: 100%;
                    border: 0;
                    background: #fff;
                    padding: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    text-align: left;
                    cursor: pointer;
                }

                .admin-ticket-main {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    min-width: 0;
                }

                .admin-ticket-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: #edf6ef;
                    color: #2d7748;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .admin-ticket-title {
                    min-width: 0;
                }

                .admin-ticket-title > strong {
                    display: block;
                    color: #2e4035;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .admin-ticket-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    color: #89968f;
                    font-size: 9px;
                    text-transform: capitalize;
                    flex-wrap: wrap;
                }

                .admin-ticket-header-right {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    color: #8a978f;
                    flex-shrink: 0;
                }

                .admin-ticket-content {
                    border-top: 1px solid #edf1ee;
                    padding: 17px;
                    background: #fbfcfb;
                    display: grid;
                    gap: 15px;
                }

                .admin-ticket-user,
                .admin-ticket-message,
                .admin-ticket-response-existing,
                .admin-ticket-actions {
                    background: #fff;
                    border: 1px solid #e7ede9;
                    border-radius: 11px;
                    padding: 14px;
                }

                .admin-ticket-user-heading {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    color: #3f5247;
                    font-size: 11px;
                    margin-bottom: 11px;
                }

                .admin-ticket-user-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }

                .admin-ticket-user-grid > div {
                    padding: 10px;
                    background: #f7f9f7;
                    border-radius: 9px;
                    min-width: 0;
                }

                .admin-ticket-user-grid span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #89968f;
                    font-size: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 800;
                }

                .admin-ticket-user-grid strong {
                    display: block;
                    margin-top: 5px;
                    color: #405148;
                    font-size: 10px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .admin-ticket-section-label {
                    color: #7d8a82;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    font-weight: 800;
                    margin-bottom: 7px;
                }

                .admin-ticket-message-box {
                    padding: 12px;
                    border-radius: 9px;
                    background: #f7f9f7;
                    color: #4c5c53;
                    font-size: 11px;
                    line-height: 1.65;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                }

                .admin-ticket-message-box.response {
                    background: #edf7f0;
                    color: #345441;
                }

                .admin-ticket-response-time {
                    display: block;
                    margin-top: 8px;
                    padding-top: 7px;
                    border-top: 1px solid #dcebe0;
                    color: #789080;
                    font-size: 8px;
                }

                .admin-ticket-actions {
                    display: grid;
                    grid-template-columns: 180px minmax(0, 1fr);
                    gap: 17px;
                }

                .admin-ticket-status-control label,
                .admin-ticket-reply label {
                    display: block;
                    color: #66756c;
                    font-size: 9px;
                    font-weight: 800;
                    margin-bottom: 6px;
                }

                .admin-ticket-status-control select {
                    width: 100%;
                    height: 38px;
                    border: 1px solid #dfe7e2;
                    background: #fff;
                    border-radius: 8px;
                    padding: 0 9px;
                    outline: 0;
                    color: #43544a;
                    font-size: 10px;
                    font-weight: 700;
                }

                .admin-ticket-reply textarea {
                    width: 100%;
                    min-height: 88px;
                    resize: vertical;
                    border: 1px solid #dfe7e2;
                    background: #fff;
                    border-radius: 9px;
                    padding: 10px;
                    outline: 0;
                    color: #34473b;
                    font-family: inherit;
                    font-size: 10px;
                    line-height: 1.55;
                }

                .admin-ticket-reply textarea:focus {
                    border-color: #9fbea9;
                    box-shadow: 0 0 0 3px rgba(45,119,72,0.07);
                }

                .admin-ticket-reply-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: 7px;
                }

                .admin-ticket-reply-footer > span {
                    color: #98a39d;
                    font-size: 8px;
                }

                .admin-ticket-reply-footer button {
                    border: 0;
                    background: #237342;
                    color: #fff;
                    min-height: 35px;
                    padding: 0 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .admin-ticket-reply-footer button:hover {
                    background: #1c6136;
                }

                .admin-ticket-reply-footer button:disabled {
                    opacity: 0.6;
                    cursor: wait;
                }

                .admin-loading {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .admin-loading-spinner {
                    width: 58px;
                    height: 58px;
                    border-radius: 17px;
                    background: #eaf6ed;
                    color: #2b7745;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 14px;
                }

                .admin-loading h2 {
                    margin: 0;
                    font-size: 19px;
                }

                .admin-loading p {
                    color: #7d8a83;
                    font-size: 12px;
                    margin-top: 6px;
                }

                .admin-spin {
                    animation: adminSpin 0.9s linear infinite;
                }

                @keyframes adminSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .admin-error {
                    margin-bottom: 17px;
                    padding: 12px 14px;
                    border-radius: 11px;
                    background: #fff0f0;
                    border: 1px solid #f2d3d3;
                    color: #9d3636;
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    font-size: 11px;
                }

                .admin-error button {
                    margin-left: auto;
                    border: 0;
                    background: transparent;
                    color: #842b2b;
                    font-weight: 800;
                    cursor: pointer;
                    font-size: 10px;
                }

                @media (max-width: 1150px) {
                    .admin-sidebar {
                        width: 220px;
                    }

                    .admin-main {
                        padding: 24px;
                    }

                    .admin-metrics-grid,
                    .admin-support-summary-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .admin-system-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .admin-ticket-user-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 900px) {
                    .admin-page {
                        display: block;
                    }

                    .admin-sidebar {
                        width: 100%;
                        min-height: auto;
                        position: relative;
                        padding: 15px;
                    }

                    .admin-brand {
                        padding: 4px 5px 15px;
                    }

                    .admin-nav {
                        display: flex;
                        overflow-x: auto;
                        padding-bottom: 3px;
                    }

                    .admin-nav-label,
                    .admin-sidebar-bottom {
                        display: none;
                    }

                    .admin-nav-item {
                        width: auto;
                        min-width: max-content;
                        white-space: nowrap;
                    }

                    .admin-main {
                        padding: 20px 15px 35px;
                    }

                    .admin-content-grid,
                    .admin-access-grid {
                        grid-template-columns: 1fr;
                    }

                    .admin-support-filters {
                        flex-wrap: wrap;
                    }

                    .admin-support-search {
                        width: 100%;
                        min-width: 0;
                        flex-basis: 100%;
                    }

                    .admin-ticket-actions {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 650px) {
                    .admin-topbar,
                    .admin-welcome,
                    .admin-system-hero {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .admin-topbar-actions {
                        width: 100%;
                    }

                    .admin-refresh-btn,
                    .admin-period-select {
                        flex: 1;
                    }

                    .admin-metrics-grid,
                    .admin-support-summary-grid {
                        grid-template-columns: 1fr;
                    }

                    .admin-distribution,
                    .admin-request-summary {
                        grid-template-columns: 1fr;
                    }

                    .admin-system-grid {
                        grid-template-columns: 1fr;
                    }

                    .admin-system-badge {
                        margin-left: 0;
                    }

                    .admin-table-heading {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .admin-table-tools {
                        width: 100%;
                    }

                    .admin-search {
                        min-width: 0;
                        flex: 1;
                    }

                    .admin-count-badge {
                        display: none;
                    }

                    .admin-environment-list {
                        grid-template-columns: 1fr;
                    }

                    .admin-support-filters {
                        align-items: stretch;
                        flex-direction: column;
                    }

                    .admin-filter-select {
                        width: 100%;
                    }

                    .admin-filter-select select {
                        flex: 1;
                    }

                    .admin-ticket-header {
                        align-items: flex-start;
                    }

                    .admin-ticket-header-right {
                        align-items: flex-end;
                        flex-direction: column;
                    }

                    .admin-ticket-user-grid {
                        grid-template-columns: 1fr;
                    }

                    .admin-ticket-content {
                        padding: 10px;
                    }

                    .admin-ticket-actions {
                        gap: 12px;
                    }
                }
            `}</style>

            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="admin-brand-mark">
                        🌿
                    </div>

                    <div className="admin-brand-text">
                        <strong>
                            FarmLink
                        </strong>

                        <span>
                            Administration Center
                        </span>
                    </div>
                </div>

                <nav className="admin-nav">
                    <div className="admin-nav-label">
                        Management
                    </div>

                    {navItems.map(
                        (item) => {
                            const Icon =
                                item.icon;

                            return (
                                <button
                                    key={
                                        item.key
                                    }
                                    type="button"
                                    className={`admin-nav-item ${currentSection ===
                                        item.key
                                        ? 'active'
                                        : ''
                                        }`}
                                    onClick={() =>
                                        handleNavigation(
                                            item.path
                                        )
                                    }
                                >
                                    <Icon
                                        size={
                                            17
                                        }
                                    />

                                    <span>
                                        {
                                            item.label
                                        }

                                        {item.key ===
                                            'support' &&
                                            supportSummary.open >
                                            0 && (
                                                <span
                                                    className="admin-support-nav-count"
                                                    style={{
                                                        marginLeft:
                                                            'auto',
                                                        minWidth:
                                                            '18px',
                                                        height:
                                                            '18px',
                                                        padding:
                                                            '0 5px',
                                                        borderRadius:
                                                            '999px',
                                                        background:
                                                            currentSection ===
                                                                'support'
                                                                ? '#eaf6ed'
                                                                : 'rgba(255,255,255,0.12)',
                                                        color:
                                                            currentSection ===
                                                                'support'
                                                                ? '#287443'
                                                                : '#d8f5e3',
                                                        display:
                                                            'inline-flex',
                                                        alignItems:
                                                            'center',
                                                        justifyContent:
                                                            'center',
                                                        fontSize:
                                                            '8px',
                                                        fontWeight:
                                                            900,
                                                    }}
                                                >
                                                    {
                                                        supportSummary.open
                                                    }
                                                </span>
                                            )}
                                    </span>
                                </button>
                            );
                        }
                    )}
                </nav>

                <div className="admin-sidebar-bottom">
                    <div className="admin-security-mini">
                        <span>
                            Security
                        </span>

                        <strong>
                            <CircleCheck
                                size={13}
                            />

                            Admin session
                            protected
                        </strong>
                    </div>

                    <button
                        type="button"
                        className="admin-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        <LogOut size={16} />

                        Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                {renderHeader()}

                {error && (
                    <div className="admin-error">
                        <AlertTriangle
                            size={17}
                        />

                        <span>
                            {error}
                        </span>

                        <button
                            onClick={() =>
                                currentSection ===
                                    'support'
                                    ? fetchSupportTickets(
                                        true
                                    )
                                    : fetchAdminData(
                                        true
                                    )
                            }
                        >
                            Try again
                        </button>
                    </div>
                )}

                {renderCurrentSection()}
            </main>
        </div>
    );
};

export default AdminDashboard;
