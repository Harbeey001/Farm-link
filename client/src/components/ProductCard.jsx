import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Package,
    UserRound,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    XCircle
} from 'lucide-react';

import {
    getProductImage,
    getCategoryImage
} from '../utils/productImage';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    const fallbackImage = getCategoryImage(product?.category);

    const quantity = Number(product?.quantity || 0);

    const status = String(
        product?.status || 'available'
    ).toLowerCase();

    const isAvailable =
        status === 'available' && quantity > 0;

    const isLowStock =
        isAvailable && quantity > 0 && quantity <= 10;

    const isOutOfStock =
    quantity <= 0 ||
    status === 'sold' ||
    status === 'inactive';

    const formattedStatus =
        status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <div className="card h-100 border-0 shadow-sm overflow-hidden">

            {/* ========================== */}
            {/* PRODUCT IMAGE */}
            {/* ========================== */}

            <div
                className="bg-light position-relative"
                style={{
                    height: '210px',
                    overflow: 'hidden'
                }}
            >
                <img
                    src={getProductImage(product)}
                    alt={product?.name || 'Farm produce'}
                    className="w-100 h-100"
                    loading="lazy"
                    style={{
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        if (
                            e.currentTarget.src !==
                            fallbackImage
                        ) {
                            e.currentTarget.src =
                                fallbackImage;
                        }
                    }}
                />

                {/* Category label for fallback images */}

                {!product?.image && (
                    <span
                        className="position-absolute bottom-0 start-0 m-3 badge bg-dark bg-opacity-75 px-3 py-2"
                    >
                        {product?.category || 'Farm Produce'}
                    </span>
                )}

                {/* Availability overlay */}

                {isOutOfStock && (
                    <div
                        className="position-absolute top-0 end-0 m-3 badge bg-danger d-flex align-items-center gap-1 px-3 py-2"
                    >
                        <XCircle size={14} />
                        {quantity <= 0
                            ? 'Out of Stock'
                            : 'Sold'}
                    </div>
                )}

                {isLowStock && (
                    <div
                        className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark d-flex align-items-center gap-1 px-3 py-2"
                    >
                        <AlertTriangle size={14} />
                        Low Stock
                    </div>
                )}
            </div>


            {/* ========================== */}
            {/* PRODUCT INFORMATION */}
            {/* ========================== */}

            <div className="card-body p-4">

                {/* CATEGORY + STATUS */}

                <div className="d-flex justify-content-between align-items-center gap-2 mb-3">

                    <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2">
                        {product?.category || 'Farm Produce'}
                    </span>

                    <span
                        className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 ${isAvailable
                                ? 'bg-light text-success border'
                                : 'bg-danger-subtle text-danger border'
                            }`}
                    >
                        {isAvailable ? (
                            <CheckCircle2 size={13} />
                        ) : (
                            <XCircle size={13} />
                        )}

                        {formattedStatus}
                    </span>

                </div>


                {/* PRODUCT NAME */}

                <h5 className="fw-bold mb-2 text-break">
                    {product?.name || 'Farm Produce'}
                </h5>


                {/* DESCRIPTION */}

                <p
                    className="text-muted small mb-3"
                    style={{
                        lineHeight: '1.6',
                        minHeight: '48px'
                    }}
                >
                    {product?.description ||
                        'Quality farm produce available from a FarmLink farmer.'}
                </p>


                {/* PRODUCT DETAILS */}

                <div className="d-flex flex-column gap-2">

                    <div className="small text-muted d-flex align-items-center gap-2">

                        <Package
                            size={16}
                            className="text-success flex-shrink-0"
                        />

                        <span>
                            <strong
                                className={
                                    isLowStock
                                        ? 'text-warning-emphasis'
                                        : isOutOfStock
                                            ? 'text-danger'
                                            : 'text-dark'
                                }
                            >
                                {quantity.toLocaleString()}
                            </strong>{' '}
                            {product?.unit || ''}
                        </span>

                    </div>


                    {product?.location && (
                        <div className="small text-muted d-flex align-items-center gap-2">

                            <MapPin
                                size={16}
                                className="text-success flex-shrink-0"
                            />

                            <span className="text-truncate">
                                {product.location}
                            </span>

                        </div>
                    )}

                </div>


                {/* STOCK MESSAGE */}

                <div className="mt-3">

                    {isAvailable && !isLowStock && (
                        <div className="small text-success d-flex align-items-center gap-1">
                            <CheckCircle2 size={14} />
                            Available for request
                        </div>
                    )}

                    {isLowStock && (
                        <div className="small text-warning-emphasis d-flex align-items-center gap-1">
                            <AlertTriangle size={14} />
                            Only {quantity.toLocaleString()}{' '}
                            {product?.unit || 'units'} left
                        </div>
                    )}

                    {isOutOfStock && (
                        <div className="small text-danger d-flex align-items-center gap-1">
                            <XCircle size={14} />
                            Currently unavailable
                        </div>
                    )}

                </div>


                {/* PRICE */}

                <div className="border-top mt-4 pt-3">

                    <div className="small text-muted mb-1">
                        Price
                    </div>

                    <div className="d-flex align-items-baseline gap-1">

                        <span className="fs-4 text-success fw-bold">
                            ₦
                            {Number(
                                product?.price || 0
                            ).toLocaleString()}
                        </span>

                        <small className="text-muted">
                            /{product?.unit || 'unit'}
                        </small>

                    </div>

                </div>


                {/* FARMER */}

                {product?.farmer && (
                    <div className="d-flex align-items-center gap-2 small text-muted mt-3">

                        <UserRound
                            size={16}
                            className="text-success flex-shrink-0"
                        />

                        <span className="text-truncate">
                            Farmer:{' '}
                            <strong className="text-dark">
                                {product.farmer.name}
                            </strong>

                            {product.farmer.verificationStatus === 'verified' && (
                                <span className="badge bg-success ms-2">
                                    Verified
                                </span>
                            )}
                        </span>

                    </div>
                )}

            </div>


            {/* ========================== */}
            {/* BUTTON */}
            {/* ========================== */}

            <div className="card-footer bg-white border-0 px-4 pb-4">

                <button
                    type="button"
                    className={`btn w-100 d-flex align-items-center justify-content-center gap-2 ${isAvailable
                            ? 'btn-success'
                            : 'btn-outline-secondary'
                        }`}
                    onClick={() =>
                        navigate(`/products/${product._id}`)
                    }
                >
                    {isAvailable
                        ? 'View Details'
                        : 'View Product'}

                    <ArrowRight size={17} />

                </button>

            </div>

        </div>
    );
};

export default ProductCard;
