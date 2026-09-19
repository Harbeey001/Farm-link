import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    Leaf,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    ShoppingCart,
    Sprout,
    UserRound,
    Wheat,
} from 'lucide-react';
import { registerUser } from '../services/authService';


const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'farmer',
        location: '',
        termsAccepted: false,
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRoleChange = (role) => {
        setFormData((prev) => ({
            ...prev,
            role,
        }));

        setError('');
        setMessage('');
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    const trimmedData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        location: formData.location.trim(),
    };

    if (!trimmedData.name) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
    }

    if (!trimmedData.email) {
        setError('Please enter your email address.');
        setLoading(false);
        return;
    }

    if (trimmedData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
    }

    if (!trimmedData.phone) {
        setError('Please enter your phone number.');
        setLoading(false);
        return;
    }

    if (!trimmedData.location) {
        setError('Please enter your location.');
        setLoading(false);
        return;
    }

    if (!formData.termsAccepted) {
        setError('Please agree to the FarmLink Terms & Conditions.');
        setLoading(false);
        return;
    }

    try {
        const data = await registerUser(trimmedData);

        console.log('Registration response:', data);

        setMessage(
            'Registration successful! Your FarmLink account has been created.'
        );

        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            role: 'farmer',
            location: '',
            termsAccepted: false,
        });
    } catch (err) {
        console.error('Registration error:', err);

        setError(
            err.response?.data?.message ||
            err.message ||
            'Registration failed. Please check your details and try again.'
        );
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="farmlink-register-page min-vh-100 d-flex align-items-center py-4 py-lg-5">
            <div className="container">
                <div className="row justify-content-center align-items-center g-4 g-lg-5">

                    {/* Left Information Section */}
                    <div className="col-lg-5 d-none d-lg-block">
                        <div className="farmlink-register-intro pe-lg-4">

                            <div className="farmlink-brand-mark mb-4">
                                <Leaf size={30} strokeWidth={2.2} />
                            </div>

                            <div className="small fw-semibold text-success text-uppercase mb-2">
                                Join FarmLink
                            </div>

                            <h1 className="display-5 fw-bold text-dark mb-3">
                                Grow with a{' '}
                                <span className="text-success">
                                    connected marketplace.
                                </span>
                            </h1>

                            <p className="lead text-muted mb-4">
                                Create your FarmLink account and become part
                                of a marketplace that brings farmers and
                                buyers closer together.
                            </p>

                            <div className="farmlink-register-benefits">

                                <div className="d-flex align-items-start mb-4">
                                    <div className="farmlink-benefit-icon">
                                        <Wheat size={19} />
                                    </div>

                                    <div>
                                        <h6 className="fw-bold mb-1">
                                            For Farmers
                                        </h6>

                                        <p className="text-muted small mb-0">
                                            List your farm produce and connect
                                            with potential buyers.
                                        </p>
                                    </div>
                                </div>

                                <div className="d-flex align-items-start mb-4">
                                    <div className="farmlink-benefit-icon">
                                        <ShoppingCart size={19} />
                                    </div>

                                    <div>
                                        <h6 className="fw-bold mb-1">
                                            For Buyers
                                        </h6>

                                        <p className="text-muted small mb-0">
                                            Discover agricultural products
                                            directly from farmers.
                                        </p>
                                    </div>
                                </div>

                                <div className="d-flex align-items-start">
                                    <div className="farmlink-benefit-icon">
                                        <CheckCircle2 size={19} />
                                    </div>

                                    <div>
                                        <h6 className="fw-bold mb-1">
                                            Simple & Transparent
                                        </h6>

                                        <p className="text-muted small mb-0">
                                            Manage requests, payments and
                                            orders from one platform.
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>

                    {/* Registration Card */}
                    <div className="col-sm-11 col-md-9 col-lg-6">

                        <div className="card farmlink-register-card border-0 overflow-hidden">

                            {/* Header */}
                            <div className="farmlink-register-header text-white text-center">

                                <div className="farmlink-header-icon mx-auto mb-3">
                                    <Sprout size={28} strokeWidth={2} />
                                </div>

                                <h2 className="fw-bold mb-1">
                                    Create Your Account
                                </h2>

                                <p className="mb-0 opacity-75">
                                    Start your journey with FarmLink
                                </p>
                            </div>

                            {/* Form */}
                            <div className="card-body p-4 p-md-5">

                                {/* Success Message */}
                                {message && (
                                    <div
                                        className="alert alert-success border-0 rounded-3 mb-4"
                                        role="alert"
                                    >
                                        <div className="d-flex align-items-start">
                                            <CheckCircle2
                                                size={21}
                                                className="me-2 mt-1 flex-shrink-0"
                                            />

                                            <div className="small">
                                                <strong>
                                                    Account Created!
                                                </strong>

                                                <div className="mt-1">
                                                    {message}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-success btn-sm mt-3"
                                            onClick={() =>
                                                navigate('/login')
                                            }
                                        >
                                            Continue to Login
                                            <ArrowRight
                                                size={16}
                                                className="ms-2"
                                            />
                                        </button>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div
                                        className="alert alert-danger border-0 rounded-3 mb-4"
                                        role="alert"
                                    >
                                        <div className="d-flex align-items-start">
                                            <span className="me-2 mt-1">
                                                ⚠
                                            </span>

                                            <div className="small">
                                                {error}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>

                                    {/* Full Name */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="name"
                                            className="form-label fw-semibold"
                                        >
                                            Full Name
                                        </label>

                                        <div className="farmlink-input-group">
                                            <UserRound
                                                size={19}
                                                className="farmlink-input-icon"
                                            />

                                            <input
                                                id="name"
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="form-control farmlink-input"
                                                placeholder="Enter your full name"
                                                autoComplete="name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="email"
                                            className="form-label fw-semibold"
                                        >
                                            Email Address
                                        </label>

                                        <div className="farmlink-input-group">
                                            <Mail
                                                size={19}
                                                className="farmlink-input-icon"
                                            />

                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="form-control farmlink-input"
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="password"
                                            className="form-label fw-semibold"
                                        >
                                            Password
                                        </label>

                                        <div className="farmlink-input-group">
                                            <LockKeyhole
                                                size={19}
                                                className="farmlink-input-icon"
                                            />

                                            <input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="form-control farmlink-input"
                                                placeholder="Create a password"
                                                autoComplete="new-password"
                                                minLength="6"
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="farmlink-password-toggle"
                                                onClick={() =>
                                                    setShowPassword(
                                                        (prev) => !prev
                                                    )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? 'Hide password'
                                                        : 'Show password'
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={19} />
                                                ) : (
                                                    <Eye size={19} />
                                                )}
                                            </button>
                                        </div>

                                        <small className="text-muted">
                                            Use at least 6 characters.
                                        </small>
                                    </div>

                                    {/* Phone */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="phone"
                                            className="form-label fw-semibold"
                                        >
                                            Phone Number
                                        </label>

                                        <div className="farmlink-input-group">
                                            <Phone
                                                size={19}
                                                className="farmlink-input-icon"
                                            />

                                            <input
                                                id="phone"
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="form-control farmlink-input"
                                                placeholder="08012345678"
                                                autoComplete="tel"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Account Type */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            I am registering as a
                                        </label>

                                        <div className="row g-3">

                                            {/* Farmer */}
                                            <div className="col-6">
                                                <button
                                                    type="button"
                                                    className={`farmlink-role-card w-100 text-start ${formData.role ===
                                                        'farmer'
                                                        ? 'active'
                                                        : ''
                                                        }`}
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            'farmer'
                                                        )
                                                    }
                                                >
                                                    <div className="farmlink-role-icon">
                                                        <Wheat size={21} />
                                                    </div>

                                                    <div
                                                        className={`fw-bold ${formData.role ===
                                                            'farmer'
                                                            ? 'text-success'
                                                            : 'text-dark'
                                                            }`}
                                                    >
                                                        Farmer
                                                    </div>

                                                    <small className="text-muted">
                                                        Sell your produce
                                                    </small>
                                                </button>
                                            </div>

                                            {/* Buyer */}
                                            <div className="col-6">
                                                <button
                                                    type="button"
                                                    className={`farmlink-role-card w-100 text-start ${formData.role ===
                                                        'buyer'
                                                        ? 'active'
                                                        : ''
                                                        }`}
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            'buyer'
                                                        )
                                                    }
                                                >
                                                    <div className="farmlink-role-icon">
                                                        <ShoppingCart
                                                            size={21}
                                                        />
                                                    </div>

                                                    <div
                                                        className={`fw-bold ${formData.role ===
                                                            'buyer'
                                                            ? 'text-success'
                                                            : 'text-dark'
                                                            }`}
                                                    >
                                                        Buyer
                                                    </div>

                                                    <small className="text-muted">
                                                        Buy farm produce
                                                    </small>
                                                </button>
                                            </div>

                                        </div>

                                        <input
                                            type="hidden"
                                            name="role"
                                            value={formData.role}
                                            readOnly
                                        />
                                    </div>

                                    {/* Location */}
                                    <div className="mb-4">
                                        <label
                                            htmlFor="location"
                                            className="form-label fw-semibold"
                                        >
                                            Location
                                        </label>

                                        <div className="farmlink-input-group">
                                            <MapPin
                                                size={19}
                                                className="farmlink-input-icon"
                                            />

                                            <input
                                                id="location"
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="form-control farmlink-input"
                                                placeholder="Ogbomoso, Oyo State"
                                                autoComplete="address-level2"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {/* Terms & Conditions */}
                                    <div className="form-check mb-4">
                                        <input
                                            id="terms"
                                            type="checkbox"
                                            name="termsAccepted"
                                            className="form-check-input"
                                            checked={formData.termsAccepted}
                                            onChange={handleChange}
                                            required
                                        />

                                        <label
                                            htmlFor="terms"
                                            className="form-check-label text-muted small"
                                        >
                                            I agree to the{' '}
                                            <Link
                                                to="/terms"
                                                className="text-success fw-semibold text-decoration-none"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                FarmLink Terms & Conditions
                                            </Link>
                                            .
                                        </label>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        className="btn btn-success farmlink-register-button-main w-100 py-3 fw-semibold"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                />
                                                Creating your account...
                                            </>
                                        ) : (
                                            <>
                                                Create FarmLink Account
                                                <ArrowRight
                                                    size={18}
                                                    className="ms-2"
                                                />
                                            </>
                                        )}
                                    </button>

                                </form>

                                {/* Login */}
                                <div className="text-center mt-4">
                                    <p className="text-muted mb-2">
                                        Already have a FarmLink account?
                                    </p>

                                    <button
                                        type="button"
                                        className="btn btn-outline-success farmlink-login-button-outline px-4 py-2 fw-semibold"
                                        onClick={() =>
                                            navigate('/login')
                                        }
                                    >
                                        Login to FarmLink
                                    </button>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="farmlink-register-footer text-center">
                                <small className="text-muted d-flex justify-content-center align-items-center gap-2">
                                    <Leaf size={14} />
                                    Connecting Farmers & Buyers
                                </small>
                            </div>

                        </div>

                    </div>

                </div>
            </div>

            <style>{`
                .farmlink-register-page {
                    background:
                        radial-gradient(
                            circle at 10% 10%,
                            rgba(25, 135, 84, 0.08),
                            transparent 32%
                        ),
                        linear-gradient(
                            135deg,
                            #f2f8f4 0%,
                            #ffffff 52%,
                            #eef7f1 100%
                        );
                }

                .farmlink-register-intro {
                    animation: farmlinkRegisterFadeUp 0.5s ease-out;
                }

                .farmlink-brand-mark {
                    width: 68px;
                    height: 68px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 20px;
                    background: linear-gradient(
                        135deg,
                        #198754,
                        #157347
                    );
                    color: #fff;
                    box-shadow:
                        0 12px 28px rgba(25, 135, 84, 0.2);
                }

                .farmlink-benefit-icon {
                    width: 44px;
                    height: 44px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 14px;
                    border-radius: 50%;
                    background: rgba(25, 135, 84, 0.1);
                    color: #198754;
                }

                .farmlink-register-card {
                    border-radius: 24px;
                    box-shadow:
                        0 20px 55px rgba(0, 0, 0, 0.1);
                    animation: farmlinkRegisterFadeUp 0.5s ease-out;
                }

                .farmlink-register-header {
                    padding: 32px 24px;
                    background: linear-gradient(
                        135deg,
                        #198754,
                        #157347
                    );
                }

                .farmlink-header-icon {
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.14);
                }

                .farmlink-input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .farmlink-input-icon {
                    position: absolute;
                    left: 14px;
                    z-index: 2;
                    color: #6c757d;
                    pointer-events: none;
                }

                .farmlink-input {
                    min-height: 48px;
                    padding-left: 46px;
                    padding-right: 46px;
                    border: 1px solid #dee2e6;
                    border-radius: 12px !important;
                    background: #f8f9fa;
                    box-shadow: none !important;
                }

                .farmlink-input:focus {
                    border-color: #198754;
                    background: #fff;
                }

                .farmlink-password-toggle {
                    position: absolute;
                    right: 8px;
                    width: 38px;
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 9px;
                    background: transparent;
                    color: #6c757d;
                    cursor: pointer;
                }

                .farmlink-password-toggle:hover {
                    background: rgba(25, 135, 84, 0.08);
                    color: #198754;
                }

                .farmlink-role-card {
                    min-height: 112px;
                    padding: 15px;
                    border: 1px solid #dee2e6;
                    border-radius: 14px;
                    background: #f8f9fa;
                    transition:
                        border-color 0.2s ease,
                        background 0.2s ease,
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-role-card:hover {
                    border-color: #8ac7a9;
                    transform: translateY(-1px);
                }

                .farmlink-role-card.active {
                    border: 2px solid #198754;
                    background: rgba(25, 135, 84, 0.07);
                    box-shadow:
                        0 6px 16px rgba(25, 135, 84, 0.08);
                }

                .farmlink-role-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 9px;
                    border-radius: 10px;
                    background: rgba(25, 135, 84, 0.1);
                    color: #198754;
                }

                .farmlink-register-button-main {
                    min-height: 52px;
                    border: none;
                    border-radius: 12px;
                    box-shadow:
                        0 8px 18px rgba(25, 135, 84, 0.16);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-register-button-main:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow:
                        0 11px 22px rgba(25, 135, 84, 0.2);
                }

                .farmlink-login-button-outline {
                    border-radius: 12px;
                }

                .farmlink-register-footer {
                    padding: 15px 20px;
                    background: #f8f9fa;
                }

                @keyframes farmlinkRegisterFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 576px) {
                    .farmlink-register-page {
                        padding-top: 20px !important;
                        padding-bottom: 20px !important;
                    }

                    .farmlink-register-card {
                        border-radius: 18px;
                    }

                    .farmlink-register-header {
                        padding: 26px 20px;
                    }

                    .farmlink-register-card .card-body {
                        padding: 28px 20px !important;
                    }

                    .farmlink-role-card {
                        min-height: 105px;
                        padding: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Register;
