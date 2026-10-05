import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const WishlistContext = createContext(null);
const STORAGE_KEY = "kg_wishlist_v1";

export function WishlistProvider({ children }) {
    const { user } = useAuth();
    const [slugs, setSlugs] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    }, [slugs]);

    // On login: sync local slugs to server, then refresh from server
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const localSlugs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
                if (localSlugs.length > 0) {
                    await api.post("/wishlist/sync", { slugs: localSlugs });
                }
                const { data } = await api.get("/wishlist");
                setSlugs(data.map((p) => p.slug));
            } catch (e) {
                // ignore
            }
        })();
    }, [user]);

    const has = useCallback((slug) => slugs.includes(slug), [slugs]);

    const toggle = useCallback(async (slug) => {
        const isIn = slugs.includes(slug);
        setSlugs((prev) => (isIn ? prev.filter((s) => s !== slug) : [...prev, slug]));
        if (user) {
            try {
                if (isIn) await api.delete(`/wishlist/${slug}`);
                else await api.post("/wishlist", { slug });
            } catch (e) { /* fallthrough */ }
        }
        toast.success(isIn ? "Removed from wishlist" : "Saved to wishlist");
    }, [slugs, user]);

    const value = useMemo(() => ({ slugs, has, toggle, count: slugs.length }), [slugs, has, toggle]);
    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
    return ctx;
}
