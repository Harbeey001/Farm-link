import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import Marketplace from './pages/Marketplace';
import ProductDetails from './pages/ProductDetails';
import PaymentCallback from './pages/PaymentCallback';
import AdminDashboard from './pages/AdminDashboard';
import Support from './pages/Support';
import Terms from './pages/Terms';
import MainLayout from './components/MainLayout';


// ==========================
// PROTECTED ROUTE
// ==========================

const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();

    // Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Wrong role
    if (role && user.role !== role) {

        if (user.role === 'farmer') {
            return <Navigate to="/farmer-dashboard" replace />;
        }

        if (user.role === 'buyer') {
            return <Navigate to="/buyer-dashboard" replace />;
        }

        if (user.role === 'admin') {
            return <Navigate to="/admin-dashboard" replace />;
        }

        return <Navigate to="/marketplace" replace />;
    }

    return children;
};


// ==========================
// APP
// ==========================

const App = () => {
    return (
        <Routes>

            {/* ==========================
                PUBLIC ROUTES
            ========================== */}

            <Route
                path="/"
                element={
                    <Navigate
                        to="/marketplace"
                        replace
                    />
                }
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />
            <Route path="/terms" element={<Terms />} />


            {/* ==========================
                MAIN FARM LINK PAGES
            ========================== */}

            <Route
                path="/marketplace"
                element={
                    <MainLayout>
                        <Marketplace />
                    </MainLayout>
                }
            />

            <Route
                path="/products/:id"
                element={
                    <MainLayout>
                        <ProductDetails />
                    </MainLayout>
                }
            />


            {/* ==========================
                SUPPORT
            ========================== */}

            <Route
                path="/support"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Support />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />


            {/* ==========================
                PAYMENT CALLBACK
            ========================== */}

            <Route
                path="/payment/callback"
                element={
                    <ProtectedRoute role="buyer">
                        <PaymentCallback />
                    </ProtectedRoute>
                }
            />


            {/* ==========================
                FARMER DASHBOARD
            ========================== */}

            <Route
                path="/farmer-dashboard"
                element={
                    <ProtectedRoute role="farmer">
                        <MainLayout>
                            <FarmerDashboard />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />


            {/* ==========================
                BUYER DASHBOARD
            ========================== */}

            <Route
                path="/buyer-dashboard"
                element={
                    <ProtectedRoute role="buyer">
                        <MainLayout>
                            <BuyerDashboard />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />


            {/* ==========================
                ADMIN DASHBOARD
            ========================== */}

            <Route
                path="/admin-dashboard"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* ADMIN USERS */}

            <Route
                path="/admin-dashboard/users"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* ADMIN PRODUCTS */}

            <Route
                path="/admin-dashboard/products"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* ADMIN REQUESTS */}

            <Route
                path="/admin-dashboard/requests"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* ADMIN ACCESS */}

            <Route
                path="/admin-dashboard/access"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* PLATFORM STATUS */}

            <Route
                path="/admin-dashboard/system"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-dashboard/support"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />


            {/* ==========================
                FALLBACK
            ========================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/marketplace"
                        replace
                    />
                }
            />

        </Routes>
    );
};

export default App;
