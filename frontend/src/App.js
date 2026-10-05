import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import "@/index.css";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import Wishlist from "@/pages/Wishlist";
import Journal from "@/pages/Journal";
import JournalPost from "@/pages/JournalPost";
import Certifications from "@/pages/Certifications";
import Wholesale from "@/pages/Wholesale";
import Christmas from "@/pages/Christmas";

function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-ink-900 relative">
            <div className="grain-overlay" />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <I18nProvider>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <BrowserRouter>
                            <Toaster
                                theme="dark"
                                position="bottom-right"
                                toastOptions={{
                                    style: {
                                        background: "#151413",
                                        border: "1px solid rgba(197, 160, 89, 0.3)",
                                        color: "#EAE8E3",
                                        borderRadius: 0,
                                        fontFamily: "Outfit, sans-serif",
                                        fontSize: "13px",
                                        letterSpacing: "0.02em",
                                    },
                                }}
                            />
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/shop" element={<Shop />} />
                                    <Route path="/shop/:vertical" element={<Shop />} />
                                    <Route path="/product/:slug" element={<ProductDetail />} />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/wishlist" element={<Wishlist />} />
                                    <Route path="/journal" element={<Journal />} />
                                    <Route path="/journal/:slug" element={<JournalPost />} />
                                    <Route path="/certifications" element={<Certifications />} />
                                    <Route path="/wholesale" element={<Wholesale />} />
                                    <Route path="/christmas" element={<Christmas />} />
                                    <Route path="/payment/success" element={<PaymentSuccess />} />
                                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/account" element={<Account />} />
                                    <Route path="/admin" element={<Admin />} />
                                    <Route path="*" element={<Home />} />
                                </Routes>
                            </Layout>
                        </BrowserRouter>
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </I18nProvider>
    );
}
