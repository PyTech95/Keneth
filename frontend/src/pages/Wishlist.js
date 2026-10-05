import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { useWishlist } from "@/contexts/WishlistContext";
import ProductCard from "@/components/ProductCard";
import { Heart } from "lucide-react";

export default function Wishlist() {
    const { t } = useI18n();
    const { slugs } = useWishlist();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slugs.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get("/products?limit=200").then(({ data }) => {
            setProducts(data.filter((p) => slugs.includes(p.slug)));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [slugs]);

    return (
        <div className="pt-12 pb-20 min-h-[70vh]">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— Saved</p>
                <h1 className="font-serif text-5xl sm:text-6xl text-bone-100 tracking-tight leading-none mb-4">Your wishlist</h1>
                <p className="text-bone-300 font-light mb-14">A private curation of pieces you'd like to return to.</p>

                {loading ? (
                    <div className="py-24 text-center text-bone-300 text-sm tracking-widest uppercase">{t("common.loading")}</div>
                ) : products.length === 0 ? (
                    <div className="py-16 sm:py-24 text-center border border-white/10 flex flex-col items-center gap-6">
                        <Heart className="w-10 h-10 text-brass-400/60" strokeWidth={1.2} />
                        <p className="text-bone-300 font-light max-w-md">
                            Your wishlist is quiet. Tap the heart on any product to save it here.
                        </p>
                        <Link
                            to="/shop"
                            className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-3.5 text-[11px] tracking-[0.28em] uppercase"
                        >
                            Browse the shop
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-14">
                        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
