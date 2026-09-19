import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRequests } from '../services/requestService';
import {
getMyOrders,
confirmDelivery
} from '../services/orderService';
import {
initializePayment,
getMyPayments
} from '../services/paymentService';
import { useNavigate } from 'react-router-dom';
import { getProductImage } from '../utils/productImage';
import {
ClipboardList,
PackageCheck,
CircleCheck,
ShoppingCart,
MapPin,
ArrowRight,
RefreshCw,
Search,
CreditCard,
Clock3,
CheckCircle2,
XCircle
} from 'lucide-react';

const BuyerDashboard = () => {
const { user } = useAuth();
const navigate = useNavigate();

const [requests, setRequests] = useState([]);
const [orders, setOrders] = useState([]);

const [loading, setLoading] = useState(true);
const [ordersLoading, setOrdersLoading] = useState(true);
const [requestsLoading, setRequestsLoading] = useState(false);

const [error, setError] = useState('');
const [paymentLoading, setPaymentLoading] = useState('');

const [payments, setPayments] = useState([]);
const [paymentsLoading, setPaymentsLoading] = useState(true);

useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
        try {
            await Promise.all([
                fetchRequests(ignore),
                fetchOrders(ignore),
                fetchPayments(ignore)
            ]);
        } catch (error) {
            if (!ignore) {
                console.error(
                    'Dashboard loading error:',
                    error
                );
            }
        }
    };

    loadDashboard();

    return () => {
        ignore = true;
    };
}, []);

// Handles both direct arrays and API response envelopes.
const extractList = (response, key) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.[key])) {
        return response[key];
    }

    return [];
};

const fetchRequests = async (ignore = false) => {
    try {
        setRequestsLoading(true);
        setError('');

        const response = await getRequests();

        if (!ignore) {
            setRequests(
                extractList(response, 'requests')
            );
        }
    } catch (err) {
        if (!ignore) {
            console.error(
                'Fetch buyer requests error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load your requests.'
            );
        }
    } finally {
        if (!ignore) {
            setLoading(false);
            setRequestsLoading(false);
        }
    }
};

const fetchOrders = async (ignore = false) => {
    try {
        setOrdersLoading(true);

        const response = await getMyOrders();

        if (!ignore) {
            setOrders(
                extractList(response, 'orders')
            );
        }
    } catch (err) {
        if (!ignore) {
            console.error(
                'Fetch orders error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load your orders.'
            );
        }
    } finally {
        if (!ignore) {
            setOrdersLoading(false);
        }
    }
};

const fetchPayments = async (ignore = false) => {
    try {
        setPaymentsLoading(true);

        const response = await getMyPayments();

        if (!ignore) {
            setPayments(
                extractList(response, 'payments')
            );
        }
    } catch (err) {
        if (!ignore) {
            console.error(
                'Fetch payment history error:',
                err
            );
        }
    } finally {
        if (!ignore) {
            setPaymentsLoading(false);
        }
    }
};

const handleRefresh = async () => {
    setError('');

    await Promise.all([
        fetchRequests(),
        fetchOrders(),
        fetchPayments()
    ]);
};

const handlePayment = async (orderId) => {
    try {
        setPaymentLoading(orderId);
        setError('');

        const response =
            await initializePayment(orderId);

        if (!response?.success) {
            throw new Error(
                response?.message ||
                'Unable to initialize payment.'
            );
        }

        const paymentData = response?.data;

        if (!paymentData?.authorizationUrl) {
            throw new Error(
                'Payment authorization URL was not returned.'
            );
        }

        localStorage.setItem(
            'farmlink_payment_reference',
            paymentData.reference || ''
        );

        localStorage.setItem(
            'farmlink_payment_order_id',
            orderId
        );

        window.location.href =
            paymentData.authorizationUrl;
    } catch (error) {
        console.error(
            'Payment initialization error:',
            error
        );

        setError(
            error.response?.data?.message ||
            error.message ||
            'Unable to initialize payment.'
        );

        setPaymentLoading('');
    }
};

const handleConfirmDelivery = async (orderId) => {
    try {
        setError('');

        const response =
            await confirmDelivery(orderId);

        if (!response?.success) {
            throw new Error(
                response?.message ||
                'Unable to confirm delivery.'
            );
        }

        await fetchOrders();
        await fetchPayments();
    } catch (error) {
        console.error(
            'Confirm delivery error:',
            error
        );

        setError(
            error.response?.data?.message ||
            error.message ||
            'Unable to confirm delivery.'
        );
    }
};

const pendingRequests = requests.filter(
    (request) => request.status === 'pending'
).length;

const acceptedRequests = requests.filter(
    (request) => request.status === 'accepted'
).length;

const completedRequests = requests.filter(
    (request) => request.status === 'completed'
).length;

const rejectedRequests = requests.filter(
    (request) => request.status === 'rejected'
).length;

const activeOrders = orders.filter(
    (order) =>
        order.status !== 'cancelled' &&
        order.status !== 'completed'
).length;

const paidOrders = orders.filter(
    (order) => order.paymentStatus === 'paid'
).length;

const completedOrders = orders.filter(
    (order) => order.status === 'completed'
).length;

const unpaidOrders = orders.filter(
    (order) =>
        order.paymentStatus !== 'paid' &&
        order.status !== 'cancelled' &&
        order.status !== 'completed'
).length;

const getRequestStatusClass = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-warning-subtle text-warning-emphasis';

        case 'accepted':
            return 'bg-success-subtle text-success';

        case 'rejected':
            return 'bg-danger-subtle text-danger';

        case 'completed':
            return 'bg-secondary-subtle text-secondary';

        default:
            return 'bg-light text-muted';
    }
};

const getRequestStatusLabel = (status) => {
    switch (status) {
        case 'pending':
            return 'Pending';

        case 'accepted':
            return 'Accepted';

        case 'rejected':
            return 'Rejected';

        case 'completed':
            return 'Completed';

        default:
            return 'Unknown';
    }
};

const getOrderStatusClass = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-warning-subtle text-warning-emphasis';

        case 'confirmed':
            return 'bg-primary-subtle text-primary';

        case 'processing':
            return 'bg-info-subtle text-info-emphasis';

        case 'completed':
            return 'bg-success-subtle text-success';

        case 'cancelled':
            return 'bg-danger-subtle text-danger';

        default:
            return 'bg-light text-muted';
    }
};

const getOrderStatusLabel = (status) => {
    switch (status) {
        case 'pending':
            return 'Order Placed';

        case 'confirmed':
            return 'Confirmed';

        case 'processing':
            return 'Processing';

        case 'completed':
            return 'Completed';

        case 'cancelled':
            return 'Cancelled';

        default:
            return 'Unknown Status';
    }
};

const getPaymentStatusClass = (status) => {
    switch (status) {
        case 'paid':
            return 'bg-success-subtle text-success';

        case 'pending':
            return 'bg-warning-subtle text-warning-emphasis';

        case 'failed':
            return 'bg-danger-subtle text-danger';

        case 'refunded':
            return 'bg-info-subtle text-info-emphasis';

        case 'unpaid':
            return 'bg-danger-subtle text-danger';

        default:
            return 'bg-light text-muted';
    }
};

const getPaymentStatusLabel = (status) => {
    switch (status) {
        case 'paid':
            return 'Payment Successful';

        case 'pending':
            return 'Payment Pending';

        case 'failed':
            return 'Payment Failed';

        case 'refunded':
            return 'Payment Refunded';

        case 'unpaid':
            return 'Payment Required';

        default:
            return 'Payment Status Unknown';
    }
};

const getOrderStep = (order) => {
    if (order.status === 'cancelled') {
        return 0;
    }

    if (order.status === 'completed') {
        return 5;
    }

    if (order.status === 'processing') {
        return 4;
    }

    if (order.status === 'confirmed') {
        return 3;
    }

    if (order.paymentStatus === 'paid') {
        return 2;
    }

    return 1;
};

const OrderTracking = ({ order }) => {
    if (order.status === 'cancelled') {
        return (
            <div className="mt-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                        className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                            width: '40px',
                            height: '40px'
                        }}
                    >
                        <XCircle size={21} />
                    </div>

                    <div>
                        <h6 className="fw-bold mb-0">
                            Order Cancelled
                        </h6>

                        <small className="text-muted">
                            This order is no longer active.
                        </small>
                    </div>
                </div>

                <div className="alert alert-danger bg-danger-subtle border-0 mb-0 rounded-3 small">
                    This order has been cancelled and will not
                    continue through the order process.
                </div>
            </div>
        );
    }

    const currentStep = getOrderStep(order);

    const steps = [
        {
            number: 1,
            title: 'Order Placed',
            description: 'Order created'
        },
        {
            number: 2,
            title: 'Payment',
            description: 'Payment received'
        },
        {
            number: 3,
            title: 'Confirmed',
            description: 'Farmer confirmed'
        },
        {
            number: 4,
            title: 'Processing',
            description: 'Being prepared'
        },
        {
            number: 5,
            title: 'Completed',
            description: 'Order completed'
        }
    ];

    const progressWidth =
        currentStep === 1
            ? '0%'
            : currentStep === 2
                ? '20%'
                : currentStep === 3
                    ? '40%'
                    : currentStep === 4
                        ? '60%'
                        : '80%';

    return (
        <div className="mt-4 pt-4 border-top">
            <div className="d-flex align-items-center gap-2 mb-4">
                <PackageCheck
                    size={19}
                    className="text-success"
                />

                <h6 className="fw-bold mb-0">
                    Order Tracking
                </h6>
            </div>

            <div className="position-relative px-1">
                <div
                    className="position-absolute"
                    style={{
                        top: '18px',
                        left: '10%',
                        right: '10%',
                        height: '3px',
                        backgroundColor: '#e9ecef',
                        zIndex: 0
                    }}
                />

                <div
                    className="position-absolute bg-success"
                    style={{
                        top: '18px',
                        left: '10%',
                        width: progressWidth,
                        height: '3px',
                        zIndex: 0,
                        transition: 'width 0.3s ease'
                    }}
                />

                <div className="d-flex justify-content-between position-relative">
                    {steps.map((step) => {
                        const isCompleted =
                            currentStep > step.number;

                        const isCurrent =
                            currentStep === step.number;

                        return (
                            <div
                                key={step.number}
                                className="text-center"
                                style={{
                                    width: '20%'
                                }}
                            >
                                <div
                                    className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center fw-bold ${
                                        isCompleted || isCurrent
                                            ? 'bg-success text-white'
                                            : 'bg-white text-muted border'
                                    }`}
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        position: 'relative',
                                        zIndex: 1
                                    }}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 size={18} />
                                    ) : (
                                        step.number
                                    )}
                                </div>

                                <small
                                    className={`d-block ${
                                        isCurrent
                                            ? 'fw-bold text-success'
                                            : 'text-muted'
                                    }`}
                                >
                                    {step.title}
                                </small>

                                <small
                                    className="text-muted d-none d-md-block"
                                    style={{
                                        fontSize: '11px'
                                    }}
                                >
                                    {step.description}
                                </small>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="alert alert-light border rounded-3 mt-4 mb-0 small">
                {order.status === 'pending' &&
                    order.paymentStatus !== 'paid' && (
                        <>
                            <strong>
                                Payment required.
                            </strong>{' '}
                            Complete your payment to continue
                            with your order.
                        </>
                    )}

                {order.status === 'pending' &&
                    order.paymentStatus === 'paid' && (
                        <>
                            <strong>
                                Payment received.
                            </strong>{' '}
                            Your payment has been received.
                            Waiting for the farmer to confirm
                            your order.
                        </>
                    )}

                {order.status === 'confirmed' && (
                    <>
                        <strong>
                            Order confirmed.
                        </strong>{' '}
                        The farmer has confirmed your order
                        and it is ready for processing.
                    </>
                )}

                {order.status === 'processing' && (
                    <>
                        <strong>
                            Order processing.
                        </strong>{' '}
                        The farmer is currently preparing
                        your produce.
                    </>
                )}

                {order.status === 'completed' && (
                    <>
                        <strong>
                            Order completed.
                        </strong>{' '}
                        Your order has been completed
                        successfully.
                    </>
                )}
            </div>
        </div>
    );
};

return (
    <div className="bg-light min-vh-100">
        <main className="container py-4 py-md-5">

            <section className="mb-4">
                <div className="bg-white border rounded-4 shadow-sm overflow-hidden">
                    <div className="p-4 p-md-5">
                        <div className="row align-items-center g-4">
                            <div className="col-lg-8">
                                <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 mb-3">
                                    Buyer Dashboard
                                </span>

                                <h1 className="fw-bold mb-2">
                                    Welcome back,{' '}
                                    {user?.name || 'Buyer'} 👋
                                </h1>

                                <p className="text-muted mb-0">
                                    Keep track of your produce
                                    requests, orders and payments
                                    from one place.
                                </p>
                            </div>

                            <div className="col-lg-4">
                                <div className="d-flex flex-column flex-sm-row flex-lg-column gap-2 justify-content-lg-end align-items-stretch align-items-sm-center">
                                    <button
                                        type="button"
                                        className="btn btn-success rounded-3 px-4"
                                        onClick={() =>
                                            navigate('/marketplace')
                                        }
                                    >
                                        <span className="d-inline-flex align-items-center justify-content-center gap-2">
                                            <Search size={17} />
                                            Browse Produce
                                            <ArrowRight size={17} />
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-success rounded-3 px-4"
                                        onClick={handleRefresh}
                                        disabled={
                                            requestsLoading ||
                                            ordersLoading ||
                                            paymentsLoading
                                        }
                                    >
                                        <span className="d-inline-flex align-items-center justify-content-center gap-2">
                                            <RefreshCw
                                                size={16}
                                                className={
                                                    requestsLoading ||
                                                    ordersLoading ||
                                                    paymentsLoading
                                                        ? 'spin'
                                                        : ''
                                                }
                                            />
                                            Refresh Dashboard
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-top bg-light px-4 px-md-5 py-3">
                        <div className="row g-3 small">
                            <div className="col-12 col-md-4">
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <Clock3
                                        size={16}
                                        className="text-success"
                                    />

                                    <span>
                                        {pendingRequests > 0
                                            ? `${pendingRequests} request${
                                                pendingRequests === 1
                                                    ? ''
                                                    : 's'
                                            } awaiting farmer response`
                                            : 'No pending requests'}
                                    </span>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <PackageCheck
                                        size={16}
                                        className="text-success"
                                    />

                                    <span>
                                        {activeOrders > 0
                                            ? `${activeOrders} active order${
                                                activeOrders === 1
                                                    ? ''
                                                    : 's'
                                            }`
                                            : 'No active orders'}
                                    </span>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <CreditCard
                                        size={16}
                                        className="text-success"
                                    />

                                    <span>
                                        {unpaidOrders > 0
                                            ? `${unpaidOrders} order${
                                                unpaidOrders === 1
                                                    ? ''
                                                    : 's'
                                            } awaiting payment`
                                            : 'No payment required'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="alert alert-danger rounded-4 border-0 shadow-sm d-flex align-items-start justify-content-between gap-3 mb-4">
                    <div>
                        <strong className="d-block mb-1">
                            Something went wrong
                        </strong>

                        <span className="small">
                            {error}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="btn-close flex-shrink-0"
                        onClick={() => setError('')}
                        aria-label="Close"
                    />
                </div>
            )}

            <section className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h5 className="fw-bold mb-1">
                            Overview
                        </h5>

                        <p className="text-muted small mb-0">
                            A quick look at your FarmLink activity.
                        </p>
                    </div>
                </div>

                <div className="row g-3 g-md-4">
                    <div className="col-6 col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <p className="text-muted small mb-1">
                                            Requests
                                        </p>

                                        <h2 className="fw-bold mb-1">
                                            {requests.length}
                                        </h2>

                                        <small className="text-muted">
                                            {pendingRequests} pending
                                        </small>
                                    </div>

                                    <div
                                        className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                            width: '44px',
                                            height: '44px'
                                        }}
                                    >
                                        <ClipboardList size={21} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <p className="text-muted small mb-1">
                                            Active Orders
                                        </p>

                                        <h2 className="fw-bold mb-1">
                                            {activeOrders}
                                        </h2>

                                        <small className="text-muted">
                                            Currently active
                                        </small>
                                    </div>

                                    <div
                                        className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                            width: '44px',
                                            height: '44px'
                                        }}
                                    >
                                        <PackageCheck size={21} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <p className="text-muted small mb-1">
                                            Paid Orders
                                        </p>

                                        <h2 className="fw-bold mb-1">
                                            {paidOrders}
                                        </h2>

                                        <small className="text-muted">
                                            Payments completed
                                        </small>
                                    </div>

                                    <div
                                        className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                            width: '44px',
                                            height: '44px'
                                        }}
                                    >
                                        <CircleCheck size={21} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <p className="text-muted small mb-1">
                                            Completed
                                        </p>

                                        <h2 className="fw-bold mb-1">
                                            {completedOrders}
                                        </h2>

                                        <small className="text-muted">
                                            Successfully completed
                                        </small>
                                    </div>

                                    <div
                                        className="bg-secondary-subtle text-secondary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                            width: '44px',
                                            height: '44px'
                                        }}
                                    >
                                        <ShoppingCart size={21} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="card border-0 shadow-sm rounded-4 mb-5">
                <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <div
                                    className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '38px',
                                        height: '38px'
                                    }}
                                >
                                    <ClipboardList size={19} />
                                </div>

                                <div>
                                    <h4 className="fw-bold mb-0">
                                        My Produce Requests
                                    </h4>

                                    <p className="text-muted small mb-0">
                                        Track requests sent to farmers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm rounded-3 px-3"
                            onClick={fetchRequests}
                            disabled={requestsLoading}
                        >
                            <span className="d-inline-flex align-items-center gap-2">
                                <RefreshCw size={15} />

                                {requestsLoading
                                    ? 'Refreshing...'
                                    : 'Refresh Requests'}
                            </span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-success mb-3"
                                role="status"
                            />

                            <p className="text-muted small mb-0">
                                Loading your requests...
                            </p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-5 px-3">
                            <div
                                className="bg-success-subtle text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                                style={{
                                    width: '72px',
                                    height: '72px'
                                }}
                            >
                                <ClipboardList size={29} />
                            </div>

                            <h5 className="fw-bold mb-2">
                                No requests yet
                            </h5>

                            <p
                                className="text-muted small mb-4 mx-auto"
                                style={{
                                    maxWidth: '430px'
                                }}
                            >
                                Browse the marketplace and send a
                                produce request directly to a farmer.
                            </p>

                            <button
                                type="button"
                                className="btn btn-success rounded-3 px-4"
                                onClick={() =>
                                    navigate('/marketplace')
                                }
                            >
                                <span className="d-inline-flex align-items-center gap-2">
                                    Browse Marketplace
                                    <ArrowRight size={16} />
                                </span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-3 py-2">
                                    {pendingRequests} Pending
                                </span>

                                <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                                    {acceptedRequests} Accepted
                                </span>

                                <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2">
                                    {completedRequests} Completed
                                </span>

                                <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
                                    {rejectedRequests} Rejected
                                </span>
                            </div>

                            <div className="row g-3 g-lg-4">
                                {requests.map((request) => (
                                    <div
                                        className="col-lg-6"
                                        key={request._id}
                                    >
                                        <div className="border rounded-4 p-3 p-md-4 h-100">
                                            <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                                                <div className="min-w-0">
                                                    <h5 className="fw-bold mb-1 text-truncate">
                                                        {request.product?.name ||
                                                            'Produce'}
                                                    </h5>

                                                    <small className="text-muted">
                                                        {request.product?.category ||
                                                            'Agricultural Produce'}
                                                    </small>
                                                </div>

                                                <span
                                                    className={`badge ${getRequestStatusClass(
                                                        request.status
                                                    )} rounded-pill flex-shrink-0 px-3 py-2`}
                                                >
                                                    {getRequestStatusLabel(
                                                        request.status
                                                    )}
                                                </span>
                                            </div>

                                            <div className="row g-3 small">
                                                <div className="col-6">
                                                    <span className="text-muted d-block mb-1">
                                                        Quantity
                                                    </span>

                                                    <strong>
                                                        {request.quantity}{' '}
                                                        {request.product?.unit ||
                                                            ''}
                                                    </strong>
                                                </div>

                                                <div className="col-6">
                                                    <span className="text-muted d-block mb-1">
                                                        Price
                                                    </span>

                                                    <strong>
                                                        ₦
                                                        {Number(
                                                            request.product?.price ||
                                                            0
                                                        ).toLocaleString()}
                                                        <span className="text-muted fw-normal">
                                                            /
                                                            {request.product?.unit ||
                                                                ''}
                                                        </span>
                                                    </strong>
                                                </div>

                                                <div className="col-6">
                                                    <span className="text-muted d-block mb-1">
                                                        Farmer
                                                    </span>

                                                    <strong>
                                                        {request.farmer?.name ||
                                                            'Farmer'}
                                                    </strong>
                                                </div>

                                                <div className="col-6">
                                                    <span className="text-muted d-block mb-1">
                                                        Location
                                                    </span>

                                                    <strong className="text-truncate d-block">
                                                        {request.farmer?.location ||
                                                            'Not provided'}
                                                    </strong>
                                                </div>

                                                <div className="col-12">
                                                    <span className="text-muted d-block mb-1">
                                                        Message
                                                    </span>

                                                    <div className="bg-light rounded-3 p-3">
                                                        {request.message ||
                                                            'No message'}
                                                    </div>
                                                </div>
                                            </div>

                                            {request.status === 'pending' && (
                                                <div className="alert alert-warning bg-warning-subtle border-0 mt-4 mb-0 py-3 small rounded-3">
                                                    <strong>
                                                        Waiting for farmer
                                                        response.
                                                    </strong>{' '}
                                                    Your request is still
                                                    being reviewed.
                                                </div>
                                            )}

                                            {request.status === 'accepted' && (
                                                <div className="alert alert-success bg-success-subtle border-0 mt-4 mb-0 py-3 small rounded-3">
                                                    <strong>
                                                        Request accepted.
                                                    </strong>{' '}
                                                    The farmer has accepted
                                                    your produce request.
                                                </div>
                                            )}

                                            {request.status === 'rejected' && (
                                                <div className="alert alert-danger bg-danger-subtle border-0 mt-4 mb-0 py-3 small rounded-3">
                                                    <strong>
                                                        Request rejected.
                                                    </strong>{' '}
                                                    The farmer did not
                                                    accept this request.
                                                </div>
                                            )}

                                            {request.status === 'completed' && (
                                                <div className="alert alert-secondary bg-secondary-subtle border-0 mt-4 mb-0 py-3 small rounded-3">
                                                    <strong>
                                                        Request completed.
                                                    </strong>{' '}
                                                    This produce request has
                                                    been completed.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section className="card border-0 shadow-sm rounded-4 mb-5">
                <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <div
                                    className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '38px',
                                        height: '38px'
                                    }}
                                >
                                    <ShoppingCart size={19} />
                                </div>

                                <div>
                                    <h4 className="fw-bold mb-0">
                                        My Orders
                                    </h4>

                                    <p className="text-muted small mb-0">
                                        Track purchases, payments and
                                        delivery progress.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                {orders.length}{' '}
                                {orders.length === 1
                                    ? 'Order'
                                    : 'Orders'}
                            </span>

                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm rounded-3 px-3"
                                onClick={fetchOrders}
                                disabled={ordersLoading}
                            >
                                <span className="d-inline-flex align-items-center gap-2">
                                    <RefreshCw size={15} />

                                    <span className="d-none d-sm-inline">
                                        Refresh
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>

                    {ordersLoading ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-success mb-3"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>

                            <p className="text-muted small mb-0">
                                Loading your orders...
                            </p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-5 px-3">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success mb-3"
                                style={{
                                    width: '72px',
                                    height: '72px'
                                }}
                            >
                                <ShoppingCart size={29} />
                            </div>

                            <h5 className="fw-bold mb-2">
                                No orders yet
                            </h5>

                            <p className="text-muted small mb-4 mx-auto">
                                When a farmer accepts your request and
                                an order is created, it will appear here.
                            </p>

                            <button
                                type="button"
                                className="btn btn-success rounded-3 px-4"
                                onClick={() =>
                                    navigate('/marketplace')
                                }
                            >
                                <span className="d-inline-flex align-items-center gap-2">
                                    Start Shopping
                                    <ArrowRight size={16} />
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4">
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="border rounded-4 overflow-hidden bg-white"
                                >
                                    <div className="p-3 p-md-4 border-bottom bg-light">
                                        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                                            <div className="min-w-0">
                                                <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                                                    <h6 className="fw-bold mb-0 text-break">
                                                        {order.product?.name ||
                                                            'Product'}
                                                    </h6>

                                                    <span
                                                        className={`badge rounded-pill ${getOrderStatusClass(
                                                            order.status
                                                        )} px-3 py-2`}
                                                    >
                                                        {getOrderStatusLabel(
                                                            order.status
                                                        )}
                                                    </span>
                                                </div>

                                                <small className="text-muted d-block text-break">
                                                    Order ID: {order._id}
                                                </small>
                                            </div>

                                            <div className="text-sm-end">
                                                <small className="text-muted d-block mb-1">
                                                    Total amount
                                                </small>

                                                <span className="fs-5 fw-bold text-success">
                                                    ₦
                                                    {Number(
                                                        order.totalAmount ||
                                                        0
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 p-md-4">
                                        <div className="row g-4">
                                            <div className="col-12 col-md-4 col-lg-3">
                                                <button
                                                    type="button"
                                                    className="border-0 p-0 bg-light rounded-4 overflow-hidden w-100"
                                                    style={{
                                                        height: '200px'
                                                    }}
                                                    onClick={() => {
                                                        if (
                                                            order.product?._id
                                                        ) {
                                                            navigate(
                                                                `/products/${order.product._id}`
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <img
                                                        src={getProductImage(
                                                            order.product
                                                        )}
                                                        alt={
                                                            order.product
                                                                ?.name ||
                                                            'Product'
                                                        }
                                                        className="w-100 h-100"
                                                        style={{
                                                            objectFit:
                                                                'cover'
                                                        }}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display =
                                                                'none';
                                                        }}
                                                    />
                                                </button>
                                            </div>

                                            <div className="col-12 col-md-8 col-lg-9">
                                                <div className="row g-3">
                                                    <div className="col-6 col-lg-4">
                                                        <div className="bg-light rounded-3 p-3 h-100">
                                                            <small className="text-muted d-block mb-1">
                                                                Quantity
                                                            </small>

                                                            <div className="fw-semibold">
                                                                {
                                                                    order.quantity
                                                                }{' '}
                                                                {order
                                                                    .product
                                                                    ?.unit ||
                                                                    ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-6 col-lg-4">
                                                        <div className="bg-light rounded-3 p-3 h-100">
                                                            <small className="text-muted d-block mb-1">
                                                                Unit Price
                                                            </small>

                                                            <div className="fw-semibold">
                                                                ₦
                                                                {Number(
                                                                    order.unitPrice ||
                                                                    0
                                                                ).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-12 col-lg-4">
                                                        <div className="bg-light rounded-3 p-3 h-100">
                                                            <small className="text-muted d-block mb-1">
                                                                Farmer
                                                            </small>

                                                            <div className="fw-semibold text-truncate">
                                                                {order
                                                                    .farmer
                                                                    ?.name ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-12">
                                                        <div className="border rounded-3 p-3">
                                                            <div className="d-flex align-items-start gap-2">
                                                                <MapPin
                                                                    size={18}
                                                                    className="text-success flex-shrink-0 mt-1"
                                                                />

                                                                <div className="min-w-0">
                                                                    <small className="text-muted d-block">
                                                                        Product
                                                                        Location
                                                                    </small>

                                                                    <span className="fw-semibold text-break">
                                                                        {order
                                                                            .product
                                                                            ?.location ||
                                                                            'Location not available'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-top mt-4 pt-4">
                                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                                                <div>
                                                    <small className="text-muted d-block mb-2">
                                                        Payment Status
                                                    </small>

                                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                                        <span
                                                            className={`badge rounded-pill ${getPaymentStatusClass(
                                                                order.paymentStatus
                                                            )} px-3 py-2`}
                                                        >
                                                            {getPaymentStatusLabel(
                                                                order.paymentStatus
                                                            )}
                                                        </span>

                                                        {order.paymentStatus ===
                                                            'paid' && (
                                                            <span className="small text-success">
                                                                <CheckCircle2
                                                                    size={14}
                                                                    className="me-1"
                                                                />
                                                                Secured
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {order.paymentStatus !==
                                                    'paid' &&
                                                    order.status !==
                                                        'cancelled' &&
                                                    order.status !==
                                                        'completed' && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-success rounded-3 px-4"
                                                            onClick={() =>
                                                                handlePayment(
                                                                    order._id
                                                                )
                                                            }
                                                            disabled={
                                                                paymentLoading ===
                                                                order._id
                                                            }
                                                        >
                                                            {paymentLoading ===
                                                            order._id ? (
                                                                <>
                                                                    <span
                                                                        className="spinner-border spinner-border-sm me-2"
                                                                        role="status"
                                                                    />

                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <span className="d-inline-flex align-items-center gap-2">
                                                                    <CreditCard
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                    Pay Now
                                                                </span>
                                                            )}
                                                        </button>
                                                    )}
                                            </div>
                                        </div>

                                        <OrderTracking order={order} />

                                        {order.status === 'processing' &&
                                            order.paymentStatus ===
                                                'paid' &&
                                            order.deliveryStatus !==
                                                'confirmed' && (
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success rounded-3 px-4 w-100"
                                                        onClick={() =>
                                                            handleConfirmDelivery(
                                                                order._id
                                                            )
                                                        }
                                                    >
                                                        <span className="d-inline-flex align-items-center justify-content-center gap-2">
                                                            <PackageCheck
                                                                size={17}
                                                            />
                                                            Confirm Delivery
                                                        </span>
                                                    </button>

                                                    <small className="text-muted d-block text-center mt-2">
                                                        Only confirm after you
                                                        have received your
                                                        produce.
                                                    </small>
                                                </div>
                                            )}

                                        {order.status === 'completed' && (
                                            <div className="alert alert-success bg-success-subtle border-0 rounded-3 mt-4 mb-0 small">
                                                <strong>
                                                    Purchase completed.
                                                </strong>{' '}
                                                Your order has successfully
                                                reached the completed stage.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h4 className="fw-bold mb-1">
                            Payment History
                        </h4>

                        <p className="text-muted mb-0">
                            View your FarmLink payment transactions.
                        </p>
                    </div>
                </div>

                {paymentsLoading ? (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <div
                                className="spinner-border text-success mb-3"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>

                            <p className="text-muted mb-0">
                                Loading payment history...
                            </p>
                        </div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <CreditCard
                                size={42}
                                className="text-muted mb-3"
                            />

                            <h5 className="fw-bold">
                                No payment history yet
                            </h5>

                            <p className="text-muted mb-0">
                                Your completed and pending payments
                                will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Product</th>
                                            <th>Amount</th>
                                            <th>FarmLink Fee</th>
                                            <th>Farmer Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment._id}>
                                                <td>
                                                    <div className="fw-semibold">
                                                        {payment.order
                                                            ?.product
                                                            ?.name ||
                                                            'Product'}
                                                    </div>

                                                    <small className="text-muted">
                                                        Ref:{' '}
                                                        {
                                                            payment.reference
                                                        }
                                                    </small>
                                                </td>

                                                <td>
                                                    ₦
                                                    {Number(
                                                        payment.amount
                                                    ).toLocaleString()}
                                                </td>

                                                <td>
                                                    ₦
                                                    {Number(
                                                        payment.platformFee
                                                    ).toLocaleString()}
                                                </td>

                                                <td>
                                                    ₦
                                                    {Number(
                                                        payment.farmerAmount
                                                    ).toLocaleString()}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            payment.status ===
                                                            'paid'
                                                                ? 'bg-success'
                                                                : payment.status ===
                                                                  'failed'
                                                                ? 'bg-danger'
                                                                : payment.status ===
                                                                  'refunded'
                                                                ? 'bg-warning text-dark'
                                                                : 'bg-secondary'
                                                        }`}
                                                    >
                                                        {payment.status
                                                            ?.charAt(0)
                                                            .toUpperCase() +
                                                            payment.status?.slice(
                                                                1
                                                            )}
                                                    </span>
                                                </td>

                                                <td>
                                                    {payment.createdAt
                                                        ? new Date(
                                                              payment.createdAt
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section>
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h5 className="fw-bold mb-1">
                            Activity Summary
                        </h5>

                        <p className="text-muted small mb-0">
                            Your current request and order status.
                        </p>
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-6 col-md-3">
                        <div className="bg-white border rounded-4 p-3 p-md-4 h-100">
                            <Clock3
                                size={20}
                                className="text-warning mb-3"
                            />

                            <small className="text-muted d-block mb-1">
                                Pending Requests
                            </small>

                            <h4 className="fw-bold mb-0">
                                {pendingRequests}
                            </h4>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="bg-white border rounded-4 p-3 p-md-4 h-100">
                            <CheckCircle2
                                size={20}
                                className="text-success mb-3"
                            />

                            <small className="text-muted d-block mb-1">
                                Accepted Requests
                            </small>

                            <h4 className="fw-bold mb-0">
                                {acceptedRequests}
                            </h4>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="bg-white border rounded-4 p-3 p-md-4 h-100">
                            <CreditCard
                                size={20}
                                className="text-danger mb-3"
                            />

                            <small className="text-muted d-block mb-1">
                                Payment Required
                            </small>

                            <h4 className="fw-bold mb-0">
                                {unpaidOrders}
                            </h4>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="bg-white border rounded-4 p-3 p-md-4 h-100">
                            <PackageCheck
                                size={20}
                                className="text-secondary mb-3"
                            />

                            <small className="text-muted d-block mb-1">
                                Completed Orders
                            </small>

                            <h4 className="fw-bold mb-0">
                                {completedOrders}
                            </h4>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <style>
            {`
                .min-w-0 {
                    min-width: 0;
                }

                .spin {
                    animation: farmlink-spin 1s linear infinite;
                }

                @keyframes farmlink-spin {
                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 575.98px) {
                    h1 {
                        font-size: 1.65rem;
                    }

                    h4 {
                        font-size: 1.05rem;
                    }

                    .card-body {
                        padding-left: 1rem !important;
                        padding-right: 1rem !important;
                    }
                }
            `}
        </style>
    </div>
);


};

export default BuyerDashboard;
