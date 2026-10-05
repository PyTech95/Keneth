import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { productImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { TID } from "@/constants/testIds";
import { Plus, Heart } from "lucide-react";

export default function ProductCard({ product, testIdPrefix = "" }) {
    const { tr, lang } = useI18n();
    const { add } = useCart();
    const { has, toggle } = useWishlist();
    const badge = product.badge ? (product.badge[lang] || product.badge.en) : null;
    const saved = has(product.slug);
    const tid = value => testIdPrefix ? `${testIdPrefix}-${value}` : value;

    return (
        <div
            data-testid={tid(TID.productCard(product.slug))}
            data-vertical={product.vertical}
            data-category={product.category}
            className="group flex flex-col"
        >
            <div className="relative bg-ink-800 aspect-[4/3] overflow-hidden">
            <Link to={`/product/${product.slug}`} data-testid={tid(`product-image-link-${product.slug}`)} className="block h-full card-image-wrap">
                <img
                    src={productImage(product)}
                    alt={tr(product.name)}
                    loading="lazy"
                    data-testid={tid(`product-image-${product.slug}`)}
                    className="absolute inset-0 w-full h-full object-contain"
                />
                {badge && (
                    <span data-testid={tid(`product-badge-${product.slug}`)} className="absolute top-2 left-2 max-w-[calc(100%-3.5rem)] bg-ink-900/85 backdrop-blur border border-brass-400/40 text-brass-400 text-[9px] sm:text-[10px] uppercase px-2 py-1">
                        {badge}
                    </span>
                )}
            </Link>

                {/* Wishlist heart — always visible on mobile, hover on desktop */}
                <button
                    data-testid={tid(`wishlist-${product.slug}`)}
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggle(product.slug); }}
                    className={`absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors backdrop-blur border ${
                        saved
                            ? "bg-brass-400 text-ink-900 border-brass-400"
                            : "bg-ink-900/70 text-bone-100 border-white/15 hover:border-brass-400 hover:text-brass-400"
                    }`}
                    aria-label="Toggle wishlist"
                    aria-pressed={saved}
                >
                    <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} strokeWidth={1.5} />
                </button>

                <button
                    data-testid={tid(TID.addToCart(product.slug))}
                    type="button"
                    onClick={(e) => { e.preventDefault(); add(product, 1); }}
                    className="absolute bottom-2 right-2 bg-ink-900/90 backdrop-blur border border-white/15 hover:border-brass-400 hover:bg-brass-400 hover:text-ink-900 text-bone-100 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors duration-300"
                    aria-label="Add to cart"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="pt-4 sm:pt-5 flex flex-wrap justify-between items-start gap-2 sm:gap-4">
                <div className="min-w-0 min-h-[2.75rem]">
                    <Link to={`/product/${product.slug}`} data-testid={tid(`product-name-${product.slug}`)} className="font-serif text-base sm:text-lg leading-tight text-bone-100 hover:text-brass-400 transition-colors block line-clamp-2">
                        {tr(product.name)}
                    </Link>
                    <p data-testid={tid(`product-unit-${product.slug}`)} className="text-[10px] sm:text-xs text-bone-300/70 mt-1">
                        {product.unit}
                    </p>
                </div>
                <div data-testid={tid(`product-price-${product.slug}`)} className="font-serif text-base sm:text-lg text-brass-400 shrink-0">
                    {formatPrice(product.price_eur, lang)}
                </div>
            </div>
        </div>
    );
}
