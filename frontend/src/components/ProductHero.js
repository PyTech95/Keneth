import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { productImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { HOUSES } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export const ProductHero = ({ products }) => {
    const { t, tr, lang } = useI18n();
    const { add } = useCart();
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const slides = ["artificial-jewelry", "masalas", "home-furnishing", "christmas-decor"].map(v => products.find(p => p.vertical === v)).filter(Boolean);
    const product = slides[index % (slides.length || 1)];
    if (!product) return <section data-testid="hero-loading" className="min-h-[440px] flex items-center max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10"><div><p className="text-brass-300 mb-4">Keneth Global Inc</p><h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl">{t("hero.title")}</h1><Link to="/shop" data-testid="hero-loading-shop" className="text-brass-300 mt-8 inline-block">{t("hero.cta")}</Link></div></section>;
    const change = direction => setIndex(i => (i + direction + slides.length) % slides.length);
    return <section data-testid="product-hero" aria-roledescription="carousel" aria-label={t("hero.selection")} className="product-hero relative w-full overflow-hidden">
        <div className="hero-stage relative max-w-[1600px] mx-auto">
            <img key={product.slug} data-testid="hero-product-image" src={productImage(product)} alt={tr(product.name)} className="hero-product-image" fetchPriority="high" />
            <div className="hero-product-shade absolute inset-0 pointer-events-none" />
            <div className="relative max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <div key={`copy-${product.slug}`} className="hero-product-copy animate-fade-up">
                    <p data-testid="hero-brand" className="text-xs uppercase text-brass-300 mb-3">Keneth Global Inc · {t("hero.selection")}</p>
                    <p data-testid="hero-product-house" className="text-sm text-bone-200 mb-3">{t(HOUSES.find(h => h.key === product.vertical).label)}</p>
                    <h1 data-testid="hero-product-name" className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-4">{tr(product.name)}</h1>
                    <p data-testid="hero-product-description" className="text-sm sm:text-base text-bone-200 leading-relaxed max-w-md mb-4">{tr(product.short_description)}</p>
                    <p data-testid="hero-product-price" className="font-serif text-2xl text-brass-300 mb-5">{formatPrice(product.price_eur, lang)}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                        <Button data-testid="hero-buy-now" onClick={() => { add(product, 1); navigate("/cart"); }} className="rounded-none h-11 px-6 bg-brass-400 text-ink-900 hover:bg-brass-300">{t("prod.buyNow")}<ArrowRight /></Button>
                        <Link data-testid="hero-cta-shop" to={`/product/${product.slug}`} className="text-sm text-bone-100 hover:text-brass-300 transition-colors">{t("hero.viewProduct")}</Link>
                        <a data-testid="hero-cta-story" href="#about" className="text-xs text-brass-300 link-hairline">{t("hero.cta2")}</a>
                    </div>
                </div>
            </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 pb-5">
            <div className="flex items-center gap-3 sm:gap-5 border-t border-white/15 pt-4">
                <Button type="button" variant="outline" size="icon" data-testid="hero-previous" aria-label={t("hero.previous")} title={t("hero.previous")} onClick={() => change(-1)} className="rounded-none shrink-0 border-white/20"><ArrowLeft /></Button>
                <div className="grid grid-cols-4 gap-2 sm:gap-5 flex-1 min-w-0">
                    {slides.map((p, i) => <button type="button" key={p.slug} data-testid={`hero-select-${p.slug}`} aria-label={`${t("hero.choose")} ${tr(p.name)}`} aria-pressed={i === index}
                        onClick={() => setIndex(i)} className={`min-w-0 flex items-center gap-3 border-b-2 pb-2 text-left transition-colors ${i === index ? "border-brass-400 text-brass-300" : "border-transparent text-bone-300 hover:border-white/30"}`}>
                        <img src={productImage(p)} alt="" className="w-full sm:w-16 aspect-video object-contain bg-ink-800 shrink-0" />
                        <span className="hidden md:block text-xs leading-snug">{tr(p.name)}</span>
                    </button>)}
                </div>
                <Button type="button" variant="outline" size="icon" data-testid="hero-next" aria-label={t("hero.next")} title={t("hero.next")} onClick={() => change(1)} className="rounded-none shrink-0 border-white/20"><ArrowRight /></Button>
            </div>
        </div>
    </section>;
};