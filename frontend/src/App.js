import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { NewsletterPopup } from "./components/NewsletterPopup";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import AboutPage from "./pages/AboutPage";
import ReviewsPage from "./pages/ReviewsPage";
import AdminPage from "./pages/AdminPage";
import AccountPage from "./pages/AccountPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";
import TrackPage from "./pages/TrackPage";

function App() {
  return (
    <div className="App dark min-h-screen text-foreground">
      <BrowserRouter>
        <CartProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/order/:orderNumber" element={<OrderDetailPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/track" element={<TrackPage />} />
          </Routes>
          <Footer />
          <CartDrawer />
          <NewsletterPopup />
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(10,10,10,0.95)",
                border: "1px solid rgba(0,229,255,0.3)",
                color: "#fff",
                backdropFilter: "blur(20px)",
              },
            }}
          />
        </CartProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
