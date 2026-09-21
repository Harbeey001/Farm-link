import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Bell,
    Check,
    CheckCheck,
    ChevronDown,
    HelpCircle,
    LayoutDashboard,
    Leaf,
    LogIn,
    LogOut,
    Menu,
    ShieldCheck,
    ShoppingBasket,
    Sprout,
    UserPlus,
    X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../services/notificationService';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dashboardOpen, setDashboardOpen] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] =
        useState(false);
    const [notificationsLoading, setNotificationsLoading] =
        useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const dashboardRef = useRef(null);
    const notificationsRef = useRef(null);

    const { user, logout } = useAuth();

    const closeMenu = () => {
        setMenuOpen(false);
        setDashboardOpen(false);
        setNotificationsOpen(false);
    };

    const handleLogout = () => {
        logout();
        setNotifications([]);
        closeMenu();
        navigate('/marketplace');
    };

    // ==========================
    // FETCH NOTIFICATIONS
    // ==========================

    const fetchNotifications = async () => {
    if (!user) {
        setNotifications([]);
        return;
    }

    try {
        setNotificationsLoading(true);

        const response = await getMyNotifications();

        setNotifications(
            Array.isArray(response) ? response : []
        );
    } catch (error) {
        console.error(
            'Fetch notifications error:',
            error
        );
    } finally {
        setNotificationsLoading(false);
    }
};

    // ==========================
    // MARK ONE AS READ
    // ==========================

    const handleMarkAsRead = async (
        notificationId
    ) => {
        try {
            const response =
                await markNotificationAsRead(
                    notificationId
                );

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                        'Unable to mark notification as read'
                );
            }

            setNotifications((prev) =>
                prev.map((notification) =>
                    notification._id ===
                    notificationId
                        ? {
                              ...notification,
                              isRead: true,
                          }
                        : notification
                )
            );
        } catch (error) {
            console.error(
                'Mark notification as read error:',
                error
            );
        }
    };

    // ==========================
    // MARK ALL AS READ
    // ==========================

    const handleMarkAllAsRead = async () => {
        try {
            const response =
                await markAllNotificationsAsRead();

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                        'Unable to mark notifications as read'
                );
            }

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );
        } catch (error) {
            console.error(
                'Mark all notifications as read error:',
                error
            );
        }
    };

    // ==========================
    // NOTIFICATION HELPERS
    // ==========================

    const unreadNotifications =
        notifications.filter(
            (notification) =>
                !notification.isRead
        );

    const unreadCount =
        unreadNotifications.length;

    const formatNotificationTime = (
        createdAt
    ) => {
        if (!createdAt) {
            return '';
        }

        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();

        const difference =
            now.getTime() -
            date.getTime();

        const minutes = Math.floor(
            difference / (1000 * 60)
        );

        if (minutes < 1) {
            return 'Just now';
        }

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours = Math.floor(
            minutes / 60
        );

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days = Math.floor(
            hours / 24
        );

        if (days < 7) {
            return `${days}d ago`;
        }

        return date.toLocaleDateString(
            'en-NG',
            {
                day: 'numeric',
                month: 'short',
            }
        );
    };

    const getNotificationIconClass = (
        type
    ) => {
        switch (type) {
            case 'payment':
                return 'payment';

            case 'delivery':
                return 'delivery';

            case 'request':
                return 'request';

            case 'order':
                return 'order';

            case 'support':
                return 'support';

            default:
                return 'system';
        }
    };

    // ==========================
    // INITIAL NOTIFICATIONS
    // ==========================

    useEffect(() => {
    let ignore = false;

    if (!user) {
        setNotifications([]);
        setNotificationsLoading(false);
        return;
    }

    const loadNotifications = async () => {
        try {
            setNotificationsLoading(true);

            const response = await getMyNotifications();

            if (ignore) return;

            setNotifications(
                Array.isArray(response)
                    ? response
                    : []
            );
        } catch (error) {
            if (ignore) return;

            console.error(
                'Fetch notifications error:',
                error
            );
        } finally {
            if (!ignore) {
                setNotificationsLoading(false);
            }
        }
    };

    loadNotifications();

    const interval = setInterval(() => {
        loadNotifications();
    }, 30000);

    return () => {
        ignore = true;
        clearInterval(interval);
    };
}, [user]);

    // ==========================
    // CLOSE DROPDOWNS OUTSIDE
    // ==========================

    useEffect(() => {
        const handleClickOutside = (
            event
        ) => {
            if (
                dashboardRef.current &&
                !dashboardRef.current.contains(
                    event.target
                )
            ) {
                setDashboardOpen(false);
            }

            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(
                    event.target
                )
            ) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, []);

    // ==========================
    // CLOSE MOBILE MENU ON ROUTE
    // ==========================

    useEffect(() => {
        setMenuOpen(false);
        setDashboardOpen(false);
        setNotificationsOpen(false);
    }, [location.pathname]);

    const marketplaceActive =
        location.pathname ===
        '/marketplace';

    const supportActive =
        location.pathname === '/support';

    const dashboardActive =
        location.pathname ===
            '/buyer-dashboard' ||
        location.pathname ===
            '/farmer-dashboard' ||
        location.pathname ===
            '/admin-dashboard';

    // ==========================
    // DASHBOARD INFO
    // ==========================

    const getDashboardInfo = () => {
        if (!user) {
            return null;
        }

        switch (user.role) {
            case 'farmer':
                return {
                    label: 'Farmer Dashboard',
                    path: '/farmer-dashboard',
                    icon: Sprout,
                };

            case 'buyer':
                return {
                    label: 'Buyer Dashboard',
                    path: '/buyer-dashboard',
                    icon: ShoppingBasket,
                };

            case 'admin':
                return {
                    label: 'Admin Dashboard',
                    path: '/admin-dashboard',
                    icon: ShieldCheck,
                };

            default:
                return null;
        }
    };

    const dashboardInfo =
        getDashboardInfo();

    return (
        <>
            <nav className="farmlink-navbar sticky-top">
                <div className="container">

                    {/* ==========================
                        NAVBAR TOP
                    ========================== */}

                    <div className="farmlink-navbar-inner">

                        {/* BRAND */}

                        <Link
                            to="/marketplace"
                            onClick={closeMenu}
                            className="farmlink-navbar-brand text-decoration-none"
                        >
                            <div className="farmlink-navbar-logo">
                                <Leaf
                                    size={22}
                                    strokeWidth={2.2}
                                />
                            </div>

                            <div className="lh-sm">
                                <div className="fw-bold text-dark fs-5">
                                    Farm
                                    <span className="text-success">
                                        Link
                                    </span>
                                </div>

                                <small className="farmlink-navbar-tagline">
                                    Farmers & buyers
                                </small>
                            </div>
                        </Link>

                        {/* DESKTOP NAVIGATION */}

                        <div className="farmlink-desktop-nav d-none d-lg-flex align-items-center">

                            {/* Marketplace */}

                            <Link
                                to="/marketplace"
                                onClick={closeMenu}
                                className={`farmlink-nav-link ${
                                    marketplaceActive
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                <ShoppingBasket
                                    size={17}
                                />
                                Marketplace
                            </Link>

                            {/* Support */}

                            {user && (
                                <Link
                                    to="/support"
                                    onClick={closeMenu}
                                    className={`farmlink-nav-link ${
                                        supportActive
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    <HelpCircle
                                        size={17}
                                    />
                                    Support
                                </Link>
                            )}

                            {/* Notifications */}

                            {user && (
                                <div
                                    className="position-relative"
                                    ref={
                                        notificationsRef
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNotificationsOpen(
                                                (prev) =>
                                                    !prev
                                            )
                                        }
                                        className="farmlink-notification-button"
                                        aria-label="Notifications"
                                        aria-expanded={
                                            notificationsOpen
                                        }
                                    >
                                        <Bell
                                            size={18}
                                        />

                                        {unreadCount >
                                            0 && (
                                            <span className="farmlink-notification-badge">
                                                {unreadCount >
                                                99
                                                    ? '99+'
                                                    : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {notificationsOpen && (
                                        <div className="farmlink-notification-dropdown">

                                            <div className="farmlink-notification-header">

                                                <div>
                                                    <strong>
                                                        Notifications
                                                    </strong>

                                                    {unreadCount >
                                                        0 && (
                                                        <small className="text-muted d-block">
                                                            {
                                                                unreadCount
                                                            }{' '}
                                                            unread
                                                        </small>
                                                    )}
                                                </div>

                                                {unreadCount >
                                                    0 && (
                                                    <button
                                                        type="button"
                                                        className="farmlink-mark-all-button"
                                                        onClick={
                                                            handleMarkAllAsRead
                                                        }
                                                    >
                                                        <CheckCheck
                                                            size={
                                                                14
                                                            }
                                                        />
                                                        Mark all read
                                                    </button>
                                                )}

                                            </div>

                                            <div className="farmlink-notification-list">

                                                {notificationsLoading &&
                                                    notifications.length ===
                                                        0 && (
                                                        <div className="farmlink-notification-empty">
                                                            <div className="spinner-border spinner-border-sm text-success mb-2" />
                                                            <div>
                                                                Loading notifications...
                                                            </div>
                                                        </div>
                                                    )}

                                                {!notificationsLoading &&
                                                    notifications.length ===
                                                        0 && (
                                                        <div className="farmlink-notification-empty">
                                                            <Bell
                                                                size={
                                                                    28
                                                                }
                                                                className="text-muted mb-2"
                                                            />

                                                            <div className="fw-semibold">
                                                                No notifications
                                                            </div>

                                                            <small className="text-muted">
                                                                You are all caught up.
                                                            </small>
                                                        </div>
                                                    )}

                                                {notifications
                                                    .slice(
                                                        0,
                                                        10
                                                    )
                                                    .map(
                                                        (
                                                            notification
                                                        ) => (
                                                            <button
                                                                type="button"
                                                                key={
                                                                    notification._id
                                                                }
                                                                onClick={() =>
                                                                    handleMarkAsRead(
                                                                        notification._id
                                                                    )
                                                                }
                                                                className={`farmlink-notification-item ${
                                                                    notification.isRead
                                                                        ? ''
                                                                        : 'unread'
                                                                }`}
                                                            >

                                                                <div
                                                                    className={`farmlink-notification-icon ${getNotificationIconClass(
                                                                        notification.type
                                                                    )}`}
                                                                >
                                                                    <Bell
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="farmlink-notification-content">

                                                                    <div className="d-flex justify-content-between align-items-start gap-2">

                                                                        <strong>
                                                                            {
                                                                                notification.title
                                                                            }
                                                                        </strong>

                                                                        {!notification.isRead && (
                                                                            <span className="farmlink-unread-dot" />
                                                                        )}

                                                                    </div>

                                                                    <p>
                                                                        {
                                                                            notification.message
                                                                        }
                                                                    </p>

                                                                    <small>
                                                                        {formatNotificationTime(
                                                                            notification.createdAt
                                                                        )}
                                                                    </small>

                                                                </div>

                                                            </button>
                                                        )
                                                    )}

                                            </div>

                                            {notifications.length >
                                                10 && (
                                                <div className="farmlink-notification-footer">
                                                    Showing latest 10 notifications
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>
                            )}

             {/* Dashboard */}

{user && dashboardInfo && (
    <Link
        to={dashboardInfo.path}
        onClick={closeMenu}
        className={`farmlink-mobile-link ${
            dashboardActive ? 'active' : ''
        }`}
    >
        <LayoutDashboard size={18} />
        Dashboard
    </Link>
)}

                            {/* Authentication */}

                            {user ? (
                                <button
                                    type="button"
                                    onClick={
                                        handleLogout
                                    }
                                    className="farmlink-logout-button ms-2"
                                >
                                    <LogOut
                                        size={16}
                                    />
                                    Logout
                                </button>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="farmlink-nav-link ms-1"
                                    >
                                        <LogIn
                                            size={16}
                                        />
                                        Login
                                    </Link>

                                    <Link
                                        to="/register"
                                        className="farmlink-get-started ms-2"
                                    >
                                        <UserPlus
                                            size={16}
                                        />
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* MOBILE BUTTON */}

                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(
                                    (prev) =>
                                        !prev
                                );
                                setDashboardOpen(
                                    false
                                );
                                setNotificationsOpen(
                                    false
                                );
                            }}
                            className="farmlink-mobile-menu-button d-lg-none"
                            aria-label={
                                menuOpen
                                    ? 'Close navigation menu'
                                    : 'Open navigation menu'
                            }
                            aria-expanded={
                                menuOpen
                            }
                        >
                            {menuOpen ? (
                                <X size={22} />
                            ) : (
                                <Menu size={22} />
                            )}
                        </button>
                    </div>

                    {/* ==========================
                        MOBILE MENU
                    ========================== */}

                    {menuOpen && (
                        <div className="farmlink-mobile-menu d-lg-none">

                            {/* Marketplace */}

                            <Link
                                to="/marketplace"
                                onClick={closeMenu}
                                className={`farmlink-mobile-link ${
                                    marketplaceActive
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                <ShoppingBasket
                                    size={18}
                                />
                                Marketplace
                            </Link>

                            {/* Support */}

                            {user && (
                                <Link
                                    to="/support"
                                    onClick={closeMenu}
                                    className={`farmlink-mobile-link ${
                                        supportActive
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    <HelpCircle
                                        size={18}
                                    />
                                    Support
                                </Link>
                            )}

                            {/* Mobile Notifications */}

                            {user && (
                                <div className="farmlink-mobile-notification-section">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNotificationsOpen(
                                                (
                                                    prev
                                                ) =>
                                                    !prev
                                            )
                                        }
                                        className="farmlink-mobile-link farmlink-mobile-notification-button"
                                    >
                                        <span className="d-flex align-items-center gap-3">
                                            <span className="position-relative">
                                                <Bell
                                                    size={
                                                        18
                                                    }
                                                />

                                                {unreadCount >
                                                    0 && (
                                                    <span className="farmlink-mobile-notification-dot">
                                                        {unreadCount >
                                                        99
                                                            ? '99+'
                                                            : unreadCount}
                                                    </span>
                                                )}
                                            </span>

                                            Notifications
                                        </span>

                                        <ChevronDown
                                            size={17}
                                            className={
                                                notificationsOpen
                                                    ? 'rotate-180'
                                                    : ''
                                            }
                                        />
                                    </button>

                                    {notificationsOpen && (
                                        <div className="farmlink-mobile-notifications">

                                            <div className="d-flex justify-content-between align-items-center mb-2">

                                                <strong>
                                                    Notifications
                                                </strong>

                                                {unreadCount >
                                                    0 && (
                                                    <button
                                                        type="button"
                                                        className="farmlink-mark-all-button"
                                                        onClick={
                                                            handleMarkAllAsRead
                                                        }
                                                    >
                                                        <CheckCheck
                                                            size={
                                                                14
                                                            }
                                                        />
                                                        Mark all read
                                                    </button>
                                                )}

                                            </div>

                                            {notificationsLoading &&
                                                notifications.length ===
                                                    0 && (
                                                    <div className="text-center py-3 text-muted">
                                                        <div className="spinner-border spinner-border-sm text-success mb-2" />
                                                        <div>
                                                            Loading...
                                                        </div>
                                                    </div>
                                                )}

                                            {!notificationsLoading &&
                                                notifications.length ===
                                                    0 && (
                                                    <div className="text-center py-3 text-muted">
                                                        <Bell
                                                            size={
                                                                25
                                                            }
                                                            className="mb-2"
                                                        />

                                                        <div className="small">
                                                            No notifications
                                                        </div>
                                                    </div>
                                                )}

                                            {notifications
                                                .slice(
                                                    0,
                                                    10
                                                )
                                                .map(
                                                    (
                                                        notification
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                notification._id
                                                            }
                                                            onClick={() =>
                                                                handleMarkAsRead(
                                                                    notification._id
                                                                )
                                                            }
                                                            className={`farmlink-mobile-notification-item ${
                                                                notification.isRead
                                                                    ? ''
                                                                    : 'unread'
                                                            }`}
                                                        >

                                                            <div
                                                                className={`farmlink-notification-icon ${getNotificationIconClass(
                                                                    notification.type
                                                                )}`}
                                                            >
                                                                <Bell
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="flex-grow-1 text-start">

                                                                <div className="d-flex justify-content-between gap-2">

                                                                    <strong>
                                                                        {
                                                                            notification.title
                                                                        }
                                                                    </strong>

                                                                    {!notification.isRead && (
                                                                        <span className="farmlink-unread-dot" />
                                                                    )}

                                                                </div>

                                                                <p>
                                                                    {
                                                                        notification.message
                                                                    }
                                                                </p>

                                                                <small>
                                                                    {formatNotificationTime(
                                                                        notification.createdAt
                                                                    )}
                                                                </small>

                                                            </div>

                                                        </button>
                                                    )
                                                )}

                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Dashboard */}

                            {user &&
                                dashboardInfo && (
                                    <div className="mt-1">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDashboardOpen(
                                                    (
                                                        prev
                                                    ) =>
                                                        !prev
                                                )
                                            }
                                            className={`farmlink-mobile-link farmlink-mobile-dashboard-button ${
                                                dashboardActive
                                                    ? 'active'
                                                    : ''
                                            }`}
                                            aria-expanded={
                                                dashboardOpen
                                            }
                                        >
                                            <span className="d-flex align-items-center gap-3">
                                                <LayoutDashboard
                                                    size={
                                                        18
                                                    }
                                                />
                                                Dashboard
                                            </span>

                                            <ChevronDown
                                                size={
                                                    17
                                                }
                                                className={
                                                    dashboardOpen
                                                        ? 'rotate-180'
                                                        : ''
                                                }
                                            />
                                        </button>

                                        {dashboardOpen && (
                                            <div className="farmlink-mobile-submenu">

                                                <Link
                                                    to={
                                                        dashboardInfo.path
                                                    }
                                                    onClick={
                                                        closeMenu
                                                    }
                                                    className="farmlink-mobile-submenu-link"
                                                >
                                                    <dashboardInfo.icon
                                                        size={
                                                            17
                                                        }
                                                    />

                                                    {
                                                        dashboardInfo.label
                                                    }
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="farmlink-mobile-divider" />

                            {/* Logged Out */}

                            {!user && (
                                <div className="d-grid gap-2">

                                    <Link
                                        to="/login"
                                        onClick={
                                            closeMenu
                                        }
                                        className="farmlink-mobile-auth-button secondary"
                                    >
                                        <LogIn
                                            size={17}
                                        />
                                        Login
                                    </Link>

                                    <Link
                                        to="/register"
                                        onClick={
                                            closeMenu
                                        }
                                        className="farmlink-mobile-auth-button primary"
                                    >
                                        <UserPlus
                                            size={17}
                                        />
                                        Get Started
                                    </Link>

                                </div>
                            )}

                            {/* Logged In */}

                            {user && (
                                <div>

                                    <div className="farmlink-mobile-user mb-3">
                                        <div className="farmlink-user-avatar">
                                            {user.name
                                                ?.charAt(
                                                    0
                                                )
                                                ?.toUpperCase() ||
                                                'U'}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="fw-semibold text-dark text-truncate">
                                                {user.name ||
                                                    'My Account'}
                                            </div>

                                            <small className="text-secondary text-capitalize">
                                                {
                                                    user.role
                                                }
                                            </small>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleLogout
                                        }
                                        className="farmlink-mobile-auth-button secondary w-100"
                                    >
                                        <LogOut
                                            size={17}
                                        />
                                        Logout
                                    </button>

                                </div>
                            )}

                        </div>
                    )}
                </div>
            </nav>

            <style>{`
                .farmlink-navbar {
                    background: rgba(255, 255, 255, 0.96);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                    z-index: 1030;
                }

                .farmlink-navbar-inner {
                    min-height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .farmlink-navbar-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .farmlink-navbar-logo {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: linear-gradient(
                        135deg,
                        #198754,
                        #157347
                    );
                    color: white;
                    box-shadow:
                        0 6px 15px rgba(25, 135, 84, 0.16);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-navbar-brand:hover
                    .farmlink-navbar-logo {
                    transform: translateY(-1px);
                    box-shadow:
                        0 8px 18px rgba(25, 135, 84, 0.2);
                }

                .farmlink-navbar-tagline {
                    color: #6c757d;
                    font-size: 11px;
                }

                .farmlink-desktop-nav {
                    gap: 4px;
                }

                .farmlink-nav-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 9px 13px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #6c757d;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    transition:
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .farmlink-nav-link:hover {
                    color: #198754;
                    background: rgba(25, 135, 84, 0.07);
                }

                .farmlink-nav-link.active {
                    color: #198754;
                    background: rgba(25, 135, 84, 0.1);
                }

                .farmlink-nav-button {
                    cursor: pointer;
                }

                .farmlink-nav-button svg:last-child {
                    transition: transform 0.2s ease;
                }

                .rotate-180 {
                    transform: rotate(180deg);
                }

                /* ==========================
                   NOTIFICATIONS
                ========================== */

                .farmlink-notification-button {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #6c757d;
                    cursor: pointer;
                    transition:
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .farmlink-notification-button:hover {
                    color: #198754;
                    background: rgba(25, 135, 84, 0.08);
                }

                .farmlink-notification-badge {
                    position: absolute;
                    top: 2px;
                    right: 1px;
                    min-width: 17px;
                    height: 17px;
                    padding: 0 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    border-radius: 20px;
                    background: #dc3545;
                    color: white;
                    font-size: 9px;
                    font-weight: 700;
                    line-height: 1;
                }

                .farmlink-notification-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: -70px;
                    width: 370px;
                    overflow: hidden;
                    border: 1px solid #e9ecef;
                    border-radius: 15px;
                    background: white;
                    box-shadow:
                        0 16px 45px rgba(0, 0, 0, 0.14);
                    animation: farmlinkDropdownIn 0.16s ease-out;
                }

                .farmlink-notification-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .farmlink-mark-all-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 7px;
                    border: 0;
                    border-radius: 7px;
                    background: transparent;
                    color: #198754;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .farmlink-mark-all-button:hover {
                    background: rgba(25, 135, 84, 0.08);
                }

                .farmlink-notification-list {
                    max-height: 410px;
                    overflow-y: auto;
                }

                .farmlink-notification-item {
                    width: 100%;
                    display: flex;
                    align-items: flex-start;
                    gap: 11px;
                    padding: 13px 15px;
                    border: 0;
                    border-bottom: 1px solid #f1f3f5;
                    background: white;
                    text-align: left;
                    cursor: pointer;
                    transition:
                        background 0.2s ease;
                }

                .farmlink-notification-item:hover {
                    background: #f8faf9;
                }

                .farmlink-notification-item.unread {
                    background: #f3faf6;
                }

                .farmlink-notification-icon {
                    width: 32px;
                    height: 32px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    color: #198754;
                    background: rgba(25, 135, 84, 0.1);
                }

                .farmlink-notification-icon.payment {
                    color: #198754;
                    background: rgba(25, 135, 84, 0.1);
                }

                .farmlink-notification-icon.delivery {
                    color: #0d6efd;
                    background: rgba(13, 110, 253, 0.1);
                }

                .farmlink-notification-icon.request {
                    color: #b58105;
                    background: rgba(255, 193, 7, 0.14);
                }

                .farmlink-notification-icon.order {
                    color: #6f42c1;
                    background: rgba(111, 66, 193, 0.1);
                }

                .farmlink-notification-icon.support {
                    color: #fd7e14;
                    background: rgba(253, 126, 20, 0.1);
                }

                .farmlink-notification-icon.system {
                    color: #6c757d;
                    background: rgba(108, 117, 125, 0.1);
                }

                .farmlink-notification-content {
                    min-width: 0;
                    flex: 1;
                }

                .farmlink-notification-content strong {
                    display: block;
                    color: #212529;
                    font-size: 13px;
                    line-height: 1.35;
                }

                .farmlink-notification-content p {
                    margin: 3px 0 4px;
                    color: #6c757d;
                    font-size: 12px;
                    line-height: 1.45;
                }

                .farmlink-notification-content small {
                    color: #adb5bd;
                    font-size: 10px;
                }

                .farmlink-unread-dot {
                    width: 7px;
                    height: 7px;
                    flex-shrink: 0;
                    margin-top: 4px;
                    border-radius: 50%;
                    background: #198754;
                }

                .farmlink-notification-empty {
                    padding: 35px 20px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 12px;
                }

                .farmlink-notification-footer {
                    padding: 9px 15px;
                    border-top: 1px solid #f0f0f0;
                    color: #6c757d;
                    text-align: center;
                    font-size: 10px;
                }

                /* ==========================
                   DASHBOARD
                ========================== */

                .farmlink-dashboard-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 245px;
                    overflow: hidden;
                    border: 1px solid #e9ecef;
                    border-radius: 14px;
                    background: white;
                    box-shadow:
                        0 16px 40px rgba(0, 0, 0, 0.12);
                    animation: farmlinkDropdownIn 0.16s ease-out;
                }

                .farmlink-dropdown-profile {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 14px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .farmlink-user-avatar {
                    width: 38px;
                    height: 38px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(25, 135, 84, 0.11);
                    color: #198754;
                    font-weight: 700;
                }

                .farmlink-dropdown-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 13px 14px;
                    color: #212529;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    transition:
                        background 0.2s ease,
                        color 0.2s ease;
                }

                .farmlink-dropdown-link:hover {
                    color: #198754;
                    background: #f5faf7;
                }

                .farmlink-logout-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    padding: 8px 13px;
                    border: 1px solid #dee2e6;
                    border-radius: 10px;
                    background: white;
                    color: #6c757d;
                    font-size: 14px;
                    font-weight: 600;
                    transition:
                        border-color 0.2s ease,
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .farmlink-logout-button:hover {
                    border-color: #dc3545;
                    color: #dc3545;
                    background: #fff8f8;
                }

                .farmlink-get-started {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    padding: 9px 15px;
                    border-radius: 10px;
                    background: #198754;
                    color: white;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow:
                        0 5px 12px rgba(25, 135, 84, 0.14);
                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-get-started:hover {
                    color: white;
                    background: #157347;
                    transform: translateY(-1px);
                    box-shadow:
                        0 7px 16px rgba(25, 135, 84, 0.2);
                }

                .farmlink-mobile-menu-button {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #dee2e6;
                    border-radius: 11px;
                    background: white;
                    color: #495057;
                    transition:
                        border-color 0.2s ease,
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .farmlink-mobile-menu-button:hover {
                    color: #198754;
                    border-color: #a9d6bd;
                    background: #f5faf7;
                }

                .farmlink-mobile-menu {
                    padding: 10px 0 16px;
                    border-top: 1px solid #f0f0f0;
                    animation: farmlinkMobileMenuIn 0.18s ease-out;
                }

                .farmlink-mobile-link {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    padding: 12px 13px;
                    border: 0;
                    border-radius: 11px;
                    background: transparent;
                    color: #212529;
                    text-decoration: none;
                    font-size: 15px;
                    font-weight: 600;
                    transition:
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .farmlink-mobile-link:hover,
                .farmlink-mobile-link.active {
                    color: #198754;
                    background: rgba(25, 135, 84, 0.08);
                }

                .farmlink-mobile-dashboard-button {
                    justify-content: space-between;
                    cursor: pointer;
                }

                .farmlink-mobile-submenu {
                    margin: 3px 0 3px 19px;
                    padding-left: 14px;
                    border-left: 2px solid rgba(25, 135, 84, 0.14);
                }

                .farmlink-mobile-submenu-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    color: #6c757d;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 9px;
                }

                .farmlink-mobile-submenu-link:hover {
                    color: #198754;
                    background: #f5faf7;
                }

                /* ==========================
                   MOBILE NOTIFICATIONS
                ========================== */

                .farmlink-mobile-notification-section {
                    margin-top: 2px;
                }

                .farmlink-mobile-notification-button {
                    justify-content: space-between;
                    cursor: pointer;
                }

                .farmlink-mobile-notification-button
                    .position-relative {
                    display: inline-flex;
                }

                .farmlink-mobile-notification-dot {
                    position: absolute;
                    top: -7px;
                    right: -10px;
                    min-width: 16px;
                    height: 16px;
                    padding: 0 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    border-radius: 20px;
                    background: #dc3545;
                    color: white;
                    font-size: 8px;
                    line-height: 1;
                }

                .farmlink-mobile-notifications {
                    margin: 3px 0 6px 19px;
                    padding: 12px;
                    border-left: 2px solid rgba(25, 135, 84, 0.14);
                    border-radius: 0 10px 10px 0;
                    background: #f8f9fa;
                }

                .farmlink-mobile-notification-item {
                    width: 100%;
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    padding: 10px 8px;
                    border: 0;
                    border-radius: 9px;
                    background: transparent;
                    text-align: left;
                    cursor: pointer;
                }

                .farmlink-mobile-notification-item:hover,
                .farmlink-mobile-notification-item.unread {
                    background: white;
                }

                .farmlink-mobile-notification-item
                    strong {
                    display: block;
                    color: #212529;
                    font-size: 12px;
                    line-height: 1.35;
                }

                .farmlink-mobile-notification-item
                    p {
                    margin: 2px 0;
                    color: #6c757d;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .farmlink-mobile-notification-item
                    small {
                    color: #adb5bd;
                    font-size: 9px;
                }

                .farmlink-mobile-divider {
                    height: 1px;
                    margin: 10px 0 13px;
                    background: #e9ecef;
                }

                .farmlink-mobile-auth-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 11px 14px;
                    border-radius: 11px;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                }

                .farmlink-mobile-auth-button.primary {
                    border: 1px solid #198754;
                    background: #198754;
                    color: white;
                }

                .farmlink-mobile-auth-button.secondary {
                    border: 1px solid #dee2e6;
                    background: white;
                    color: #495057;
                }

                .farmlink-mobile-auth-button.secondary:hover {
                    color: #198754;
                    border-color: #a9d6bd;
                    background: #f5faf7;
                }

                .farmlink-mobile-user {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 11px 12px;
                    border-radius: 12px;
                    background: #f8f9fa;
                }

                @keyframes farmlinkDropdownIn {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes farmlinkMobileMenuIn {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 991.98px) {
                    .farmlink-navbar-inner {
                        min-height: 70px;
                    }
                }

                @media (max-width: 575px) {
                    .farmlink-navbar-inner {
                        min-height: 64px;
                    }

                    .farmlink-navbar-logo {
                        width: 39px;
                        height: 39px;
                        border-radius: 11px;
                    }

                    .farmlink-navbar-brand .fs-5 {
                        font-size: 1.05rem !important;
                    }
                }
            `}</style>
        </>
    );
};

export default Navbar;