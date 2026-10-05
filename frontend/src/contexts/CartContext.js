import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);
const STORAGE_KEY = "kg_cart_v1";

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const add = useCallback((product, qty = 1) => {
        setItems((prev) => {
            const idx = prev.findIndex((i) => i.slug === product.slug);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: Math.min(50, next[idx].quantity + qty) };
                return next;
            }
            return [
                ...prev,
                {
                    slug: product.slug,
                    name: product.name?.en || product.name,
                    price: product.price_eur,
                    image: product.ai_image ? `products/${product.ai_image.replace(/^products\//,"")}` : product.image_hint,
                    quantity: qty,
                },
            ];
        });
        toast.success("Added to cart");
    }, []);

    const remove = useCallback((slug) => {
        setItems((prev) => prev.filter((i) => i.slug !== slug));
    }, []);

    const setQty = useCallback((slug, quantity) => {
        setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, quantity: Math.max(1, Math.min(50, quantity)) } : i)));
    }, []);

    const clear = useCallback(() => setItems([]), []);

    const { count, subtotal } = useMemo(() => {
        const c = items.reduce((s, i) => s + i.quantity, 0);
        const st = items.reduce((s, i) => s + i.quantity * i.price, 0);
        return { count: c, subtotal: Number(st.toFixed(2)) };
    }, [items]);

    return (
        <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
