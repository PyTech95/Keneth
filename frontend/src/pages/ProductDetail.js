import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, productImage, STATIC_BASE, formatErr } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { TID } from "@/constants/testIds";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";
import { Minus, Plus, ChevronRight, Heart, Truck, Shield, Package, Building2, X } from "lucide-react";

export default function ProductDetail() {
    const { slug } = useParams();
    const nav = useNavigate();
    const { t, tr, lang } = useI18n();
    const { add } = useCart();
    const { has, toggle } = useWishlist();
    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [related, setRelated] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [b2bOpen, setB2bOpen] = useState(false);
    const [b2bSending, setB2bSending] = useState(false);
    const [b2bForm, setB2bForm] = useState({ name: "", phone: "", quantity: "", email: "", message: "" });

    const setB2b = (k, v) => setB2bForm((f) => ({ ...f, [k]: v }));

    const submitB2b = async (e) => {
        e.preventDefault();
        if (!b2bForm.name || !b2bForm.phone || !b2bForm.quantity) return;
        setB2bSending(true);
        try {
            await api.post("/product/enquiry", {
                ...b2bForm,
                product_slug: product.slug,
                product_name: tr(product.name),
            });
            toast.success(t("b2b.success"));
            setB2bOpen(false);
            setB2bForm({ name: "", phone: "", quantity: "", email: "", message: "" });
        } catch (err) {
            toast.error(formatErr(err));
        } finally {
            setB2bSending(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        setActiveIdx(0);
        api.get(`/products/${slug}`).then(({ data }) => {
            setProduct(data);
            api.get(`/products?vertical=${data.vertical}`).then(({ data: rel }) => {
                setRelated(rel.filter((r) => r.slug !== data.slug).slice(0, 4));
            });
        }).catch(() => nav("/shop"));
    }, [slug, nav]);

    // Gallery composition: hero first, then gallery_images
    const gallery = useMemo(() => {
        if (!product) return [];
        const primary = productImage(product);
        const extras = (product.gallery_images || []).map((g) => `${STATIC_BASE}/${g}`);
        return [primary, ...extras];
    }, [product]);

    if (!product) return <div className="py-40 text-center text-bone-300 text-sm tracking-widest">{t("common.loading")}</div>;

    const badge = product.badge ? (product.badge[lang] || product.badge.en) : null;
    const saved = has(product.slug);
    const VNAME = { "masalas": "The Spice House", "artificial-jewelry": "The Jewel House", "christmas-decor": "The Christmas House", "home-furnishing": "The Fabric House" };
    const VTITLE = { "masalas": "vert.masalas.title", "artificial-jewelry": "vert.jewelry.title", "christmas-decor": "vert.christmas.title", "home-furnishing": "vert.decor.title" };
    const verticalName = VNAME[product.vertical] || "The Fabric House";
    const verticalTitle = t(VTITLE[product.vertical] || "vert.decor.title");

    return (
        <div className="pt-6 sm:pt-8 pb-16 sm:pb-24">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-6 sm:mb-10 flex-wrap">
                    <Link to="/" className="hover:text-brass-400 transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link to={`/shop/${product.vertical}`} className="hover:text-brass-400 transition-colors">
                        {verticalTitle}
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-bone-100 truncate max-w-[200px]">{tr(product.name)}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-20">
                    {/* GALLERY */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                            {/* Thumbnails (desktop side, mobile below) */}
                            {gallery.length > 1 && (
                                <div className="hidden sm:flex sm:col-span-2 flex-col gap-3 order-1">
                                    {gallery.map((src, i) => (
                                        <button
                                            key={i}
                                            data-testid={`pd-thumb-${i}`}
                                            onClick={() => setActiveIdx(i)}
                                            className={`aspect-square bg-ink-800 overflow-hidden border-2 transition-colors ${activeIdx === i ? "border-brass-400" : "border-transparent hover:border-white/30"}`}
                                        >
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {/* Main image */}
                            <div className={`relative bg-ink-800 aspect-[4/5] overflow-hidden order-2 ${gallery.length > 1 ? "sm:col-span-10" : "sm:col-span-12"}`}>
                                <img src={gallery[activeIdx]} alt={tr(product.name)} className="w-full h-full object-cover" />
                                {badge && (
                                    <span className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-ink-900/85 backdrop-blur border border-brass-400/40 text-brass-400 text-[10px] tracking-[0.24em] uppercase px-3 py-1.5">
                                        {badge}
                                    </span>
                                )}
                                <button
                                    onClick={() => toggle(product.slug)}
                                    data-testid="pd-wishlist"
                                    className={`absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center backdrop-blur border transition-colors ${
                                        saved ? "bg-brass-400 text-ink-900 border-brass-400" : "bg-ink-900/70 text-bone-100 border-white/15 hover:border-brass-400 hover:text-brass-400"
                                    }`}
                                    aria-label="Toggle wishlist"
                                >
                                    <Heart className={`w-5 h-5 ${saved ? "fill-current" : ""}`} strokeWidth={1.5} />
                                </button>
                            </div>
                            {/* Mobile thumbnails */}
                            {gallery.length > 1 && (
                                <div className="sm:hidden flex gap-3 overflow-x-auto scrollbar-hide order-3 -mx-5 px-5">
                                    {gallery.map((src, i) => (
                                        <button
                                            key={i}
                                            data-testid={`pd-thumb-m-${i}`}
                                            onClick={() => setActiveIdx(i)}
                                            className={`w-20 h-20 shrink-0 bg-ink-800 overflow-hidden border-2 transition-colors ${activeIdx === i ? "border-brass-400" : "border-transparent"}`}
                                        >
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="lg:col-span-5 lg:pt-4">
                        <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4 sm:mb-5">
                            {verticalName}
                        </p>
                        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight text-bone-100 mb-4">
                            {tr(product.name)}
                        </h1>
                        <div className="flex items-baseline gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <span className="font-serif text-3xl text-brass-400">{formatPrice(product.price_eur, lang)}</span>
                            <span className="text-xs tracking-[0.2em] uppercase text-bone-300/70">/ {product.unit}</span>
                        </div>

                        <p className="text-base text-bone-100/85 leading-relaxed mb-5 sm:mb-6 font-light">
                            {tr(product.short_description)}
                        </p>
                        <p className="text-sm sm:text-base text-bone-300 leading-relaxed mb-8 sm:mb-10 font-light">
                            {tr(product.long_description)}
                        </p>

                        {/* Quantity + Add */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="flex items-center border border-white/15">
                                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 sm:w-11 h-12 flex items-center justify-center text-bone-100/70 hover:text-brass-400 transition-colors" aria-label="Decrease">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span data-testid={TID.pdQty} className="w-10 sm:w-12 text-center text-bone-100 tabular-nums">{qty}</span>
                                <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="w-10 sm:w-11 h-12 flex items-center justify-center text-bone-100/70 hover:text-brass-400 transition-colors" aria-label="Increase">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                data-testid={TID.pdAddCart}
                                onClick={() => add(product, qty)}
                                className="flex-1 border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 py-3.5 text-[10px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase"
                            >
                                {t("prod.addCart")}
                            </button>
                        </div>
                        <button
                            data-testid={TID.pdBuyNow}
                            onClick={() => { add(product, qty); nav("/cart"); }}
                            className="w-full bg-brass-400 text-ink-900 hover:bg-brass-300 py-3.5 text-[10px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase transition-colors mb-3 sm:mb-4"
                        >
                            {t("prod.buyNow")}
                        </button>

                        {/* B2B / bulk work-order */}
                        <button
                            data-testid={TID.pdB2b}
                            onClick={() => setB2bOpen(true)}
                            className="w-full border border-white/20 text-bone-100 hover:border-brass-400 hover:text-brass-400 py-3.5 text-[10px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase transition-colors mb-8 sm:mb-10 flex items-center justify-center gap-2.5"
                        >
                            <Building2 className="w-4 h-4" strokeWidth={1.6} /> {t("b2b.button")}
                        </button>

                        {/* Trust rail */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 pb-8 sm:pb-10 border-b border-white/10">
                            <div className="text-center">
                                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-brass-400 mx-auto mb-2" strokeWidth={1.5} />
                                <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-bone-300">EU 3-5 days</p>
                            </div>
                            <div className="text-center">
                                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-brass-400 mx-auto mb-2" strokeWidth={1.5} />
                                <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-bone-300">Gift wrapped</p>
                            </div>
                            <div className="text-center">
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-brass-400 mx-auto mb-2" strokeWidth={1.5} />
                                <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-bone-300">30-day returns</p>
                            </div>
                        </div>

                        <div className="pt-6 sm:pt-8 space-y-3 text-sm text-bone-300 font-light">
                            <div className="flex justify-between"><span className="text-bone-100/60 uppercase text-[10px] tracking-[0.24em]">Format</span><span>{product.unit}</span></div>
                            <div className="flex justify-between"><span className="text-bone-100/60 uppercase text-[10px] tracking-[0.24em]">Origin</span><span>India — Handcrafted</span></div>
                            <div className="flex justify-between"><span className="text-bone-100/60 uppercase text-[10px] tracking-[0.24em]">Shipping</span><span>Complimentary above €120</span></div>
                        </div>
                    </div>
                </div>

                {/* Related */}
                {related.length > 0 && (
                    <div className="mt-20 sm:mt-32">
                        <h2 className="font-serif text-3xl sm:text-4xl text-bone-100 mb-8 sm:mb-12">{t("prod.related")}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-12">
                            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* B2B / BULK WORK-ORDER MODAL */}
            {b2bOpen && (
                <div
                    className="fixed inset-0 z-[70] bg-ink-900/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setB2bOpen(false)}
                >
                    <div
                        className="bg-ink-800 border border-white/10 w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setB2bOpen(false)}
                            className="absolute top-4 right-4 text-bone-300 hover:text-brass-400 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <p className="text-[10px] tracking-[0.32em] uppercase text-brass-400 mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" strokeWidth={1.6} /> B2B
                        </p>
                        <h3 className="font-serif text-2xl sm:text-3xl text-bone-100 leading-tight mb-2">{t("b2b.title")}</h3>
                        <p className="text-sm text-bone-300 font-light leading-relaxed mb-3">{t("b2b.sub")}</p>
                        <p className="text-xs text-brass-300 mb-6 font-light">{tr(product.name)} · {product.unit}</p>
                        <form onSubmit={submitB2b} className="space-y-4">
                            <input
                                required
                                data-testid={TID.b2bName}
                                value={b2bForm.name}
                                onChange={(e) => setB2b("name", e.target.value)}
                                placeholder={t("b2b.name")}
                                className="w-full bg-transparent border border-white/15 text-bone-100 px-4 py-3 text-sm focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/60"
                            />
                            <input
                                required
                                type="tel"
                                data-testid={TID.b2bPhone}
                                value={b2bForm.phone}
                                onChange={(e) => setB2b("phone", e.target.value)}
                                placeholder={t("b2b.phone")}
                                className="w-full bg-transparent border border-white/15 text-bone-100 px-4 py-3 text-sm focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/60"
                            />
                            <input
                                required
                                data-testid={TID.b2bQty}
                                value={b2bForm.quantity}
                                onChange={(e) => setB2b("quantity", e.target.value)}
                                placeholder={t("b2b.qty")}
                                className="w-full bg-transparent border border-white/15 text-bone-100 px-4 py-3 text-sm focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/60"
                            />
                            <input
                                type="email"
                                data-testid={TID.b2bEmail}
                                value={b2bForm.email}
                                onChange={(e) => setB2b("email", e.target.value)}
                                placeholder={t("b2b.email")}
                                className="w-full bg-transparent border border-white/15 text-bone-100 px-4 py-3 text-sm focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/60"
                            />
                            <textarea
                                rows={3}
                                data-testid={TID.b2bMessage}
                                value={b2bForm.message}
                                onChange={(e) => setB2b("message", e.target.value)}
                                placeholder={t("b2b.message")}
                                className="w-full bg-transparent border border-white/15 text-bone-100 px-4 py-3 text-sm focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/60 resize-none"
                            />
                            <button
                                type="submit"
                                data-testid={TID.b2bSubmit}
                                disabled={b2bSending}
                                className="w-full bg-brass-400 text-ink-900 hover:bg-brass-300 disabled:opacity-60 disabled:cursor-not-allowed py-3.5 text-[11px] tracking-[0.28em] uppercase transition-colors"
                            >
                                {b2bSending ? t("b2b.sending") : t("b2b.submit")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
