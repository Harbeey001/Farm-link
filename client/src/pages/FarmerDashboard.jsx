import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
    getProductImage,
    getCategoryImage
} from '../utils/productImage';

import {
    createProduct,
    getMyProducts,
    updateProduct,
    deleteProduct
} from '../services/productService';

import {
    getFarmerOrders,
    updateOrderStatus
} from '../services/orderService';

import {
    getRequests,
    updateRequestStatus
} from '../services/requestService';

import {
    Sprout,
    ShoppingBasket,
    PackageCheck,
    ClipboardList,
    ArrowUpRight,
    ShoppingCart,
    Banknote,
    WalletCards,
    RefreshCw,
    Plus,
    Pencil,
    Trash2,
    MapPin,
    Package,
    CheckCircle2,
    Clock3,
    XCircle,
    Truck,
    TrendingUp,
    CircleDollarSign,
    AlertTriangle,
    Boxes,
    ChevronRight
} from 'lucide-react';


const FARM_LINK_FEE = 0.025;
const LOW_STOCK_THRESHOLD = 10;


// ==========================
// RESPONSE HELPER
// ==========================

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

    if (Array.isArray(response?.data?.[key])) {
        return response.data[key];
    }

    return [];
};


const FarmerDashboard = () => {

    const { user, logout } = useAuth();


    // ==========================
    // PRODUCT FORM
    // ==========================

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        quantity: '',
        unit: '',
        price: '',
        location: ''
    });

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');


    // ==========================
    // PRODUCTS
    // ==========================

    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);


    // ==========================
    // EDIT PRODUCT
    // ==========================

    const [editingProduct, setEditingProduct] = useState(null);

    const [editFormData, setEditFormData] = useState({
        name: '',
        category: '',
        description: '',
        quantity: '',
        unit: '',
        price: '',
        location: '',
        status: 'available'
    });

    const [editLoading, setEditLoading] = useState(false);


    // ==========================
    // REQUESTS
    // ==========================

    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);


    // ==========================
    // ORDERS
    // ==========================

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);


    // ==========================
    // GENERAL STATE
    // ==========================

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');


    // ==========================
    // LOAD DATA
    // ==========================

    useEffect(() => {

        if (!user?.id) {
            return;
        }

        let ignore = false;

        const loadDashboardData = async () => {

            await Promise.all([
                fetchProducts(ignore),
                fetchRequests(ignore),
                fetchOrders(ignore)
            ]);

        };

        loadDashboardData();

        return () => {
            ignore = true;
        };

    }, [user?.id]);


    // ==========================
    // IMAGE PREVIEW CLEANUP
    // ==========================

    useEffect(() => {

        return () => {

            if (imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }

        };

    }, [imagePreview]);


    // ==========================
    // FETCH PRODUCTS
    // ==========================

    const fetchProducts = async (ignore = false) => {

        try {

            setProductsLoading(true);

            const response = await getMyProducts();

            if (ignore) {
                return;
            }

            const productData = extractList(
                response,
                'products'
            );

            setProducts(productData);

        } catch (err) {

            if (ignore) {
                return;
            }

            console.error(
                'Fetch products error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load your produce.'
            );

        } finally {

            if (!ignore) {
                setProductsLoading(false);
            }

        }
    };


    // ==========================
    // FETCH REQUESTS
    // ==========================

    const fetchRequests = async (ignore = false) => {

        if (!user?.id) {
            return;
        }

        try {

            setRequestsLoading(true);

            const response = await getRequests();

            if (ignore) {
                return;
            }

            const allRequests = extractList(
                response,
                'requests'
            );

            const farmerRequests =
                allRequests.filter(
                    (request) =>
                        request.farmer?._id?.toString() ===
                        user.id.toString()
                );

            setRequests(farmerRequests);

        } catch (err) {

            if (ignore) {
                return;
            }

            console.error(
                'Fetch requests error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load requests.'
            );

        } finally {

            if (!ignore) {
                setRequestsLoading(false);
            }

        }
    };


    // ==========================
    // FETCH ORDERS
    // ==========================

    const fetchOrders = async (ignore = false) => {

        try {

            setOrdersLoading(true);

            const response =
                await getFarmerOrders();

            if (ignore) {
                return;
            }

            const orderData = extractList(
                response,
                'orders'
            );

            setOrders(orderData);

        } catch (err) {

            if (ignore) {
                return;
            }

            console.error(
                'Fetch farmer orders error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load your orders.'
            );

        } finally {

            if (!ignore) {
                setOrdersLoading(false);
            }

        }
    };


    // ==========================
    // FORM CHANGE
    // ==========================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: value
        }));

    };


    // ==========================
    // IMAGE CHANGE
    // ==========================

    const handleImageChange = (e) => {

        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {

            setError(
                'Please select a JPG, PNG, or WEBP image.'
            );

            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            setError(
                'Image must be less than 5MB.'
            );

            e.target.value = '';
            return;
        }

        setImage(file);
        setError('');

        const previewUrl =
            URL.createObjectURL(file);

        setImagePreview((oldPreview) => {

            if (oldPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(oldPreview);
            }

            return previewUrl;
        });

    };


    // ==========================
    // CREATE PRODUCT
    // ==========================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setMessage('');
        setError('');

        try {

            const productData =
                new FormData();

            productData.append(
                'name',
                formData.name.trim()
            );

            productData.append(
                'category',
                formData.category
            );

            productData.append(
                'description',
                formData.description.trim()
            );

            productData.append(
                'quantity',
                Number(formData.quantity)
            );

            productData.append(
                'unit',
                formData.unit
            );

            productData.append(
                'price',
                Number(formData.price)
            );

            productData.append(
                'location',
                formData.location.trim()
            );

            if (image) {
                productData.append(
                    'image',
                    image
                );
            }

            await createProduct(productData);

            setMessage(
                'Produce listed successfully!'
            );

            setFormData({
                name: '',
                category: '',
                description: '',
                quantity: '',
                unit: '',
                price: '',
                location: ''
            });

            setImage(null);
            setImagePreview('');

            await fetchProducts();

        } catch (err) {

            console.error(
                'Create product error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to list produce.'
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================
    // START EDITING
    // ==========================

    const handleEdit = (product) => {

        setEditingProduct(product);

        setEditFormData({
            name: product.name || '',
            category: product.category || '',
            description: product.description || '',
            quantity: product.quantity ?? '',
            unit: product.unit || '',
            price: product.price ?? '',
            location: product.location || '',
            status: product.status || 'available'
        });

        setMessage('');
        setError('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    };


    // ==========================
    // EDIT FORM CHANGE
    // ==========================

    const handleEditChange = (e) => {

        const { name, value } = e.target;

        setEditFormData((current) => ({
            ...current,
            [name]: value
        }));

    };


    // ==========================
    // UPDATE PRODUCT
    // ==========================

    const handleUpdateProduct = async (e) => {

        e.preventDefault();

        if (!editingProduct) {
            return;
        }

        const quantity =
            Number(editFormData.quantity);

        const price =
            Number(editFormData.price);

        if (
            Number.isNaN(quantity) ||
            quantity < 0
        ) {

            setError(
                'Quantity must be a valid number greater than or equal to 0.'
            );

            return;
        }

        if (
            Number.isNaN(price) ||
            price < 0
        ) {

            setError(
                'Price must be a valid number greater than or equal to 0.'
            );

            return;
        }

        try {

            setEditLoading(true);
            setMessage('');
            setError('');

            await updateProduct(
                editingProduct._id,
                {
                    ...editFormData,
                    name:
                        editFormData.name.trim(),
                    description:
                        editFormData.description.trim(),
                    location:
                        editFormData.location.trim(),
                    quantity,
                    price
                }
            );

            setMessage(
                'Produce updated successfully!'
            );

            setEditingProduct(null);

            await fetchProducts();

        } catch (err) {

            console.error(
                'Update product error:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to update product.'
            );

        } finally {

            setEditLoading(false);

        }
    };


    // ==========================
    // DELETE PRODUCT
    // ==========================

    const handleDeleteProduct =
        async (productId) => {

            const confirmed =
                window.confirm(
                    'Are you sure you want to delete this produce listing? This action cannot be undone.'
                );

            if (!confirmed) {
                return;
            }

            try {

                setError('');
                setMessage('');

                const response =
                    await deleteProduct(
                        productId
                    );

                setMessage(
                    response?.message ||
                    'Product deleted successfully!'
                );

                setProducts((current) =>
                    current.filter(
                        (product) =>
                            product._id !== productId
                    )
                );

            } catch (err) {

                console.error(
                    'Delete product error:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to delete product.'
                );

            }
        };


    // ==========================
    // QUICK STATUS UPDATE
    // ==========================

    const handleProductStatusUpdate =
        async (
            productId,
            status
        ) => {

            try {

                setError('');
                setMessage('');

                await updateProduct(
                    productId,
                    { status }
                );

                setProducts((current) =>
                    current.map(
                        (product) =>
                            product._id === productId
                                ? {
                                    ...product,
                                    status
                                }
                                : product
                    )
                );

                setMessage(
                    `Produce marked as ${getProductStatusLabel(status)}.`
                );

            } catch (err) {

                console.error(
                    'Update product status error:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to update produce status.'
                );

            }
        };


    // ==========================
    // QUICK QUANTITY UPDATE
    // ==========================

    const handleQuantityUpdate =
        async (product) => {

            const newQuantity =
                window.prompt(
                    `Enter new quantity for ${product.name}:`,
                    product.quantity
                );

            if (
                newQuantity === null ||
                newQuantity.trim() === ''
            ) {
                return;
            }

            const quantity =
                Number(newQuantity);

            if (
                Number.isNaN(quantity) ||
                quantity < 0
            ) {

                setError(
                    'Quantity must be a valid number greater than or equal to 0.'
                );

                return;
            }

            try {

                setError('');
                setMessage('');

                await updateProduct(
                    product._id,
                    { quantity }
                );

                setProducts((current) =>
                    current.map(
                        (item) =>
                            item._id === product._id
                                ? {
                                    ...item,
                                    quantity,
                                    status:
                                        quantity === 0
                                            ? 'sold'
                                            : item.status ===
                                                'sold'
                                                ? 'available'
                                                : item.status
                                }
                                : item
                    )
                );

                setMessage(
                    'Quantity updated successfully!'
                );

            } catch (err) {

                console.error(
                    'Update quantity error:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to update quantity.'
                );

            }
        };


    // ==========================
    // UPDATE ORDER STATUS
    // ==========================

    const handleOrderStatusUpdate =
        async (
            orderId,
            status
        ) => {

            try {

                setError('');
                setMessage('');

                const response =
                    await updateOrderStatus(
                        orderId,
                        status
                    );

                setMessage(
                    response?.message ||
                    `Order ${getOrderStatusLabel(status).toLowerCase()} successfully!`
                );

                await fetchOrders();

            } catch (err) {

                console.error(
                    'Update order status error:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to update order status.'
                );

            }
        };


    // ==========================
    // REQUEST STATUS
    // ==========================

    const handleStatusUpdate =
        async (
            requestId,
            status
        ) => {

            try {

                setError('');
                setMessage('');

                const response =
                    await updateRequestStatus(
                        requestId,
                        status
                    );

                setRequests(
                    (currentRequests) =>
                        currentRequests.map(
                            (request) =>
                                request._id === requestId
                                    ? {
                                        ...request,
                                        status
                                    }
                                    : request
                        )
                );

                setMessage(
                    response?.message ||
                    `Request ${getRequestStatusLabel(status).toLowerCase()} successfully!`
                );

                await fetchRequests();

                if (status === 'accepted') {
                    await fetchOrders();
                }

            } catch (err) {

                console.error(
                    'Update request error:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to update request.'
                );

            }
        };


    // ==========================
    // CANCEL EDIT
    // ==========================

    const cancelEdit = () => {

        setEditingProduct(null);

        setError('');
        setMessage('');

    };


    // ==========================
    // DISPLAY HELPERS
    // ==========================

    const getOrderStatusLabel =
        (status) => {

            const labels = {
                pending: 'Pending',
                confirmed: 'Confirmed',
                processing: 'Processing',
                completed: 'Completed',
                cancelled: 'Cancelled'
            };

            return (
                labels[status] ||
                status ||
                'Unknown'
            );
        };


    const getOrderStatusClass =
        (status) => {

            const classes = {
                pending:
                    'bg-warning text-dark',
                confirmed:
                    'bg-success',
                processing:
                    'bg-primary',
                completed:
                    'bg-secondary',
                cancelled:
                    'bg-danger'
            };

            return (
                classes[status] ||
                'bg-secondary'
            );
        };


    const getPaymentStatusLabel =
        (status) => {

            const labels = {
                unpaid: 'Unpaid',
                pending: 'Payment Pending',
                paid: 'Paid',
                failed: 'Payment Failed',
                refunded: 'Refunded'
            };

            return (
                labels[status] ||
                status ||
                'Unknown'
            );
        };


    const getPaymentStatusClass =
        (status) => {

            const classes = {
                unpaid: 'text-danger',
                pending: 'text-warning',
                paid: 'text-success',
                failed: 'text-danger',
                refunded: 'text-secondary'
            };

            return (
                classes[status] ||
                'text-muted'
            );
        };


    const getRequestStatusLabel =
        (status) => {

            const labels = {
                pending: 'Pending',
                accepted: 'Accepted',
                rejected: 'Rejected',
                completed: 'Completed'
            };

            return (
                labels[status] ||
                status ||
                'Unknown'
            );
        };


    const getProductStatusLabel =
        (status) => {

            const labels = {
                available: 'Available',
                sold: 'Sold',
                inactive: 'Inactive'
            };

            return (
                labels[status] ||
                status ||
                'Unknown'
            );
        };


    const getProductStatusClass =
        (status) => {

            const classes = {
                available: 'bg-success',
                sold: 'bg-secondary',
                inactive: 'bg-danger'
            };

            return (
                classes[status] ||
                'bg-secondary'
            );
        };


    const getStockState =
        (product) => {

            const quantity =
                Number(
                    product?.quantity || 0
                );

            if (quantity <= 0) {

                return {
                    label: 'Out of Stock',
                    className: 'text-danger',
                    badgeClass: 'bg-danger',
                    icon: XCircle
                };

            }

            if (
                quantity <=
                LOW_STOCK_THRESHOLD
            ) {

                return {
                    label: 'Low Stock',
                    className: 'text-warning',
                    badgeClass:
                        'bg-warning text-dark',
                    icon: AlertTriangle
                };

            }

            return {
                label: 'In Stock',
                className: 'text-success',
                badgeClass: 'bg-success',
                icon: CheckCircle2
            };
        };


    const getEffectiveProductStatus =
        (product) => {

            const quantity =
                Number(
                    product?.quantity || 0
                );

            if (quantity <= 0) {
                return 'out-of-stock';
            }

            if (
                quantity <=
                LOW_STOCK_THRESHOLD
            ) {
                return 'low-stock';
            }

            return 'in-stock';
        };


    // ==========================
    // STATS
    // ==========================

    const availableProducts =
        products.filter(
            (product) =>
                product.status ===
                    'available' &&
                Number(product.quantity) > 0
        ).length;


    const outOfStockProducts =
        products.filter(
            (product) =>
                Number(product.quantity) === 0
        ).length;


    const lowStockProducts =
        products.filter(
            (product) => {

                const quantity =
                    Number(
                        product.quantity || 0
                    );

                return (
                    quantity > 0 &&
                    quantity <=
                        LOW_STOCK_THRESHOLD
                );
            }
        ).length;


    const pendingRequests =
        requests.filter(
            (request) =>
                request.status === 'pending'
        ).length;


    const acceptedRequests =
        requests.filter(
            (request) =>
                request.status === 'accepted'
        ).length;


    const pendingOrders =
        orders.filter(
            (order) =>
                order.status === 'pending'
        ).length;


    const activeOrders =
        orders.filter(
            (order) =>
                [
                    'confirmed',
                    'processing'
                ].includes(order.status)
        ).length;


    const completedOrders =
        orders.filter(
            (order) =>
                order.status === 'completed'
        ).length;


    const totalCompletedSales =
        orders
            .filter(
                (order) =>
                    order.status ===
                    'completed'
            )
            .reduce(
                (total, order) =>
                    total +
                    Number(
                        order.totalAmount || 0
                    ),
                0
            );


    const totalFarmerEarnings =
        orders
            .filter(
                (order) =>
                    order.status ===
                    'completed'
            )
            .reduce(
                (total, order) => {

                    const amount =
                        Number(
                            order.totalAmount ||
                            0
                        );

                    return (
                        total +
                        (
                            amount *
                            (1 -
                                FARM_LINK_FEE)
                        )
                    );

                },
                0
            );


    const dashboardStats =
        useMemo(
            () => [

                {
                    label: 'Total Produce',
                    value:
                        products.length,
                    description:
                        'Produce listings in your inventory',
                    icon: Sprout,
                    iconClass:
                        'text-success',
                    bgClass:
                        'bg-success bg-opacity-10'
                },

                {
                    label: 'Available',
                    value:
                        availableProducts,
                    description:
                        'Listings currently available',
                    icon:
                        PackageCheck,
                    iconClass:
                        'text-success',
                    bgClass:
                        'bg-success bg-opacity-10'
                },

                {
                    label: 'Active Orders',
                    value:
                        activeOrders,
                    description:
                        'Confirmed or processing orders',
                    icon:
                        ShoppingBasket,
                    iconClass:
                        'text-primary',
                    bgClass:
                        'bg-primary bg-opacity-10'
                },

                {
                    label:
                        'Pending Requests',
                    value:
                        pendingRequests,
                    description:
                        'Buyer requests awaiting response',
                    icon:
                        ClipboardList,
                    iconClass:
                        'text-warning',
                    bgClass:
                        'bg-warning bg-opacity-10'
                }

            ],
            [
                products.length,
                availableProducts,
                activeOrders,
                pendingRequests
            ]
        );


    return (

        <div
            className="container py-4 py-lg-5"
            style={{
                maxWidth: '1280px'
            }}
        >

            {/* ========================== */}
            {/* HEADER */}
            {/* ========================== */}

            <div className="mb-4">

                <div
                    className="rounded-4 p-4 p-lg-5 shadow-sm border"
                    style={{
                        background:
                            'linear-gradient(135deg, #f8fff9 0%, #ffffff 60%, #f3faf5 100%)'
                    }}
                >

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">

                        <div className="min-w-0">

                            <div className="d-flex align-items-center flex-wrap gap-2 mb-3">

                                <span className="badge bg-success px-3 py-2">
                                    FARMER
                                </span>

                                <span className="text-muted small">
                                    FarmLink Dashboard
                                </span>

                            </div>

                            <h1
                                className="fw-bold mb-2"
                                style={{
                                    fontSize:
                                        'clamp(1.7rem, 4vw, 2.5rem)'
                                }}
                            >
                                Welcome back,{' '}
                                {user?.name ||
                                    'Farmer'}
                            </h1>

                            <p className="text-muted mb-0">
                                Manage your produce, buyer requests,
                                orders and earnings from one place.
                            </p>

                        </div>


                        <div className="d-flex flex-column flex-sm-row gap-2">

                            <Link
                                to="/marketplace"
                                className="btn btn-success d-flex align-items-center justify-content-center gap-2 px-3"
                            >
                                <ShoppingBasket
                                    size={17}
                                />
                                Marketplace
                                <ArrowUpRight
                                    size={15}
                                />
                            </Link>

                            <button
                                className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2 px-3"
                                onClick={logout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </div>

            </div>


            {/* ========================== */}
            {/* MESSAGES */}
            {/* ========================== */}

            {message && (

                <div className="alert alert-success border-0 shadow-sm d-flex align-items-center justify-content-between gap-3">

                    <div className="d-flex align-items-center gap-2">

                        <CheckCircle2
                            size={18}
                        />

                        <span>
                            {message}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() =>
                            setMessage('')
                        }
                    />

                </div>

            )}


            {error && (

                <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between gap-3">

                    <div className="d-flex align-items-center gap-2">

                        <XCircle
                            size={18}
                        />

                        <span>
                            {error}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() =>
                            setError('')
                        }
                    />

                </div>

            )}


            {/* ========================== */}
            {/* STATISTICS */}
            {/* ========================== */}

            <div className="row g-3 mb-4">

                {dashboardStats.map(
                    (stat) => {

                        const Icon =
                            stat.icon;

                        return (

                            <div
                                className="col-sm-6 col-lg-3"
                                key={stat.label}
                            >

                                <div className="card border-0 shadow-sm h-100">

                                    <div className="card-body p-4">

                                        <div className="d-flex justify-content-between align-items-start gap-3">

                                            <div>

                                                <p className="text-muted small fw-medium mb-2">
                                                    {stat.label}
                                                </p>

                                                <h2 className="fw-bold mb-0">
                                                    {stat.value}
                                                </h2>

                                            </div>

                                            <div
                                                className={`d-flex align-items-center justify-content-center rounded-3 ${stat.bgClass} ${stat.iconClass}`}
                                                style={{
                                                    width:
                                                        '46px',
                                                    height:
                                                        '46px',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <Icon
                                                    size={
                                                        22
                                                    }
                                                />
                                            </div>

                                        </div>

                                        <div className="border-top mt-3 pt-3">

                                            <small className="text-muted">
                                                {
                                                    stat.description
                                                }
                                            </small>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        );

                    }
                )}

            </div>


            {/* ========================== */}
            {/* INVENTORY ALERTS */}
            {/* ========================== */}

            {(lowStockProducts > 0 ||
                outOfStockProducts > 0 ||
                acceptedRequests > 0 ||
                pendingOrders > 0) && (

                <div className="row g-3 mb-5">

                    {lowStockProducts >
                        0 && (

                        <div className="col-md-6 col-xl-3">

                            <div className="border rounded-4 p-3 h-100 bg-warning bg-opacity-10">

                                <div className="d-flex align-items-start gap-3">

                                    <div className="rounded-3 bg-warning bg-opacity-25 text-warning-emphasis p-2">
                                        <AlertTriangle
                                            size={19}
                                        />
                                    </div>

                                    <div className="min-w-0">

                                        <strong className="d-block">
                                            Low Stock
                                        </strong>

                                        <small className="text-muted">
                                            {
                                                lowStockProducts
                                            }{' '}
                                            {
                                                lowStockProducts ===
                                                1
                                                    ? 'listing needs'
                                                    : 'listings need'
                                            }{' '}
                                            attention.
                                        </small>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}


                    {outOfStockProducts >
                        0 && (

                        <div className="col-md-6 col-xl-3">

                            <div className="border rounded-4 p-3 h-100 bg-danger bg-opacity-10">

                                <div className="d-flex align-items-start gap-3">

                                    <div className="rounded-3 bg-danger bg-opacity-10 text-danger p-2">
                                        <XCircle
                                            size={19}
                                        />
                                    </div>

                                    <div className="min-w-0">

                                        <strong className="d-block">
                                            Out of Stock
                                        </strong>

                                        <small className="text-muted">
                                            {
                                                outOfStockProducts
                                            }{' '}
                                            {
                                                outOfStockProducts ===
                                                1
                                                    ? 'listing has'
                                                    : 'listings have'
                                            }{' '}
                                            no remaining stock.
                                        </small>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}


                    {acceptedRequests >
                        0 && (

                        <div className="col-md-6 col-xl-3">

                            <div className="border rounded-4 p-3 h-100 bg-success bg-opacity-10">

                                <div className="d-flex align-items-start gap-3">

                                    <div className="rounded-3 bg-success bg-opacity-10 text-success p-2">
                                        <CheckCircle2
                                            size={19}
                                        />
                                    </div>

                                    <div className="min-w-0">

                                        <strong className="d-block">
                                            Accepted Requests
                                        </strong>

                                        <small className="text-muted">
                                            {
                                                acceptedRequests
                                            }{' '}
                                            accepted request
                                            {acceptedRequests ===
                                            1
                                                ? ''
                                                : 's'}{' '}
                                            awaiting order fulfillment.
                                        </small>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}


                    {pendingOrders > 0 && (

                        <div className="col-md-6 col-xl-3">

                            <div className="border rounded-4 p-3 h-100 bg-primary bg-opacity-10">

                                <div className="d-flex align-items-start gap-3">

                                    <div className="d-flex align-items-start gap-3">

                                        <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-2">
                                            <Package
                                                size={19}
                                            />
                                        </div>

                                        <div className="min-w-0">

                                            <strong className="d-block">
                                                Pending Orders
                                            </strong>

                                            <small className="text-muted">
                                                {
                                                    pendingOrders
                                                }{' '}
                                                order
                                                {pendingOrders ===
                                                1
                                                    ? ''
                                                    : 's'}{' '}
                                                require attention.
                                            </small>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}

                </div>

            )}


            {/* ========================== */}
            {/* SALES SUMMARY */}
            {/* ========================== */}

            <section className="mb-5">

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-3">

                    <div>

                        <span className="badge bg-success mb-2">
                            SALES OVERVIEW
                        </span>

                        <h3 className="fw-bold mb-1">
                            Sales Summary
                        </h3>

                        <p className="text-muted mb-0">
                            Track completed sales and your estimated earnings.
                        </p>

                    </div>

                    {outOfStockProducts >
                        0 && (

                        <span className="badge bg-light text-dark border">
                            {
                                outOfStockProducts
                            }{' '}
                            out of stock
                        </span>

                    )}

                </div>


                <div className="row g-3">

                    <div className="col-md-4">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-4">

                                    <div>

                                        <p className="text-muted small fw-medium mb-2">
                                            Completed Orders
                                        </p>

                                        <h3 className="fw-bold mb-0">
                                            {
                                                completedOrders
                                            }
                                        </h3>

                                    </div>

                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
                                        style={{
                                            width:
                                                '44px',
                                            height:
                                                '44px'
                                        }}
                                    >
                                        <ShoppingCart
                                            size={21}
                                        />
                                    </div>

                                </div>

                                <div className="border-top pt-3">

                                    <small className="text-muted">
                                        Orders successfully completed
                                    </small>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-4">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-4">

                                    <div>

                                        <p className="text-muted small fw-medium mb-2">
                                            Completed Sales
                                        </p>

                                        <h3 className="fw-bold mb-0">
                                            ₦
                                            {
                                                totalCompletedSales.toLocaleString()
                                            }
                                        </h3>

                                    </div>

                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-3 bg-info bg-opacity-10 text-info"
                                        style={{
                                            width:
                                                '44px',
                                            height:
                                                '44px'
                                        }}
                                    >
                                        <Banknote
                                            size={21}
                                        />
                                    </div>

                                </div>

                                <div className="border-top pt-3">

                                    <small className="text-muted">
                                        Total value of completed orders
                                    </small>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-4">

                        <div className="card border-success shadow-sm h-100">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-4">

                                    <div>

                                        <p className="text-muted small fw-medium mb-2">
                                            Estimated Farmer Earnings
                                        </p>

                                        <h3 className="fw-bold text-success mb-1">
                                            ₦
                                            {
                                                totalFarmerEarnings.toLocaleString()
                                            }
                                        </h3>

                                        <small className="text-muted">
                                            After 2.5% FarmLink fee
                                        </small>

                                    </div>

                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-3 bg-success bg-opacity-10 text-success"
                                        style={{
                                            width:
                                                '44px',
                                            height:
                                                '44px'
                                        }}
                                    >
                                        <WalletCards
                                            size={21}
                                        />
                                    </div>

                                </div>

                                <div className="border-top pt-3">

                                    <small className="text-success fw-medium">
                                        Estimated amount retained by you
                                    </small>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* ========================== */}
            {/* EDIT PRODUCT */}
            {/* ========================== */}

            {editingProduct && (

                <div className="card border-0 shadow-sm mb-5">

                    <div className="card-body p-4 p-lg-5">

                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3 mb-4">

                            <div>

                                <div className="d-flex align-items-center gap-2 mb-2">

                                    <span className="badge bg-primary">
                                        EDIT MODE
                                    </span>

                                    <small className="text-muted">
                                        Updating existing listing
                                    </small>

                                </div>

                                <h3 className="fw-bold mb-1">
                                    Edit Produce
                                </h3>

                                <p className="text-muted mb-0">
                                    Update the information buyers see about this produce.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={
                                    cancelEdit
                                }
                            >
                                Cancel Editing
                            </button>

                        </div>


                        <div className="border-top pt-4">

                            <form
                                onSubmit={
                                    handleUpdateProduct
                                }
                            >

                                <div className="mb-4">

                                    <h6 className="fw-bold mb-1">
                                        Basic Information
                                    </h6>

                                    <p className="text-muted small mb-3">
                                        Provide the main details of your produce.
                                    </p>

                                    <div className="row g-3">

                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Produce Name
                                            </label>

                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                value={
                                                    editFormData.name
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                placeholder="e.g. Fresh Maize"
                                                required
                                            />

                                        </div>


                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Category
                                            </label>

                                            <select
                                                name="category"
                                                className="form-select"
                                                value={
                                                    editFormData.category
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                required
                                            >

                                                <option value="">
                                                    Select category
                                                </option>

                                                <option value="Crops">
                                                    Crops
                                                </option>

                                                <option value="Vegetables">
                                                    Vegetables
                                                </option>

                                                <option value="Fruits">
                                                    Fruits
                                                </option>

                                                <option value="Livestock">
                                                    Livestock
                                                </option>

                                                <option value="Poultry">
                                                    Poultry
                                                </option>

                                                <option value="Fish">
                                                    Fish
                                                </option>

                                            </select>

                                        </div>


                                        <div className="col-12">

                                            <label className="form-label fw-medium">
                                                Description
                                            </label>

                                            <textarea
                                                name="description"
                                                className="form-control"
                                                rows="4"
                                                value={
                                                    editFormData.description
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                placeholder="Describe the quality, condition, size, or other useful details..."
                                                required
                                            />

                                        </div>

                                    </div>

                                </div>


                                <div className="border-top pt-4 mb-4">

                                    <h6 className="fw-bold mb-1">
                                        Quantity & Pricing
                                    </h6>

                                    <p className="text-muted small mb-3">
                                        Keep the available quantity and price up to date.
                                    </p>

                                    <div className="row g-3">

                                        <div className="col-md-4">

                                            <label className="form-label fw-medium">
                                                Quantity
                                            </label>

                                            <input
                                                type="number"
                                                name="quantity"
                                                className="form-control"
                                                min="0"
                                                value={
                                                    editFormData.quantity
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                required
                                            />

                                        </div>


                                        <div className="col-md-4">

                                            <label className="form-label fw-medium">
                                                Unit
                                            </label>

                                            <select
                                                name="unit"
                                                className="form-select"
                                                value={
                                                    editFormData.unit
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                required
                                            >

                                                <option value="">
                                                    Select unit
                                                </option>

                                                <option value="kg">
                                                    kg
                                                </option>

                                                <option value="bags">
                                                    Bags
                                                </option>

                                                <option value="tonnes">
                                                    Tonnes
                                                </option>

                                                <option value="crates">
                                                    Crates
                                                </option>

                                                <option value="pieces">
                                                    Pieces
                                                </option>

                                            </select>

                                        </div>


                                        <div className="col-md-4">

                                            <label className="form-label fw-medium">
                                                Price
                                            </label>

                                            <div className="input-group">

                                                <span className="input-group-text">
                                                    ₦
                                                </span>

                                                <input
                                                    type="number"
                                                    name="price"
                                                    className="form-control"
                                                    min="0"
                                                    value={
                                                        editFormData.price
                                                    }
                                                    onChange={
                                                        handleEditChange
                                                    }
                                                    required
                                                />

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="border-top pt-4 mb-4">

                                    <h6 className="fw-bold mb-1">
                                        Listing Details
                                    </h6>

                                    <p className="text-muted small mb-3">
                                        Control where the produce is available and its marketplace status.
                                    </p>

                                    <div className="row g-3">

                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Location
                                            </label>

                                            <input
                                                type="text"
                                                name="location"
                                                className="form-control"
                                                value={
                                                    editFormData.location
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                                placeholder="e.g. Ogbomoso, Oyo State"
                                                required
                                            />

                                        </div>


                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Product Status
                                            </label>

                                            <select
                                                name="status"
                                                className="form-select"
                                                value={
                                                    editFormData.status
                                                }
                                                onChange={
                                                    handleEditChange
                                                }
                                            >

                                                <option value="available">
                                                    Available
                                                </option>

                                                <option value="sold">
                                                    Sold
                                                </option>

                                                <option value="inactive">
                                                    Inactive
                                                </option>

                                            </select>

                                        </div>

                                    </div>

                                </div>


                                <div className="border-top pt-4 d-flex flex-column flex-sm-row gap-2">

                                    <button
                                        type="submit"
                                        className="btn btn-success px-4"
                                        disabled={
                                            editLoading
                                        }
                                    >

                                        {editLoading ? (

                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                />

                                                Saving Changes...
                                            </>

                                        ) : (

                                            <>
                                                <CheckCircle2
                                                    size={17}
                                                    className="me-2"
                                                />

                                                Save Changes
                                            </>

                                        )}

                                    </button>


                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4"
                                        onClick={
                                            cancelEdit
                                        }
                                        disabled={
                                            editLoading
                                        }
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}


            {/* ========================== */}
            {/* ADD PRODUCE */}
            {/* ========================== */}

            {!editingProduct && (

                <div className="card border-0 shadow-sm mb-5">

                    <div className="card-body p-4 p-lg-5">

                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                            <div>

                                <div className="d-flex align-items-center gap-2 mb-2">

                                    <span className="badge bg-success">
                                        NEW LISTING
                                    </span>

                                    <small className="text-muted">
                                        Marketplace
                                    </small>

                                </div>

                                <h3 className="fw-bold mb-1">
                                    Add New Produce
                                </h3>

                                <p className="text-muted mb-0">
                                    List your farm produce so buyers can discover it.
                                </p>

                            </div>

                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success"
                                style={{
                                    width:
                                        '52px',
                                    height:
                                        '52px'
                                }}
                            >
                                <Plus size={25} />
                            </div>

                        </div>


                        <div className="border-top pt-4">

                            <form
                                onSubmit={
                                    handleSubmit
                                }
                            >

                                <div className="mb-4">

                                    <h6 className="fw-bold mb-1">
                                        Basic Information
                                    </h6>

                                    <p className="text-muted small mb-3">
                                        Start with the name, category and description.
                                    </p>

                                    <div className="row g-3">

                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Produce Name
                                            </label>

                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                value={
                                                    formData.name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. Fresh Maize"
                                                required
                                            />

                                        </div>


                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Category
                                            </label>

                                            <select
                                                name="category"
                                                className="form-select"
                                                value={
                                                    formData.category
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                            >

                                                <option value="">
                                                    Select category
                                                </option>

                                                <option value="Crops">
                                                    Crops
                                                </option>

                                                <option value="Vegetables">
                                                    Vegetables
                                                </option>

                                                <option value="Fruits">
                                                    Fruits
                                                </option>

                                                <option value="Livestock">
                                                    Livestock
                                                </option>

                                                <option value="Poultry">
                                                    Poultry
                                                </option>

                                                <option value="Fish">
                                                    Fish
                                                </option>

                                            </select>

                                        </div>


                                        <div className="col-12">

                                            <label className="form-label fw-medium">
                                                Description
                                            </label>

                                            <textarea
                                                name="description"
                                                className="form-control"
                                                rows="4"
                                                value={
                                                    formData.description
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Describe the quality, condition, size, or other useful details..."
                                                required
                                            />

                                        </div>

                                    </div>

                                </div>


                                <div className="border-top pt-4 mb-4">

                                    <h6 className="fw-bold mb-1">
                                        Quantity & Pricing
                                    </h6>

                                    <p className="text-muted small mb-3">
                                        Tell buyers how much you have and your asking price.
                                    </p>

                                    <div className="row g-3">

                                        <div className="col-md-4">

                                            <label className="form-label fw-medium">
                                                Quantity
                                            </label>

                                            <input
                                                type="number"
                                                name="quantity"
                                                className="form-control"
                                                min="1"
                                                value={
                                                    formData.quantity
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. 50"
                                                required
                                            />

                                        </div>


                                        <div className="col-md-4">

                                            <label className="form-label fw-medium">
                                                Unit
                                            </label>

                                            <select
                                                name="unit"
                                                className="form-select"
                                                value={
                                                    formData.unit
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                            >

                                                <option value="">
                                                    Select unit
                                                </option>

                                                <option value="kg">
                                                    kg
                                                </option>

                                                <option value="bags">
                                                    Bags
                                                </option>

                                                <option value="tonnes">
                                                    Tonnes
                                                </option>

                                                <option value="crates">
                                                    Crates
                                                </option>

                                                <option value="pieces">
                                                    Pieces
                                                </option>

                                            </select>

                                        </div>


                                        <div className="col-md-4">

                                            <label className="form-label fw-medium">
                                                Price
                                            </label>

                                            <div className="input-group">

                                                <span className="input-group-text">
                                                    ₦
                                                </span>

                                                <input
                                                    type="number"
                                                    name="price"
                                                    className="form-control"
                                                    min="0"
                                                    value={
                                                        formData.price
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="e.g. 1200"
                                                    required
                                                />

                                            </div>

                                            <small className="text-muted">
                                                Price per selected unit.
                                            </small>

                                        </div>

                                    </div>

                                </div>


                                <div className="border-top pt-4 mb-4">

                                    <h6 className="fw-bold mb-1">
                                        Listing Details
                                    </h6>

                                    <p className="text-muted small mb-3">
                                        Add the location and a real image of your produce.
                                    </p>

                                    <div className="row g-3">

                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Location
                                            </label>

                                            <div className="input-group">

                                                <span className="input-group-text">
                                                    <MapPin
                                                        size={16}
                                                    />
                                                </span>

                                                <input
                                                    type="text"
                                                    name="location"
                                                    className="form-control"
                                                    value={
                                                        formData.location
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="e.g. Ogbomoso, Oyo State"
                                                    required
                                                />

                                            </div>

                                        </div>


                                        <div className="col-md-6">

                                            <label className="form-label fw-medium">
                                                Product Image
                                            </label>

                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={
                                                    handleImageChange
                                                }
                                            />

                                            <small className="text-muted">
                                                JPG, PNG or WEBP. Maximum 5MB.
                                            </small>

                                        </div>


                                        {imagePreview && (

                                            <div className="col-12">

                                                <div className="border rounded-3 p-3 bg-light">

                                                    <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">

                                                        <img
                                                            src={
                                                                imagePreview
                                                            }
                                                            alt="Selected produce preview"
                                                            className="rounded-3 border"
                                                            style={{
                                                                width:
                                                                    '180px',
                                                                height:
                                                                    '130px',
                                                                objectFit:
                                                                    'cover'
                                                            }}
                                                        />

                                                        <div>

                                                            <h6 className="fw-semibold mb-1">
                                                                Image Preview
                                                            </h6>

                                                            <p className="text-muted small mb-0">
                                                                This image will be uploaded with your produce listing.
                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                </div>


                                <div className="border-top pt-4">

                                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">

                                        <small className="text-muted">
                                            Make sure your information is accurate before listing.
                                        </small>

                                        <button
                                            type="submit"
                                            className="btn btn-success px-4"
                                            disabled={
                                                loading
                                            }
                                        >

                                            {loading ? (

                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                        aria-hidden="true"
                                                    />

                                                    Listing Produce...
                                                </>

                                            ) : (

                                                <>
                                                    <Plus
                                                        size={17}
                                                        className="me-2"
                                                    />

                                                    List Produce
                                                </>

                                            )}

                                        </button>

                                    </div>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}


            {/* ========================== */}
            {/* MY PRODUCE */}
            {/* ========================== */}

            <section className="card border-0 shadow-sm mb-5">

                <div className="card-body p-4">

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                        <div>

                            <span className="badge bg-success mb-2">
                                INVENTORY
                            </span>

                            <h3 className="fw-bold mb-1">
                                My Produce
                            </h3>

                            <p className="text-muted mb-0">
                                Manage the produce you have listed.
                            </p>

                        </div>


                        <div className="d-flex align-items-center flex-wrap gap-2">

                            {lowStockProducts >
                                0 && (

                                <span className="badge bg-warning text-dark">
                                    {
                                        lowStockProducts
                                    }{' '}
                                    Low Stock
                                </span>

                            )}

                            {outOfStockProducts >
                                0 && (

                                <span className="badge bg-danger">
                                    {
                                        outOfStockProducts
                                    }{' '}
                                    Out of Stock
                                </span>

                            )}

                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center gap-2"
                                onClick={
                                    fetchProducts
                                }
                                disabled={
                                    productsLoading
                                }
                            >

                                <RefreshCw
                                    size={15}
                                    className={
                                        productsLoading
                                            ? 'spin'
                                            : ''
                                    }
                                />

                                {productsLoading
                                    ? 'Refreshing...'
                                    : 'Refresh'}

                            </button>

                        </div>

                    </div>


                    {productsLoading && (

                        <div className="text-center py-5">

                            <div
                                className="spinner-border text-success"
                                role="status"
                            />

                            <p className="text-muted mt-3 mb-0">
                                Loading your produce...
                            </p>

                        </div>

                    )}


                    {!productsLoading &&
                        products.length === 0 && (

                        <div className="text-center py-5 border rounded-3 bg-light">

                            <div
                                className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle bg-success bg-opacity-10 text-success"
                                style={{
                                    width:
                                        '68px',
                                    height:
                                        '68px'
                                }}
                            >
                                <Sprout
                                    size={31}
                                />
                            </div>

                            <h5 className="fw-semibold mb-2">
                                No produce listed yet
                            </h5>

                            <p className="text-muted mb-0">
                                Add your first produce using the form above.
                            </p>

                        </div>

                    )}


                    {!productsLoading &&
                        products.length > 0 && (

                        <div className="row g-4">

                            {products.map(
                                (product) => {

                                    const stock =
                                        getStockState(
                                            product
                                        );

                                    const StockIcon =
                                        stock.icon;

                                    const effectiveStock =
                                        getEffectiveProductStatus(
                                            product
                                        );

                                    return (

                                        <div
                                            className="col-12 col-md-6 col-xl-4"
                                            key={
                                                product._id
                                            }
                                        >

                                            <div className="card h-100 border shadow-sm overflow-hidden">

                                                <div
                                                    style={{
                                                        position:
                                                            'relative',
                                                        width:
                                                            '100%',
                                                        height:
                                                            '220px',
                                                        overflow:
                                                            'hidden',
                                                        backgroundColor:
                                                            '#f1f3f5'
                                                    }}
                                                >

                                                    <img
                                                        src={getProductImage(
                                                            product
                                                        )}
                                                        alt={
                                                            product.name
                                                        }
                                                        loading="lazy"
                                                        style={{
                                                            width:
                                                                '100%',
                                                            height:
                                                                '100%',
                                                            objectFit:
                                                                'cover'
                                                        }}
                                                        onError={(
                                                            e
                                                        ) => {

                                                            const fallbackImage =
                                                                getCategoryImage(
                                                                    product?.category
                                                                );

                                                            if (
                                                                e.currentTarget
                                                                    .dataset
                                                                    .fallbackApplied ===
                                                                'true'
                                                            ) {
                                                                return;
                                                            }

                                                            e.currentTarget.dataset.fallbackApplied =
                                                                'true';

                                                            e.currentTarget.src =
                                                                fallbackImage;

                                                        }}
                                                    />


                                                    <div
                                                        className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-start gap-2"
                                                        style={{
                                                            background:
                                                                'linear-gradient(rgba(0,0,0,.45), transparent)'
                                                        }}
                                                    >

                                                        <span className="badge bg-dark bg-opacity-75">
                                                            {
                                                                product.category ||
                                                                'Farm Produce'
                                                            }
                                                        </span>

                                                        <span
                                                            className={`badge ${getProductStatusClass(
                                                                product.status
                                                            )}`}
                                                        >
                                                            {
                                                                getProductStatusLabel(
                                                                    product.status
                                                                )
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="position-absolute bottom-0 start-0 end-0 p-3">

                                                        <span
                                                            className={`badge ${stock.badgeClass}`}
                                                        >
                                                            <StockIcon
                                                                size={13}
                                                                className="me-1"
                                                            />

                                                            {
                                                                stock.label
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="card-body d-flex flex-column p-4">

                                                    <div className="mb-3">

                                                        <div className="d-flex justify-content-between align-items-start gap-2">

                                                            <h5
                                                                className="fw-bold mb-1"
                                                                style={{
                                                                    wordBreak:
                                                                        'break-word'
                                                                }}
                                                            >
                                                                {
                                                                    product.name
                                                                }
                                                            </h5>

                                                        </div>

                                                        {product.description && (

                                                            <p
                                                                className="text-muted small mb-0"
                                                                style={{
                                                                    display:
                                                                        '-webkit-box',
                                                                    WebkitLineClamp:
                                                                        2,
                                                                    WebkitBoxOrient:
                                                                        'vertical',
                                                                    overflow:
                                                                        'hidden'
                                                                }}
                                                            >
                                                                {
                                                                    product.description
                                                                }
                                                            </p>

                                                        )}

                                                    </div>


                                                    <div
                                                        className={`rounded-3 p-3 mb-3 border ${
                                                            effectiveStock ===
                                                            'out-of-stock'
                                                                ? 'border-danger bg-danger bg-opacity-10'
                                                                : effectiveStock ===
                                                                    'low-stock'
                                                                    ? 'border-warning bg-warning bg-opacity-10'
                                                                    : 'bg-light'
                                                        }`}
                                                    >

                                                        <div className="d-flex justify-content-between align-items-center">

                                                            <div className="d-flex align-items-center gap-2">

                                                                <Boxes
                                                                    size={17}
                                                                    className={
                                                                        stock.className
                                                                    }
                                                                />

                                                                <span className="small fw-medium">
                                                                    Current Stock
                                                                </span>

                                                            </div>

                                                            <strong
                                                                className={
                                                                    stock.className
                                                                }
                                                            >
                                                                {
                                                                    product.quantity
                                                                }{' '}
                                                                {
                                                                    product.unit
                                                                }
                                                            </strong>

                                                        </div>


                                                        {effectiveStock ===
                                                            'low-stock' && (

                                                            <small className="text-warning-emphasis d-block mt-2">
                                                                Consider restocking this produce soon.
                                                            </small>

                                                        )}


                                                        {effectiveStock ===
                                                            'out-of-stock' && (

                                                            <small className="text-danger d-block mt-2">
                                                                Buyers cannot purchase this produce until stock is restored.
                                                            </small>

                                                        )}

                                                    </div>


                                                    <div className="border rounded-3 p-3 bg-light mb-3">

                                                        <div className="d-flex justify-content-between align-items-center mb-2">

                                                            <span className="text-muted small">
                                                                Price
                                                            </span>

                                                            <span className="fw-bold text-success">
                                                                ₦
                                                                {Number(
                                                                    product.price ||
                                                                    0
                                                                ).toLocaleString()}
                                                                {product.unit
                                                                    ? ` / ${product.unit}`
                                                                    : ''}
                                                            </span>

                                                        </div>


                                                        <div className="d-flex justify-content-between align-items-start gap-2">

                                                            <span className="text-muted small">
                                                                Location
                                                            </span>

                                                            <span className="small fw-medium text-end">
                                                                {
                                                                    product.location ||
                                                                    'Not specified'
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="mt-auto">

                                                        <div className="d-grid gap-2 mb-2">

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        product
                                                                    )
                                                                }
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        15
                                                                    }
                                                                />

                                                                Edit Produce
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center gap-2"
                                                                onClick={() =>
                                                                    handleQuantityUpdate(
                                                                        product
                                                                    )
                                                                }
                                                            >
                                                                <Package
                                                                    size={
                                                                        15
                                                                    }
                                                                />

                                                                Update Quantity
                                                            </button>

                                                        </div>


                                                        <div className="d-grid gap-2 mb-2">

                                                            {product.status ===
                                                                'available' ? (

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-warning btn-sm"
                                                                    onClick={() =>
                                                                        handleProductStatusUpdate(
                                                                            product._id,
                                                                            'inactive'
                                                                        )
                                                                    }
                                                                >
                                                                    Mark Inactive
                                                                </button>

                                                            ) : product.status ===
                                                                'inactive' ? (

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-success btn-sm"
                                                                    onClick={() =>
                                                                        handleProductStatusUpdate(
                                                                            product._id,
                                                                            'available'
                                                                        )
                                                                    }
                                                                >
                                                                    Make Available
                                                                </button>

                                                            ) : (

                                                                <span className="text-muted small text-center py-2">
                                                                    This produce is marked as sold.
                                                                </span>

                                                            )}

                                                        </div>


                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                                                            onClick={() =>
                                                                handleDeleteProduct(
                                                                    product._id
                                                                )
                                                            }
                                                        >
                                                            <Trash2
                                                                size={
                                                                    15
                                                                }
                                                            />

                                                            Delete Listing
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </section>


            {/* ========================== */}
            {/* BUYER REQUESTS */}
            {/* ========================== */}

            <section
                id="buyer-requests"
                className="card border-0 shadow-sm mb-5"
            >

                <div className="card-body p-4">

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                        <div>

                            <span className="badge bg-warning text-dark mb-2">
                                BUYER ACTIVITY
                            </span>

                            <h3 className="fw-bold mb-1">
                                Buyer Requests
                            </h3>

                            <p className="text-muted mb-0">
                                Review and respond to requests from buyers.
                            </p>

                        </div>


                        <div className="d-flex align-items-center flex-wrap gap-2">

                            <span className="badge bg-light text-dark border">
                                {
                                    pendingRequests
                                }{' '}
                                Pending
                            </span>

                            <span className="badge bg-success">
                                {
                                    requests.length
                                }{' '}
                                Total
                            </span>

                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
                                onClick={
                                    fetchRequests
                                }
                                disabled={
                                    requestsLoading
                                }
                            >

                                <RefreshCw
                                    size={14}
                                    className={
                                        requestsLoading
                                            ? 'spin'
                                            : ''
                                    }
                                />

                                Refresh

                            </button>

                        </div>

                    </div>


                    {requestsLoading ? (

                        <div className="text-center py-5">

                            <div
                                className="spinner-border text-success"
                                role="status"
                            />

                            <p className="text-muted mt-3 mb-0">
                                Loading buyer requests...
                            </p>

                        </div>

                    ) : requests.length ===
                        0 ? (

                        <div className="text-center py-5 border rounded-3 bg-light">

                            <div
                                className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle bg-success bg-opacity-10 text-success"
                                style={{
                                    width:
                                        '68px',
                                    height:
                                        '68px'
                                }}
                            >
                                <ClipboardList
                                    size={31}
                                />
                            </div>

                            <h5 className="fw-semibold mb-2">
                                No buyer requests yet
                            </h5>

                            <p className="text-muted mb-0">
                                Requests from buyers will appear here when someone requests your produce.
                            </p>

                        </div>

                    ) : (

                        <div className="row g-4">

                            {requests.map(
                                (request) => {

                                    const statusClass =
                                        request.status ===
                                            'pending'
                                            ? 'bg-warning text-dark'
                                            : request.status ===
                                                'accepted'
                                                ? 'bg-success'
                                                : request.status ===
                                                    'rejected'
                                                    ? 'bg-danger'
                                                    : 'bg-secondary';

                                    return (

                                        <div
                                            className="col-12 col-lg-6"
                                            key={
                                                request._id
                                            }
                                        >

                                            <div className="border rounded-4 h-100 p-4 shadow-sm">

                                                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">

                                                    <div className="min-w-0">

                                                        <h5
                                                            className="fw-bold mb-1"
                                                            style={{
                                                                wordBreak:
                                                                    'break-word'
                                                            }}
                                                        >
                                                            {
                                                                request
                                                                    .product
                                                                    ?.name ||
                                                                'Produce Request'
                                                            }
                                                        </h5>

                                                        <small className="text-muted">
                                                            {
                                                                request
                                                                    .product
                                                                    ?.category ||
                                                                'Agricultural Produce'
                                                            }
                                                        </small>

                                                    </div>


                                                    <span
                                                        className={`badge ${statusClass}`}
                                                    >
                                                        {
                                                            getRequestStatusLabel(
                                                                request.status
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <div className="bg-light rounded-3 p-3 mb-3">

                                                    <div className="d-flex justify-content-between gap-3 mb-2">

                                                        <span className="text-muted small">
                                                            Buyer
                                                        </span>

                                                        <span className="fw-semibold text-end">
                                                            {
                                                                request
                                                                    .buyer
                                                                    ?.name ||
                                                                'Buyer'
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="d-flex justify-content-between gap-3 mb-2">

                                                        <span className="text-muted small">
                                                            Quantity
                                                        </span>

                                                        <span className="fw-semibold text-end">
                                                            {
                                                                request.quantity
                                                            }{' '}
                                                            {
                                                                request
                                                                    .product
                                                                    ?.unit ||
                                                                ''
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="d-flex justify-content-between gap-3 mb-2">

                                                        <span className="text-muted small">
                                                            Price
                                                        </span>

                                                        <span className="fw-semibold text-success text-end">
                                                            ₦
                                                            {Number(
                                                                request
                                                                    .product
                                                                    ?.price ||
                                                                0
                                                            ).toLocaleString()}

                                                            {request
                                                                .product
                                                                ?.unit
                                                                ? ` / ${request.product.unit}`
                                                                : ''}
                                                        </span>

                                                    </div>


                                                    <div className="d-flex justify-content-between gap-3">

                                                        <span className="text-muted small">
                                                            Location
                                                        </span>

                                                        <span className="small fw-medium text-end">
                                                            {
                                                                request
                                                                    .product
                                                                    ?.location ||
                                                                request
                                                                    .farmer
                                                                    ?.location ||
                                                                'Not provided'
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="mb-3">

                                                    <p className="text-muted small fw-semibold mb-1">
                                                        Buyer message
                                                    </p>

                                                    <p className="small mb-0">
                                                        {
                                                            request.message ||
                                                            'No message provided.'
                                                        }
                                                    </p>

                                                </div>


                                                {request.status ===
                                                    'pending' && (

                                                    <div>

                                                        <div className="alert alert-warning py-2 mb-3">

                                                            <div className="d-flex align-items-center gap-2">

                                                                <Clock3
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                                <small>
                                                                    This request is waiting for your response.
                                                                </small>

                                                            </div>

                                                        </div>


                                                        <div className="d-flex flex-column flex-sm-row gap-2">

                                                            <button
                                                                type="button"
                                                                className="btn btn-success btn-sm flex-fill"
                                                                onClick={() =>
                                                                    handleStatusUpdate(
                                                                        request._id,
                                                                        'accepted'
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="me-1"
                                                                />

                                                                Accept Request
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm flex-fill"
                                                                onClick={() =>
                                                                    handleStatusUpdate(
                                                                        request._id,
                                                                        'rejected'
                                                                    )
                                                                }
                                                            >
                                                                <XCircle
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="me-1"
                                                                />

                                                                Reject Request
                                                            </button>

                                                        </div>

                                                    </div>

                                                )}


                                                {request.status ===
                                                    'accepted' && (

                                                    <div>

                                                        <div className="alert alert-success py-2 mb-3">

                                                            <div className="d-flex align-items-start gap-2">

                                                                <CheckCircle2
                                                                    size={
                                                                        17
                                                                    }
                                                                    className="mt-1 flex-shrink-0"
                                                                />

                                                                <small>
                                                                    You accepted this request. FarmLink has created an order for the buyer. Payment and fulfillment are now managed in Order Management below.
                                                                </small>

                                                            </div>

                                                        </div>


                                                        <a
                                                            href="#farmer-orders"
                                                            className="btn btn-outline-success btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                                                        >
                                                            Go to Order Management
                                                            <ChevronRight
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </a>

                                                    </div>

                                                )}


                                                {request.status ===
                                                    'rejected' && (

                                                    <div className="alert alert-danger py-2 mb-0">

                                                        <div className="d-flex align-items-center gap-2">

                                                            <XCircle
                                                                size={
                                                                    16
                                                                }
                                                            />

                                                            <small>
                                                                This request has been rejected.
                                                            </small>

                                                        </div>

                                                    </div>

                                                )}


                                                {request.status ===
                                                    'completed' && (

                                                    <div className="alert alert-secondary py-2 mb-0">

                                                        <div className="d-flex align-items-center gap-2">

                                                            <CheckCircle2
                                                                size={
                                                                    16
                                                                }
                                                            />

                                                            <small>
                                                                This request has been completed.
                                                            </small>

                                                        </div>

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </section>


            {/* ========================== */}
            {/* FARMER ORDERS */}
            {/* ========================== */}

            <section
                id="farmer-orders"
                className="card border-0 shadow-sm"
            >

                <div className="card-body p-4">

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                        <div>

                            <span className="badge bg-primary mb-2">
                                ORDER MANAGEMENT
                            </span>

                            <h3 className="fw-bold mb-1">
                                My Orders
                            </h3>

                            <p className="text-muted mb-0">
                                Manage orders placed by buyers for your produce.
                            </p>

                        </div>


                        <div className="d-flex align-items-center flex-wrap gap-2">

                            {pendingOrders >
                                0 && (

                                <span className="badge bg-warning text-dark">
                                    {
                                        pendingOrders
                                    }{' '}
                                    Pending
                                </span>

                            )}


                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
                                onClick={
                                    fetchOrders
                                }
                                disabled={
                                    ordersLoading
                                }
                            >

                                <RefreshCw
                                    size={15}
                                    className={
                                        ordersLoading
                                            ? 'spin'
                                            : ''
                                    }
                                />

                                {ordersLoading
                                    ? 'Refreshing...'
                                    : 'Refresh'}

                            </button>

                        </div>

                    </div>


                    {orders.length > 0 && (

                        <div className="border rounded-4 p-3 p-md-4 mb-4 bg-light">

                            <div className="d-flex align-items-center gap-2 mb-3">

                                <Truck
                                    size={19}
                                    className="text-primary"
                                />

                                <strong>
                                    FarmLink Order Flow
                                </strong>

                            </div>


                            <div className="row g-2">

                                <div className="col-6 col-md-3">

                                    <div className="text-center">

                                        <div className="badge bg-warning text-dark mb-2">
                                            1
                                        </div>

                                        <small className="d-block fw-medium">
                                            Buyer Pays
                                        </small>

                                    </div>

                                </div>


                                <div className="col-6 col-md-3">

                                    <div className="text-center">

                                        <div className="badge bg-success mb-2">
                                            2
                                        </div>

                                        <small className="d-block fw-medium">
                                            Confirm Order
                                        </small>

                                    </div>

                                </div>


                                <div className="col-6 col-md-3">

                                    <div className="text-center">

                                        <div className="badge bg-primary mb-2">
                                            3
                                        </div>

                                        <small className="d-block fw-medium">
                                            Process Order
                                        </small>

                                    </div>

                                </div>


                                <div className="col-6 col-md-3">

                                    <div className="text-center">

                                        <div className="badge bg-secondary mb-2">
                                            4
                                        </div>

                                        <small className="d-block fw-medium">
                                            Complete Order
                                        </small>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}


                    {ordersLoading && (

                        <div className="text-center py-5">

                            <div
                                className="spinner-border text-success"
                                role="status"
                            />

                            <p className="text-muted mt-3">
                                Loading your orders...
                            </p>

                        </div>

                    )}


                    {!ordersLoading &&
                        orders.length ===
                            0 && (

                        <div className="text-center py-5 border rounded-3 bg-light">

                            <div
                                className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle bg-primary bg-opacity-10 text-primary"
                                style={{
                                    width:
                                        '68px',
                                    height:
                                        '68px'
                                }}
                            >
                                <Package
                                    size={31}
                                />
                            </div>

                            <h5 className="fw-semibold mb-2">
                                No orders yet
                            </h5>

                            <p className="text-muted mb-0">
                                Orders placed by buyers will appear here.
                            </p>

                        </div>

                    )}


                    {!ordersLoading &&
                        orders.length > 0 && (

                        <div className="row g-4">

                            {orders.map(
                                (order) => {

                                    const totalAmount =
                                        Number(
                                            order.totalAmount ||
                                            0
                                        );

                                    const platformFee =
                                        totalAmount *
                                        FARM_LINK_FEE;

                                    const farmerAmount =
                                        totalAmount -
                                        platformFee;

                                    return (

                                        <div
                                            className="col-12 col-xl-6"
                                            key={
                                                order._id
                                            }
                                        >

                                            <div className="border rounded-4 p-4 h-100 shadow-sm">

                                                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">

                                                    <div className="min-w-0">

                                                        <h5 className="fw-bold mb-1">
                                                            {
                                                                order
                                                                    .product
                                                                    ?.name ||
                                                                'Produce'
                                                            }
                                                        </h5>

                                                        <small className="text-muted">
                                                            Order #
                                                            {
                                                                order._id
                                                                    ? order._id.slice(
                                                                        -8
                                                                    )
                                                                    : '--------'
                                                            }
                                                        </small>

                                                    </div>


                                                    <span
                                                        className={`badge ${getOrderStatusClass(
                                                            order.status
                                                        )}`}
                                                    >
                                                        {
                                                            getOrderStatusLabel(
                                                                order.status
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <div className="bg-light rounded-3 p-3 mb-3">

                                                    <div className="row g-3">

                                                        <div className="col-6">

                                                            <small className="text-muted d-block mb-1">
                                                                Buyer
                                                            </small>

                                                            <strong>
                                                                {
                                                                    order
                                                                        .buyer
                                                                        ?.name ||
                                                                    'Buyer'
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="col-6">

                                                            <small className="text-muted d-block mb-1">
                                                                Quantity
                                                            </small>

                                                            <strong>
                                                                {
                                                                    order.quantity
                                                                }{' '}
                                                                {
                                                                    order
                                                                        .product
                                                                        ?.unit
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="col-6">

                                                            <small className="text-muted d-block mb-1">
                                                                Unit Price
                                                            </small>

                                                            <strong>
                                                                ₦
                                                                {Number(
                                                                    order.unitPrice ||
                                                                    0
                                                                ).toLocaleString()}

                                                                <span className="text-muted">
                                                                    /
                                                                    {
                                                                        order
                                                                            .product
                                                                            ?.unit
                                                                    }
                                                                </span>
                                                            </strong>

                                                        </div>


                                                        <div className="col-6">

                                                            <small className="text-muted d-block mb-1">
                                                                Order Total
                                                            </small>

                                                            <strong>
                                                                ₦
                                                                {totalAmount.toLocaleString()}
                                                            </strong>

                                                        </div>

                                                    </div>

                                                </div>


                                                <div className="border-top pt-3">

                                                    <div className="d-flex justify-content-between align-items-center mb-3">

                                                        <span className="d-flex align-items-center gap-2">

                                                            <CircleDollarSign
                                                                size={
                                                                    16
                                                                }
                                                            />

                                                            Payment Status

                                                        </span>

                                                        <strong
                                                            className={getPaymentStatusClass(
                                                                order.paymentStatus
                                                            )}
                                                        >
                                                            {
                                                                getPaymentStatusLabel(
                                                                    order.paymentStatus
                                                                )
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div className="rounded-3 p-3 bg-light">

                                                        <div className="d-flex justify-content-between mb-2">

                                                            <span>
                                                                Order Total
                                                            </span>

                                                            <strong>
                                                                ₦
                                                                {totalAmount.toLocaleString()}
                                                            </strong>

                                                        </div>


                                                        <div className="d-flex justify-content-between mb-2">

                                                            <span className="text-muted">
                                                                FarmLink Fee (2.5%)
                                                            </span>

                                                            <span className="text-danger">
                                                                - ₦
                                                                {platformFee.toLocaleString()}
                                                            </span>

                                                        </div>


                                                        <div className="border-top pt-2 d-flex justify-content-between gap-3">

                                                            <strong>
                                                                Estimated Farmer Amount
                                                            </strong>

                                                            <strong className="text-success">
                                                                ₦
                                                                {farmerAmount.toLocaleString()}
                                                            </strong>

                                                        </div>

                                                    </div>


                                                    {order.paymentStatus ===
                                                        'paid' &&
                                                        order.paymentReference && (

                                                            <small className="text-muted d-block mt-3 text-break">
                                                                Payment Reference:{' '}
                                                                {
                                                                    order.paymentReference
                                                                }
                                                            </small>

                                                        )}

                                                </div>


                                                <div className="border-top mt-3 pt-3">

                                                    <strong className="d-block mb-3">
                                                        Order Actions
                                                    </strong>


                                                    {order.status ===
                                                        'pending' && (

                                                        <div>

                                                            {order.paymentStatus !==
                                                                'paid' && (

                                                                <div className="alert alert-warning py-2 mb-3">

                                                                    <div className="d-flex align-items-start gap-2">

                                                                        <Clock3
                                                                            size={
                                                                                16
                                                                            }
                                                                            className="mt-1 flex-shrink-0"
                                                                        />

                                                                        <small>
                                                                            Waiting for the buyer to complete payment. Do not confirm the order until payment is marked as paid.
                                                                        </small>

                                                                    </div>

                                                                </div>

                                                            )}


                                                            {order.paymentStatus ===
                                                                'paid' && (

                                                                <div className="alert alert-success py-2 mb-3">

                                                                    <div className="d-flex align-items-start gap-2">

                                                                        <CheckCircle2
                                                                            size={
                                                                                16
                                                                            }
                                                                            className="mt-1 flex-shrink-0"
                                                                        />

                                                                        <small>
                                                                            Payment has been received. You can now confirm this order.
                                                                        </small>

                                                                    </div>

                                                                </div>

                                                            )}


                                                            <div className="d-flex flex-wrap gap-2">

                                                                <button
                                                                    className="btn btn-success"
                                                                    onClick={() =>
                                                                        handleOrderStatusUpdate(
                                                                            order._id,
                                                                            'confirmed'
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        order.paymentStatus !==
                                                                        'paid'
                                                                    }
                                                                >
                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="me-2"
                                                                    />

                                                                    Confirm Order
                                                                </button>


                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() =>
                                                                        handleOrderStatusUpdate(
                                                                            order._id,
                                                                            'cancelled'
                                                                        )
                                                                    }
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="me-2"
                                                                    />

                                                                    Cancel Order
                                                                </button>

                                                            </div>

                                                        </div>

                                                    )}


                                                    {order.status ===
                                                        'confirmed' && (

                                                        <div>

                                                            <div className="alert alert-success py-2 mb-3">

                                                                <div className="d-flex align-items-start gap-2">

                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="mt-1 flex-shrink-0"
                                                                    />

                                                                    <small>
                                                                        Payment received and order confirmed. Start preparing the produce for fulfillment.
                                                                    </small>

                                                                </div>

                                                            </div>


                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() =>
                                                                    handleOrderStatusUpdate(
                                                                        order._id,
                                                                        'processing'
                                                                    )
                                                                }
                                                            >
                                                                <Truck
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="me-2"
                                                                />

                                                                Start Processing
                                                            </button>

                                                        </div>

                                                    )}


                                                    {order.status ===
                                                        'processing' && (

                                                        <div>

                                                            <div className="alert alert-primary py-2 mb-3">

                                                                <div className="d-flex align-items-start gap-2">

                                                                    <TrendingUp
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="mt-1 flex-shrink-0"
                                                                    />

                                                                    <small>
                                                                        This order is currently being processed. Complete it when the produce has been fulfilled according to your FarmLink process.
                                                                    </small>

                                                                </div>

                                                            </div>


                                                            <button
                                                                className="btn btn-success"
                                                                onClick={() =>
                                                                    handleOrderStatusUpdate(
                                                                        order._id,
                                                                        'completed'
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="me-2"
                                                                />

                                                                Mark as Completed
                                                            </button>

                                                        </div>

                                                    )}


                                                    {order.status ===
                                                        'completed' && (

                                                        <div className="alert alert-secondary py-2 mb-0">

                                                            <div className="d-flex align-items-start gap-2">

                                                                <CheckCircle2
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="mt-1 flex-shrink-0"
                                                                />

                                                                <small>
                                                                    Order completed successfully. This sale is included in your completed sales and estimated earnings.
                                                                </small>

                                                            </div>

                                                        </div>

                                                    )}


                                                    {order.status ===
                                                        'cancelled' && (

                                                        <div className="alert alert-danger py-2 mb-0">

                                                            <div className="d-flex align-items-start gap-2">

                                                                <XCircle
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                                <small>
                                                                    This order has been cancelled.
                                                                </small>

                                                            </div>

                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </section>


            {/* ========================== */}
            {/* STYLES */}
            {/* ========================== */}

            <style>
                {`
                    .min-w-0 {
                        min-width: 0;
                    }

                    .spin {
                        animation:
                            farmlink-spin
                            1s linear infinite;
                    }

                    @keyframes farmlink-spin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    html {
                        scroll-behavior: smooth;
                    }
                `}
            </style>

        </div>
    );
};


export default FarmerDashboard;