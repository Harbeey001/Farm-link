import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../services/paymentService';

const PaymentCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState(
        'Please wait while we confirm your payment...'
    );

    useEffect(() => {
        let ignore = false;

        const reference = searchParams.get('reference');

        if (!reference) {
            setStatus('error');
            setMessage(
                'No payment reference was found. We could not verify this payment.'
            );
            return;
        }

        const verify = async () => {
            try {
                const response = await verifyPayment(reference);

                if (ignore) return;

                if (response?.success) {
                    setStatus('success');
                    setMessage(
                        response.message ||
                        'Your payment has been verified successfully.'
                    );
                } else {
                    setStatus('error');
                    setMessage(
                        response?.message ||
                        'Payment verification failed.'
                    );
                }
            } catch (error) {
                if (ignore) return;

                console.error(
                    'Payment verification error:',
                    error
                );

                setStatus('error');
                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    'We could not verify your payment. Please try again.'
                );
            }
        };

        verify();

        return () => {
            ignore = true;
        };
    }, [searchParams]);

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
            <div
                className="card border-0 shadow-sm"
                style={{
                    maxWidth: '520px',
                    width: '100%',
                    borderRadius: '20px',
                }}
            >
                <div className="card-body text-center p-5">

                    {/* VERIFYING */}
                    {status === 'verifying' && (
                        <>
                            <div
                                className="spinner-border text-success mb-4"
                                style={{
                                    width: '4rem',
                                    height: '4rem',
                                }}
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Verifying...
                                </span>
                            </div>

                            <h2 className="fw-bold mb-3">
                                Confirming Payment
                            </h2>

                            <p className="text-muted mb-0">
                                {message}
                            </p>
                        </>
                    )}

                    {/* SUCCESS */}
                    {status === 'success' && (
                        <>
                            <div
                                className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center mx-auto mb-4"
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    fontSize: '42px',
                                }}
                            >
                                ✓
                            </div>

                            <h2 className="fw-bold text-success mb-3">
                                Payment Successful
                            </h2>

                            <p className="text-muted mb-4">
                                {message}
                            </p>

                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={() =>
                                        navigate('/buyer-dashboard')
                                    }
                                >
                                    Go to My Dashboard
                                </button>

                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        navigate('/marketplace')
                                    }
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </>
                    )}

                    {/* ERROR */}
                    {status === 'error' && (
                        <>
                            <div
                                className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center mx-auto mb-4"
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    fontSize: '42px',
                                }}
                            >
                                !
                            </div>

                            <h2 className="fw-bold text-danger mb-3">
                                Payment Verification Failed
                            </h2>

                            <p className="text-muted mb-4">
                                {message}
                            </p>

                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={() =>
                                        navigate('/buyer-dashboard')
                                    }
                                >
                                    Return to Dashboard
                                </button>

                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        navigate('/marketplace')
                                    }
                                >
                                    Back to Marketplace
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PaymentCallback;