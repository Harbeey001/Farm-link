import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Leaf,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sprout,
    UserRoundCheck,
    Wheat,
} from 'lucide-react';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
        setError('Please enter your email and password.');
        return;
    }

    setLoading(true);
    setError('');

    try {
        const response = await loginUser({
            email,
            password,
        });

        const loggedInUser =
            response?.user ||
            response?.data?.user;

        const token =
            response?.token ||
            response?.data?.token;

        if (!loggedInUser || !loggedInUser.role || !token) {
            throw new Error('Invalid login response from server.');
        }

        login(loggedInUser, token);

        switch (loggedInUser.role) {
            case 'farmer':
                navigate('/farmer-dashboard');
                break;

            case 'buyer':
                navigate('/buyer-dashboard');
                break;

            case 'admin':
                navigate('/admin-dashboard');
                break;

            default:
                navigate('/marketplace');
        }
    } catch (err) {
        console.error('Login error:', err);

        setError(
            err.response?.data?.message ||
            err.message ||
            'Login failed. Please check your email and password.'
        );
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="farmlink-login-page min-vh-100 d-flex align-items-center py-4 py-lg-5">
            <div className="container">
                <div className="row justify-content-center align-items-center g-4 g-lg-5">

                    {/* Introduction */}
                    <div className="col-lg-5 d-none d-lg-block">
                        <div className="farmlink-login-intro pe-lg-4">

                            <div className="farmlink-brand-mark mb-4">
                                <Leaf size={30} strokeWidth={2.2} />
                            </div>

                            <div className="small fw-semibold text-success text-uppercase mb-2">
                                Welcome to FarmLink
                            </div>

                            <h1 className="display-5 fw-bold text-dark mb-3">
                                Connecting farms to{' '}
                                <span className="text-success">
                                    opportunities.
                                </span>
                            </h1>

                            <p className="lead text-muted mb-4">
                                Buy fresh produce directly from farmers,
                                manage your farm products, and experience a
                                simpler agricultural marketplace.
                            </p>

                            <div className="farmlink-benefit-list">

                                <div className="d-flex align-items-center mb-3">
                                    <div className="farmlink-benefit-icon">
                                        <Sprout size={19} />
                                    </div>

                                    <div>
                                        <div className="fw-semibold text-dark">
                                            Fresh farm produce
                                        </div>
                                        <small className="text-muted">
                                            Discover products directly from farmers.
                                        </small>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center mb-3">
                                    <div className="farmlink-benefit-icon">
                                        <UserRoundCheck size={19} />
                                    </div>

                                    <div>
                                        <div className="fw-semibold text-dark">
                                            Direct farmer connections
                                        </div>
                                        <small className="text-muted">
                                            Communicate and transact with confidence.
                                        </small>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center">
                                    <div className="farmlink-benefit-icon">
                                        <ShieldCheck size={19} />
                                    </div>

                                    <div>
                                        <div className="fw-semibold text-dark">
                                            Secure marketplace experience
                                        </div>
                                        <small className="text-muted">
                                            Requests, payments and orders in one place.
                                        </small>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="col-sm-10 col-md-8 col-lg-5">

                        <div className="card farmlink-login-card border-0 overflow-hidden">

                            {/* Card Header */}
                            <div className="farmlink-login-header text-white text-center">

                                <div className="farmlink-header-icon mx-auto mb-3">
                                    <Wheat size={28} strokeWidth={2} />
                                </div>

                                <h2 className="fw-bold mb-1">
                                    Welcome Back
                                </h2>

                                <p className="mb-0 opacity-75">
                                    Sign in to continue to FarmLink
                                </p>
                            </div>

                            {/* Form */}
                            <div className="card-body p-4 p-md-5">

                                {error && (
                                    <div
                                        className="alert alert-danger border-0 rounded-3 d-flex align-items-start mb-4"
                                        role="alert"
                                    >
                                        <span className="me-2 mt-1">⚠</span>
                                        <div className="small">
                                            {error}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>

                                    {/* Email */}
                                    <div className="mb-4">
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
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label
                                                htmlFor="password"
                                                className="form-label fw-semibold mb-0"
                                            >
                                                Password
                                            </label>
                                        </div>

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
                                                className="form-control farmlink-input farmlink-password-input"
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
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
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        className="btn btn-success farmlink-login-button w-100 py-3 fw-semibold"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                />
                                                Signing you in...
                                            </>
                                        ) : (
                                            <>
                                                Login to FarmLink
                                                <ArrowRight
                                                    size={18}
                                                    className="ms-2"
                                                />
                                            </>
                                        )}
                                    </button>

                                </form>

                                {/* Divider */}
                                <div className="d-flex align-items-center my-4">
                                    <div className="flex-grow-1 border-top" />

                                    <span className="px-3 text-muted small">
                                        OR
                                    </span>

                                    <div className="flex-grow-1 border-top" />
                                </div>

                                {/* Register */}
                                <div className="text-center">
                                    <p className="text-muted mb-3">
                                        Don't have a FarmLink account?
                                    </p>

                                    <button
                                        type="button"
                                        className="btn btn-outline-success farmlink-register-button px-4 py-2 fw-semibold"
                                        onClick={() =>
                                            navigate('/register')
                                        }
                                    >
                                        Create an Account
                                        <ArrowRight
                                            size={17}
                                            className="ms-2"
                                        />
                                    </button>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="farmlink-login-footer text-center">
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
                .farmlink-login-page {
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

                .farmlink-login-intro {
                    animation: farmlinkFadeUp 0.5s ease-out;
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

                .farmlink-login-card {
                    border-radius: 24px;
                    box-shadow:
                        0 20px 55px rgba(0, 0, 0, 0.1);
                    animation: farmlinkFadeUp 0.5s ease-out;
                }

                .farmlink-login-header {
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

                .farmlink-password-input {
                    padding-right: 48px;
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

                .farmlink-login-button {
                    min-height: 52px;
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 8px 18px rgba(25, 135, 84, 0.16);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-login-button:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 11px 22px rgba(25, 135, 84, 0.2);
                }

                .farmlink-register-button {
                    border-radius: 12px;
                }

                .farmlink-login-footer {
                    padding: 15px 20px;
                    background: #f8f9fa;
                }

                @keyframes farmlinkFadeUp {
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
                    .farmlink-login-page {
                        padding-top: 20px !important;
                        padding-bottom: 20px !important;
                    }

                    .farmlink-login-card {
                        border-radius: 18px;
                    }

                    .farmlink-login-header {
                        padding: 26px 20px;
                    }

                    .farmlink-login-card .card-body {
                        padding: 28px 22px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
