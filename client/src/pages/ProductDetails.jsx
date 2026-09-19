import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    FileText,
    Headphones,
    Leaf,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    User,
    XCircle
} from 'lucide-react';

import { getProductById } from '../services/productService';
import { createRequest } from '../services/requestService';
import { useAuth } from '../context/AuthContext';


// =====================================================
// CATEGORY FALLBACK IMAGES
// =====================================================

const categoryImages = {
    vegetables:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',

    fruits:
        'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80',

    grains:
        'https://images.unsplash.com/photo-1536633287229-6c3e73b7d0e3?auto=format&fit=crop&w=1200&q=80',

    tubers:
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80',

    livestock:
        'https://images.unsplash.com/photo-1560114928-40f299bebb07?auto=format&fit=crop&w=1200&q=80',

    poultry:
        'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80',

    default:
        'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1200&q=80'
};


// =====================================================
// GET CATEGORY IMAGE
// =====================================================

const getCategoryImage = (category) => {
    if (!category) {
        return categoryImages.default;
    }

    const normalizedCategory = category
        .toLowerCase()
        .trim();

    return (
        categoryImages[normalizedCategory] ||
        categoryImages.default
    );
};


// =====================================================
// GET PRODUCT IMAGE
// =====================================================

const getProductImage = (product) => {
    if (
        product?.image &&
        typeof product.image === 'string' &&
        product.image.trim()
    ) {
        return product.image;
    }

    return getCategoryImage(product?.category);
};


// =====================================================
// COMPONENT
// =====================================================

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);

    const [imageLoaded, setImageLoaded] = useState(false);


    // =====================================================
    // FETCH PRODUCT
    // =====================================================

    useEffect(() => {
        let ignore = false;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                setImageLoaded(false);

                const productData = await getProductById(id);

                if (ignore) {
                    return;
                }

                if (!productData) {
                    throw new Error('Product not found');
                }

                setProduct(productData);

                const availableQuantity =
                    Number(productData.quantity) || 0;

                if (availableQuantity > 0) {
                    setQuantity(1);
                }
            } catch (err) {
                if (ignore) {
                    return;
                }

                console.error(
                    'Product details error:',
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    'Unable to load this product.'
                );
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchProduct();
        }

        return () => {
            ignore = true;
        };
    }, [id]);


    // =====================================================
    // PRODUCT DATA
    // =====================================================

    const availableQuantity =
        Number(product?.quantity) || 0;

    const productPrice =
        Number(product?.price) || 0;

    const isAvailable =
        availableQuantity > 0 &&
        product?.status !== 'sold' &&
        product?.status !== 'inactive';


    // =====================================================
    // PRODUCT OWNER
    // =====================================================

    const isOwner = useMemo(() => {
        if (!user || !product?.farmer) {
            return false;
        }

        const userId =
            user._id ||
            user.id;

        const farmerId =
            product.farmer?._id ||
            product.farmer?.id ||
            product.farmer;

        return (
            userId &&
            farmerId &&
            String(userId) === String(farmerId)
        );
    }, [user, product]);


    // =====================================================
    // TOTAL AMOUNT
    // =====================================================

    const totalAmount =
        productPrice * quantity;


    // =====================================================
    // CURRENCY
    // =====================================================

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0
        }).format(amount);
    };


    // =====================================================
    // QUANTITY CONTROLS
    // =====================================================

    const decreaseQuantity = () => {
        setQuantity((current) =>
            Math.max(1, current - 1)
        );
    };


    const increaseQuantity = () => {
        setQuantity((current) =>
            Math.min(
                availableQuantity,
                current + 1
            )
        );
    };


    const handleQuantityChange = (event) => {
        const value = Number(event.target.value);

        if (!Number.isFinite(value)) {
            return;
        }

        if (value < 1) {
            setQuantity(1);
            return;
        }

        if (value > availableQuantity) {
            setQuantity(availableQuantity);
            return;
        }

        setQuantity(value);
    };


    // =====================================================
    // REQUEST PRODUCE
    // =====================================================

    const handleRequest = async (event) => {
        event.preventDefault();

        setError('');
        setRequestSuccess(false);

        // Login check
        if (!user) {
            setError(
                'Please log in as a buyer before requesting produce.'
            );

            return;
        }

        // Buyer check
        if (user.role !== 'buyer') {
            setError(
                'Only buyers can request produce from farmers.'
            );

            return;
        }

        // Owner check
        if (isOwner) {
            setError(
                'You cannot request your own produce.'
            );

            return;
        }

        // Availability check
        if (!isAvailable) {
            setError(
                'This produce is currently unavailable.'
            );

            return;
        }

        // Quantity validation
        if (
            !Number.isFinite(Number(quantity)) ||
            Number(quantity) < 1
        ) {
            setError(
                'Please enter a valid quantity.'
            );

            return;
        }

        if (
            Number(quantity) >
            availableQuantity
        ) {
            setError(
                `Only ${availableQuantity} ${product.unit} is currently available.`
            );

            return;
        }

        try {
            setSubmitting(true);

            await createRequest({
                product: product._id,
                quantity: Number(quantity),
                message: message.trim()
            });

            setRequestSuccess(true);
            setMessage('');
            setQuantity(1);
        } catch (err) {
            console.error(
                'Request produce error:',
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Unable to send your request. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };


    // =====================================================
    // LOADING STATE
    // =====================================================

    if (loading) {
        return (
            <div className="bg-light min-vh-100">
                <div className="container py-5">
                    <div
                        className="d-flex flex-column align-items-center justify-content-center text-center"
                        style={{ minHeight: '65vh' }}
                    >
                        <div
                            className="spinner-border text-success mb-3"
                            style={{
                                width: '3rem',
                                height: '3rem'
                            }}
                            role="status"
                        />

                        <h5 className="fw-bold mb-1">
                            Loading Produce
                        </h5>

                        <p className="text-muted mb-0">
                            Please wait while we get the details...
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    // =====================================================
    // ERROR STATE
    // =====================================================

    if (error && !product) {
        return (
            <div className="bg-light min-vh-100">
                <div className="container py-5">
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{ minHeight: '65vh' }}
                    >
                        <div
                            className="card border-0 shadow-sm text-center"
                            style={{
                                maxWidth: '550px',
                                width: '100%'
                            }}
                        >
                            <div className="card-body p-5">

                                <div
                                    className="mx-auto mb-3 rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '70px',
                                        height: '70px'
                                    }}
                                >
                                    <XCircle
                                        size={36}
                                        className="text-danger"
                                    />
                                </div>

                                <h4 className="fw-bold">
                                    Unable to Load Produce
                                </h4>

                                <p className="text-muted mb-4">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    className="btn btn-success px-4"
                                    onClick={() =>
                                        navigate('/marketplace')
                                    }
                                >
                                    <ArrowLeft
                                        size={18}
                                        className="me-2"
                                    />

                                    Back to Marketplace
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    if (!product) {
        return null;
    }


    // =====================================================
    // IMAGE
    // =====================================================

    const productImage =
        getProductImage(product);


    // =====================================================
    // STOCK LABEL
    // =====================================================

    const stockLabel =
        availableQuantity === 0
            ? 'Out of stock'
            : availableQuantity <= 10
                ? 'Low stock'
                : 'In stock';


    // =====================================================
    // MAIN RENDER
    // =====================================================

    return (
        <div
            className="bg-light min-vh-100"
            style={{
                '--farmlink-green': '#198754'
            }}
        >

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="container pt-4">

                <button
                    type="button"
                    className="btn btn-link text-dark text-decoration-none px-0 d-inline-flex align-items-center fw-semibold"
                    onClick={() =>
                        navigate('/marketplace')
                    }
                >
                    <ArrowLeft
                        size={18}
                        className="me-2"
                    />

                    Back to Marketplace
                </button>

            </div>


            <div className="container py-3 py-lg-4">

                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {error && (
                    <div
                        className="alert alert-danger border-0 shadow-sm d-flex align-items-start mb-4"
                        role="alert"
                    >
                        <XCircle
                            size={21}
                            className="me-2 flex-shrink-0 mt-1"
                        />

                        <div className="flex-grow-1">
                            <strong>
                                Something went wrong
                            </strong>

                            <div className="small mt-1">
                                {error}
                            </div>
                        </div>
                    </div>
                )}


                {/* =================================================
                    REQUEST SUCCESS
                ================================================= */}

                {requestSuccess && (
                    <div
                        className="alert alert-success border-0 shadow-sm mb-4"
                        role="alert"
                    >
                        <div className="d-flex align-items-start">

                            <CheckCircle2
                                size={28}
                                className="me-3 flex-shrink-0"
                            />

                            <div className="flex-grow-1">

                                <h5 className="fw-bold mb-1">
                                    Request Sent Successfully
                                </h5>

                                <p className="mb-3">
                                    Your request has been sent to the farmer.
                                    The farmer will review your request from
                                    their dashboard.
                                </p>

                                <div className="d-flex flex-wrap gap-2">

                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={() =>
                                            navigate(
                                                '/buyer-dashboard'
                                            )
                                        }
                                    >
                                        View My Requests

                                        <ArrowUpRight
                                            size={17}
                                            className="ms-2"
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-success"
                                        onClick={() =>
                                            setRequestSuccess(false)
                                        }
                                    >
                                        Continue Browsing
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* =================================================
                    MAIN PRODUCT AREA
                ================================================= */}

                <div className="row g-4">

                    {/* =================================================
                        IMAGE
                    ================================================= */}

                    <div className="col-lg-7">

                        <div className="card border-0 shadow-sm overflow-hidden">

                            <div
                                className="position-relative"
                                style={{
                                    height:
                                        'clamp(330px, 52vw, 560px)',
                                    backgroundColor:
                                        '#e9ecef'
                                }}
                            >

                                {!imageLoaded && (
                                    <div
                                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                        style={{
                                            zIndex: 1
                                        }}
                                    >
                                        <div
                                            className="spinner-border text-success"
                                            role="status"
                                        />
                                    </div>
                                )}

                                <img
                                    src={productImage}
                                    alt={`${product.name} - FarmLink`}
                                    className="w-100 h-100"
                                    loading="eager"
                                    style={{
                                        objectFit: 'cover',
                                        opacity:
                                            imageLoaded ? 1 : 0,
                                        transition:
                                            'opacity 0.3s ease'
                                    }}
                                    onLoad={() =>
                                        setImageLoaded(true)
                                    }
                                    onError={(event) => {
                                        event.currentTarget.onerror =
                                            null;

                                        event.currentTarget.src =
                                            getCategoryImage(
                                                product.category
                                            );

                                        setImageLoaded(true);
                                    }}
                                />


                                {/* Image overlay */}

                                <div
                                    className="position-absolute bottom-0 start-0 end-0 p-3 p-md-4"
                                    style={{
                                        background:
                                            'linear-gradient(transparent, rgba(0,0,0,0.65))'
                                    }}
                                >
                                    <div className="d-flex flex-wrap gap-2">

                                        <span className="badge bg-success px-3 py-2">
                                            <Leaf
                                                size={14}
                                                className="me-1"
                                            />

                                            {product.category}
                                        </span>

                                        <span
                                            className={`badge px-3 py-2 ${
                                                isAvailable
                                                    ? 'bg-white text-success'
                                                    : 'bg-danger'
                                            }`}
                                        >
                                            {isAvailable ? (
                                                <>
                                                    <CheckCircle2
                                                        size={14}
                                                        className="me-1"
                                                    />

                                                    Available
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle
                                                        size={14}
                                                        className="me-1"
                                                    />

                                                    {product.status ===
                                                        'inactive'
                                                        ? 'Inactive'
                                                        : 'Sold Out'}
                                                </>
                                            )}
                                        </span>

                                    </div>
                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            PRODUCT QUICK INFORMATION
                        ================================================= */}

                        <div className="row g-3 mt-1">

                            <div className="col-sm-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body p-3">
                                        <small className="text-muted d-block mb-1">
                                            Category
                                        </small>

                                        <div className="fw-bold text-capitalize">
                                            {product.category}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body p-3">
                                        <small className="text-muted d-block mb-1">
                                            Available
                                        </small>

                                        <div className="fw-bold">
                                            {availableQuantity}{' '}
                                            {product.unit}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body p-3">
                                        <small className="text-muted d-block mb-1">
                                            Stock Status
                                        </small>

                                        <div
                                            className={`fw-bold ${
                                                availableQuantity <= 10 &&
                                                availableQuantity > 0
                                                    ? 'text-warning'
                                                    : isAvailable
                                                        ? 'text-success'
                                                        : 'text-danger'
                                            }`}
                                        >
                                            {stockLabel}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        PRODUCT DETAILS
                    ================================================= */}

                    <div className="col-lg-5">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-3 p-md-4">

                                {/* Product heading */}

                                <div className="mb-4">

                                    <span className="text-success fw-semibold small text-uppercase">
                                        {product.category}
                                    </span>

                                    <h1
                                        className="fw-bold mt-2 mb-3"
                                        style={{
                                            fontSize:
                                                'clamp(1.8rem, 4vw, 2.7rem)'
                                        }}
                                    >
                                        {product.name}
                                    </h1>

                                    <div className="d-flex align-items-start text-muted">

                                        <MapPin
                                            size={19}
                                            className="me-2 text-success flex-shrink-0 mt-1"
                                        />

                                        <span>
                                            {product.location ||
                                                'Location not provided'}
                                        </span>

                                    </div>

                                </div>


                                {/* =================================================
                                    PRICE
                                ================================================= */}

                                <div
                                    className="rounded-4 p-3 p-md-4 mb-4"
                                    style={{
                                        background:
                                            'rgba(25, 135, 84, 0.08)'
                                    }}
                                >

                                    <small className="text-muted d-block mb-1">
                                        Price
                                    </small>

                                    <div className="d-flex align-items-baseline flex-wrap gap-2">

                                        <span
                                            className="fw-bold text-success"
                                            style={{
                                                fontSize:
                                                    'clamp(1.8rem, 5vw, 2.6rem)'
                                            }}
                                        >
                                            {formatCurrency(
                                                productPrice
                                            )}
                                        </span>

                                        <span className="text-muted">
                                            / {product.unit}
                                        </span>

                                    </div>

                                </div>


                                {/* =================================================
                                    STOCK
                                ================================================= */}

                                <div className="mb-4">

                                    <div className="d-flex justify-content-between align-items-center mb-2">

                                        <span className="fw-semibold">
                                            Available Stock
                                        </span>

                                        <span className="fw-bold text-success">
                                            {availableQuantity}{' '}
                                            {product.unit}
                                        </span>

                                    </div>

                                    <div
                                        className="progress rounded-pill"
                                        style={{
                                            height: '8px'
                                        }}
                                    >
                                        <div
                                            className={`progress-bar ${
                                                availableQuantity <= 10
                                                    ? 'bg-warning'
                                                    : 'bg-success'
                                            }`}
                                            role="progressbar"
                                            style={{
                                                width:
                                                    availableQuantity >
                                                        0
                                                        ? '100%'
                                                        : '0%'
                                            }}
                                        />
                                    </div>

                                    <small className="text-muted d-block mt-2">
                                        {availableQuantity > 0
                                            ? `${availableQuantity} ${product.unit} currently available`
                                            : 'No stock currently available'}
                                    </small>

                                </div>


                                {/* =================================================
                                    DESCRIPTION
                                ================================================= */}

                                <div className="mb-4">

                                    <h5 className="fw-bold mb-2">

                                        <FileText
                                            size={19}
                                            className="me-2 text-success"
                                        />

                                        About This Produce
                                    </h5>

                                    <p
                                        className="text-muted mb-0"
                                        style={{
                                            lineHeight: '1.7'
                                        }}
                                    >
                                        {product.description ||
                                            'No description provided by the farmer.'}
                                    </p>

                                </div>


                                {/* =================================================
                                    FARMER
                                ================================================= */}

                                <div className="border rounded-4 p-3 mb-4">

                                    <div className="d-flex align-items-center mb-3">

                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                background:
                                                    'rgba(25, 135, 84, 0.1)'
                                            }}
                                        >
                                            <User
                                                size={25}
                                                className="text-success"
                                            />
                                        </div>

                                        <div className="min-w-0">

                                            <h6 className="fw-bold mb-1">
                                                {product.farmer?.name ||
                                                    'FarmLink Farmer'}
                                            </h6>

                                            <small className="text-muted d-flex align-items-center gap-1">
                                                {product.farmer?.verificationStatus === 'verified' ? (
                                                    <>
                                                        <ShieldCheck
                                                            size={14}
                                                            className="text-success"
                                                        />
                                                        Verified FarmLink farmer
                                                    </>
                                                ) : (
                                                    'FarmLink farmer'
                                                )}
                                            </small>

                                        </div>

                                    </div>


                                    {product.farmer?.location && (
                                        <div className="small text-muted mb-2 d-flex align-items-start">
                                            <MapPin
                                                size={15}
                                                className="me-2 text-success flex-shrink-0 mt-1"
                                            />

                                            <span>
                                                {product.farmer.location}
                                            </span>
                                        </div>
                                    )}


                                    {product.farmer?.phone && (
                                        <div className="small text-muted mb-2 d-flex align-items-center">
                                            <Phone
                                                size={15}
                                                className="me-2 text-success flex-shrink-0"
                                            />

                                            <span>
                                                {product.farmer.phone}
                                            </span>
                                        </div>
                                    )}


                                    {product.farmer?.email && (
                                        <div className="small text-muted d-flex align-items-center">
                                            <MessageSquare
                                                size={15}
                                                className="me-2 text-success flex-shrink-0"
                                            />

                                            <span className="text-break">
                                                {product.farmer.email}
                                            </span>
                                        </div>
                                    )}

                                </div>


                                {/* =================================================
                                    REQUEST SECTION
                                ================================================= */}

                                {isOwner ? (

                                    <div className="alert alert-info border-0 rounded-4 mb-0">

                                        <div className="d-flex align-items-start">

                                            <Package
                                                size={23}
                                                className="me-2 flex-shrink-0"
                                            />

                                            <div>

                                                <strong>
                                                    Your Produce Listing
                                                </strong>

                                                <p className="mb-3 mt-1 small">
                                                    You cannot request your
                                                    own produce. Manage this
                                                    listing from your Farmer
                                                    Dashboard.
                                                </p>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() =>
                                                        navigate(
                                                            '/farmer-dashboard'
                                                        )
                                                    }
                                                >
                                                    Manage Listing
                                                    <ArrowUpRight
                                                        size={15}
                                                        className="ms-1"
                                                    />
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ) : requestSuccess ? (

                                    <div
                                        className="text-center rounded-4 p-4"
                                        style={{
                                            background:
                                                'rgba(25, 135, 84, 0.08)'
                                        }}
                                    >

                                        <div
                                            className="mx-auto rounded-circle bg-success d-flex align-items-center justify-content-center mb-3"
                                            style={{
                                                width: '64px',
                                                height: '64px'
                                            }}
                                        >
                                            <CheckCircle2
                                                size={34}
                                                className="text-white"
                                            />
                                        </div>

                                        <h5 className="fw-bold">
                                            Request Sent
                                        </h5>

                                        <p className="text-muted small mb-3">
                                            Your request is now waiting for
                                            the farmer's response.
                                        </p>

                                        <button
                                            type="button"
                                            className="btn btn-success w-100"
                                            onClick={() =>
                                                navigate(
                                                    '/buyer-dashboard'
                                                )
                                            }
                                        >
                                            Go to Buyer Dashboard

                                            <ArrowUpRight
                                                size={17}
                                                className="ms-2"
                                            />
                                        </button>

                                    </div>

                                ) : (

                                    <form
                                        onSubmit={handleRequest}
                                    >

                                        <div className="d-flex align-items-center justify-content-between mb-3">

                                            <h5 className="fw-bold mb-0">
                                                Request This Produce
                                            </h5>

                                            <ShoppingCart
                                                size={21}
                                                className="text-success"
                                            />

                                        </div>


                                        {/* Quantity */}

                                        <label
                                            htmlFor="quantity"
                                            className="form-label fw-semibold"
                                        >
                                            Quantity
                                        </label>

                                        <div
                                            className="input-group mb-3"
                                            style={{
                                                maxWidth: '220px'
                                            }}
                                        >

                                            <button
                                                type="button"
                                                className="btn btn-outline-success px-3"
                                                onClick={
                                                    decreaseQuantity
                                                }
                                                disabled={
                                                    !isAvailable ||
                                                    quantity <= 1
                                                }
                                                aria-label="Decrease quantity"
                                            >
                                                −
                                            </button>

                                            <input
                                                id="quantity"
                                                type="number"
                                                className="form-control text-center fw-bold"
                                                min="1"
                                                max={
                                                    availableQuantity
                                                }
                                                value={quantity}
                                                onChange={
                                                    handleQuantityChange
                                                }
                                                disabled={
                                                    !isAvailable
                                                }
                                            />

                                            <button
                                                type="button"
                                                className="btn btn-outline-success px-3"
                                                onClick={
                                                    increaseQuantity
                                                }
                                                disabled={
                                                    !isAvailable ||
                                                    quantity >=
                                                    availableQuantity
                                                }
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>

                                        </div>


                                        {/* Estimated total */}

                                        <div className="d-flex justify-content-between align-items-center rounded-3 bg-light p-3 mb-3">

                                            <div>
                                                <small className="text-muted d-block">
                                                    Estimated Total
                                                </small>

                                                <small className="text-muted">
                                                    {quantity}{' '}
                                                    {product.unit}
                                                </small>
                                            </div>

                                            <span className="fw-bold text-success fs-5">
                                                {formatCurrency(
                                                    totalAmount
                                                )}
                                            </span>

                                        </div>


                                        {/* Message */}

                                        <label
                                            htmlFor="message"
                                            className="form-label fw-semibold"
                                        >
                                            Message to Farmer

                                            <span className="text-muted fw-normal">
                                                {' '}(optional)
                                            </span>
                                        </label>

                                        <textarea
                                            id="message"
                                            className="form-control mb-3"
                                            rows="4"
                                            placeholder="Add any special request or information for the farmer..."
                                            value={message}
                                            maxLength={500}
                                            onChange={(event) =>
                                                setMessage(
                                                    event.target.value
                                                )
                                            }
                                            disabled={
                                                !isAvailable
                                            }
                                        />

                                        <div className="text-end mb-3">
                                            <small className="text-muted">
                                                {message.length}/500
                                            </small>
                                        </div>


                                        {/* Submit */}

                                        <button
                                            type="submit"
                                            className="btn btn-success w-100 py-2 fw-semibold"
                                            disabled={
                                                submitting ||
                                                !isAvailable
                                            }
                                        >

                                            {submitting ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    />

                                                    Sending Request...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart
                                                        size={18}
                                                        className="me-2"
                                                    />

                                                    Request Produce
                                                </>
                                            )}

                                        </button>


                                        {!user && (
                                            <div className="text-center mt-3">
                                                <small className="text-muted">
                                                    You need to log in as a
                                                    buyer to request produce.
                                                </small>
                                            </div>
                                        )}

                                        {user?.role === 'buyer' &&
                                            !isOwner &&
                                            isAvailable && (
                                                <div className="text-center mt-3">
                                                    <small className="text-muted">
                                                        The farmer will review
                                                        your request before
                                                        payment is required.
                                                    </small>
                                                </div>
                                            )}

                                    </form>

                                )}

                            </div>
                        </div>

                    </div>

                </div>


                {/* =================================================
                    HOW FARMLINK WORKS
                ================================================= */}

                <div className="row g-4 mt-2">

                    <div className="col-12">

                        <div className="card border-0 shadow-sm overflow-hidden">

                            <div className="card-body p-4 p-md-5">

                                <div className="text-center mb-5">

                                    <span
                                        className="badge px-3 py-2 mb-2"
                                        style={{
                                            background:
                                                'rgba(25, 135, 84, 0.1)',
                                            color: '#198754'
                                        }}
                                    >
                                        <Sparkles
                                            size={15}
                                            className="me-1"
                                        />

                                        FarmLink Marketplace
                                    </span>

                                    <h3 className="fw-bold mb-2">
                                        How Buying Works
                                    </h3>

                                    <p className="text-muted mb-0">
                                        A simple and secure way to connect
                                        buyers with farmers.
                                    </p>

                                </div>


                                <div className="row g-4">

                                    {/* STEP 1 */}

                                    <div className="col-md-3">

                                        <div className="text-center h-100">

                                            <div
                                                className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                                style={{
                                                    width: '62px',
                                                    height: '62px'
                                                }}
                                            >
                                                <ShoppingCart
                                                    size={28}
                                                    className="text-success"
                                                />
                                            </div>

                                            <span className="badge bg-success mb-2">
                                                1
                                            </span>

                                            <h5 className="fw-bold">
                                                Request
                                            </h5>

                                            <p className="text-muted small mb-0">
                                                Select the produce you need
                                                and send your request to the
                                                farmer.
                                            </p>

                                        </div>

                                    </div>


                                    {/* STEP 2 */}

                                    <div className="col-md-3">

                                        <div className="text-center h-100">

                                            <div
                                                className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                                style={{
                                                    width: '62px',
                                                    height: '62px'
                                                }}
                                            >
                                                <User
                                                    size={28}
                                                    className="text-success"
                                                />
                                            </div>

                                            <span className="badge bg-success mb-2">
                                                2
                                            </span>

                                            <h5 className="fw-bold">
                                                Farmer Accepts
                                            </h5>

                                            <p className="text-muted small mb-0">
                                                The farmer reviews your request
                                                and accepts or rejects it.
                                            </p>

                                        </div>

                                    </div>


                                    {/* STEP 3 */}

                                    <div className="col-md-3">

                                        <div className="text-center h-100">

                                            <div
                                                className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                                style={{
                                                    width: '62px',
                                                    height: '62px'
                                                }}
                                            >
                                                <ShieldCheck
                                                    size={28}
                                                    className="text-success"
                                                />
                                            </div>

                                            <span className="badge bg-success mb-2">
                                                3
                                            </span>

                                            <h5 className="fw-bold">
                                                Pay Securely
                                            </h5>

                                            <p className="text-muted small mb-0">
                                                Once accepted, complete your
                                                payment securely through
                                                FarmLink.
                                            </p>

                                        </div>

                                    </div>


                                    {/* STEP 4 */}

                                    <div className="col-md-3">

                                        <div className="text-center h-100">

                                            <div
                                                className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                                style={{
                                                    width: '62px',
                                                    height: '62px'
                                                }}
                                            >
                                                <Package
                                                    size={28}
                                                    className="text-success"
                                                />
                                            </div>

                                            <span className="badge bg-success mb-2">
                                                4
                                            </span>

                                            <h5 className="fw-bold">
                                                Track Order
                                            </h5>

                                            <p className="text-muted small mb-0">
                                                Follow your order from
                                                confirmation through
                                                completion.
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TRUST SECTION
                ================================================= */}

                <div className="row g-4 mt-1">

                    <div className="col-md-4">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4 text-center">

                                <div
                                    className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                    style={{
                                        width: '58px',
                                        height: '58px'
                                    }}
                                >
                                    <ShieldCheck
                                        size={28}
                                        className="text-success"
                                    />
                                </div>

                                <h5 className="fw-bold">
                                    Direct Connection
                                </h5>

                                <p className="text-muted small mb-0">
                                    Connect directly with farmers and
                                    discover produce from local farms.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-4">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4 text-center">

                                <div
                                    className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                    style={{
                                        width: '58px',
                                        height: '58px'
                                    }}
                                >
                                    <Leaf
                                        size={28}
                                        className="text-success"
                                    />
                                </div>

                                <h5 className="fw-bold">
                                    Fresh Produce
                                </h5>

                                <p className="text-muted small mb-0">
                                    Find agricultural products listed
                                    directly by farmers on FarmLink.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-4">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4 text-center">

                                <div
                                    className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                    style={{
                                        width: '58px',
                                        height: '58px'
                                    }}
                                >
                                    <Headphones
                                        size={28}
                                        className="text-success"
                                    />
                                </div>

                                <h5 className="fw-bold">
                                    Simple Process
                                </h5>

                                <p className="text-muted small mb-0">
                                    Browse, request, pay and track your
                                    agricultural orders from one place.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    BOTTOM CTA
                ================================================= */}

                <div className="text-center py-5">

                    <button
                        type="button"
                        className="btn btn-outline-success px-4"
                        onClick={() =>
                            navigate('/marketplace')
                        }
                    >
                        <ArrowLeft
                            size={17}
                            className="me-2"
                        />

                        Continue Shopping
                    </button>

                </div>

            </div>


            {/* =================================================
                SMALL RESPONSIVE FIXES
            ================================================= */}

            <style>{`
                .min-w-0 {
                    min-width: 0;
                }

                @media (max-width: 575.98px) {
                    .card-body {
                        word-break: break-word;
                    }

                    textarea {
                        resize: vertical;
                    }
                }

                button {
                    transition:
                        transform 0.15s ease,
                        box-shadow 0.15s ease;
                }

                button:not(:disabled):hover {
                    transform: translateY(-1px);
                }

                button:disabled {
                    cursor: not-allowed;
                }
            `}</style>

        </div>
    );
};

export default ProductDetails;
