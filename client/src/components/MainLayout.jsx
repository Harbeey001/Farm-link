import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default MainLayout;