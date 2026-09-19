import { Link } from 'react-router-dom';
import {
    ArrowUpRight,
    ChevronRight,
    Sprout,
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="farmlink-footer mt-5">

            {/* ==========================
                MAIN FOOTER
            ========================== */}

            <div className="container py-5">

                <div className="row g-5">

                    {/* ==========================
                        BRAND
                    ========================== */}

                    <div className="col-12 col-lg-5">

                        <Link
                            to="/marketplace"
                            className="farmlink-footer-brand text-decoration-none"
                        >
                            <div className="farmlink-footer-logo">
                                <Sprout
                                    size={23}
                                    strokeWidth={2.2}
                                />
                            </div>

                            <div className="lh-sm">
                                <div className="fw-bold text-white fs-5">
                                    Farm
                                    <span className="text-success">
                                        Link
                                    </span>
                                </div>

                                <small className="farmlink-footer-tagline">
                                    Connecting farmers & buyers
                                </small>
                            </div>
                        </Link>

                        <p className="farmlink-footer-description">
                            A simple agricultural marketplace that
                            connects farmers directly with buyers,
                            making farm products easier to discover,
                            request, and purchase.
                        </p>

                        <Link
                            to="/marketplace"
                            className="farmlink-footer-marketplace-link"
                        >
                            Explore the marketplace
                            <ArrowUpRight size={15} />
                        </Link>

                    </div>


                    {/* ==========================
                        MARKETPLACE
                    ========================== */}

                    <div className="col-6 col-md-4 col-lg-2">

                        <h6 className="farmlink-footer-heading">
                            Marketplace
                        </h6>

                        <div className="farmlink-footer-links">

                            <Link to="/marketplace">
                                <ChevronRight size={14} />
                                Browse Products
                            </Link>

                            <Link to="/marketplace">
                                <ChevronRight size={14} />
                                Find Products
                            </Link>

                        </div>

                    </div>


                    {/* ==========================
                        ACCOUNT
                    ========================== */}

                    <div className="col-6 col-md-4 col-lg-2">

                        <h6 className="farmlink-footer-heading">
                            Account
                        </h6>

                        <div className="farmlink-footer-links">

                            <Link to="/buyer-dashboard">
                                <ChevronRight size={14} />
                                Buyer Dashboard
                            </Link>

                            <Link to="/farmer-dashboard">
                                <ChevronRight size={14} />
                                Farmer Dashboard
                            </Link>

                            <Link to="/login">
                                <ChevronRight size={14} />
                                Login
                            </Link>

                        </div>

                    </div>


                    {/* ==========================
                        GET STARTED
                    ========================== */}

                    <div className="col-12 col-md-4 col-lg-3">

                        <h6 className="farmlink-footer-heading">
                            Get started
                        </h6>

                        <p className="farmlink-footer-description small">
                            Join FarmLink as a farmer or buyer and
                            become part of a simpler agricultural
                            marketplace.
                        </p>

                        <Link
                            to="/register"
                            className="farmlink-footer-cta"
                        >
                            Create an account
                            <ArrowUpRight size={16} />
                        </Link>

                    </div>

                </div>

            </div>


            {/* ==========================
                BOTTOM BAR
            ========================== */}

            <div className="farmlink-footer-bottom">

                <div className="container">

                    <div className="farmlink-footer-bottom-inner">

                        <small>
                            © {currentYear} FarmLink.
                            All rights reserved.
                        </small>

                        <small>
                            Built for farmers and buyers.
                        </small>

                    </div>

                </div>

            </div>


            {/* ==========================
                FOOTER STYLES
            ========================== */}

            <style>{`
                .farmlink-footer {
                    background:
                        linear-gradient(
                            135deg,
                            #101816 0%,
                            #17221f 100%
                        );
                    color: #fff;
                }

                .farmlink-footer-brand {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                }

                .farmlink-footer-logo {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background:
                        linear-gradient(
                            135deg,
                            #198754,
                            #157347
                        );
                    color: #fff;
                    box-shadow:
                        0 7px 18px rgba(25, 135, 84, 0.2);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-footer-brand:hover
                    .farmlink-footer-logo {
                    transform: translateY(-1px);
                    box-shadow:
                        0 9px 22px rgba(25, 135, 84, 0.28);
                }

                .farmlink-footer-tagline {
                    color: #8b9994;
                    font-size: 11px;
                }

                .farmlink-footer-description {
                    max-width: 450px;
                    margin-top: 18px;
                    margin-bottom: 0;
                    color: #9ca9a5;
                    font-size: 14px;
                    line-height: 1.75;
                }

                .farmlink-footer-marketplace-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 17px;
                    color: #75c99d;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    transition:
                        color 0.2s ease,
                        transform 0.2s ease;
                }

                .farmlink-footer-marketplace-link:hover {
                    color: #a3e1bf;
                    transform: translateX(2px);
                }

                .farmlink-footer-heading {
                    margin-bottom: 17px;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 700;
                }

                .farmlink-footer-links {
                    display: flex;
                    flex-direction: column;
                    gap: 11px;
                }

                .farmlink-footer-links a {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    width: fit-content;
                    color: #9ca9a5;
                    text-decoration: none;
                    font-size: 13px;
                    transition:
                        color 0.2s ease,
                        transform 0.2s ease;
                }

                .farmlink-footer-links a svg {
                    opacity: 0;
                    transition:
                        opacity 0.2s ease,
                        transform 0.2s ease;
                }

                .farmlink-footer-links a:hover {
                    color: #75c99d;
                    transform: translateX(2px);
                }

                .farmlink-footer-links a:hover svg {
                    opacity: 1;
                    transform: translateX(2px);
                }

                .farmlink-footer-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 15px;
                    padding: 10px 15px;
                    border-radius: 10px;
                    background: #198754;
                    color: #fff;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow:
                        0 6px 16px rgba(25, 135, 84, 0.18);
                    transition:
                        background 0.2s ease,
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .farmlink-footer-cta:hover {
                    color: #fff;
                    background: #157347;
                    transform: translateY(-1px);
                    box-shadow:
                        0 8px 20px rgba(25, 135, 84, 0.25);
                }

                .farmlink-footer-bottom {
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .farmlink-footer-bottom-inner {
                    min-height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                }

                .farmlink-footer-bottom-inner small {
                    color: #71807b;
                    font-size: 12px;
                }

                @media (max-width: 767px) {
                    .farmlink-footer-bottom-inner {
                        flex-direction: column;
                        justify-content: center;
                        padding: 15px 0;
                        text-align: center;
                    }
                }

                @media (max-width: 575px) {
                    .farmlink-footer {
                        margin-top: 3rem !important;
                    }

                    .farmlink-footer-description {
                        font-size: 13px;
                    }
                }
            `}</style>

        </footer>
    );
};

export default Footer;
