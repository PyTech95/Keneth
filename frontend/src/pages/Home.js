import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { ProductHero } from "@/components/ProductHero";
import { HomeAbout } from "@/components/HomeAbout";
import { ThreeHouses } from "@/components/ThreeHouses";
import { FeaturedJewelry } from "@/components/FeaturedJewelry";
import { ProductCarousel } from "@/components/ProductCarousel";
import CertificateSection from "@/components/CertificateSection";
import { HOUSES } from "@/lib/catalog";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
    { key: "home.testi.q1", name: "Camille Rousseau", location: "Lyon, France" },
    { key: "home.testi.q2", name: "Anders Holm", location: "Copenhagen, Denmark" },
    { key: "home.testi.q3", name: "Sofia Marchetti", location: "Milan, Italy" },
];
const SHOWCASE_ORDER = ["masalas", "artificial-jewelry", "home-furnishing", "christmas-decor"];

export default function Home() {
    const { t } = useI18n();
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setError(false);
        api.get("/products").then(({ data }) => { if (active) setProducts(data); }).catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [retry]);
    const byVertical = vertical => products.filter(p => p.vertical === vertical);
    return <div>
        <ProductHero products={products} />
        {error && <div role="alert" data-testid="home-products-error" className="max-w-[1400px] mx-auto px-5 py-6 text-sm text-bone-300">{t("catalog.error")}<button type="button" data-testid="home-products-retry" onClick={() => setRetry(n => n + 1)} className="ml-4 text-brass-300">{t("catalog.retry")}</button></div>}
        <HomeAbout productCount={products.length} />
        <ThreeHouses />
        <FeaturedJewelry products={byVertical("artificial-jewelry")} />
        {SHOWCASE_ORDER.map((key, index) => {
            const house = HOUSES.find(h => h.key === key);
            const items = byVertical(key);
            if (!items.length) return null;
            return <section key={key} data-testid={`home-category-${key}`} className="py-16 sm:py-20 lg:py-24 border-t border-white/5">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                    <div className="flex flex-wrap items-end justify-between mb-6 gap-4">
                        <div><p className="text-xs uppercase text-brass-300 mb-4">— {String(index + 3).padStart(2, "0")} · {t(`home.house.${key}`)}</p>
                            <h2 data-testid={`home-category-heading-${key}`} className="font-serif text-4xl sm:text-5xl text-bone-100 leading-none">{t(house.label)}</h2></div>
                        <Link to={house.to} data-testid={`home-category-shop-${key}`} className="text-xs uppercase text-brass-300 link-hairline">{t("home.shopAll")}</Link>
                    </div>
                    <ProductCarousel id={`home-${key}`} products={items} />
                </div>
            </section>;
        })}
        <section data-testid="home-testimonials-section" className="py-20 sm:py-24 lg:py-32 border-t border-white/5 bg-ink-800/30">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20"><p className="text-xs uppercase text-brass-300 mb-4">— {t("home.testi.eyebrow")}</p><h2 className="font-serif text-4xl sm:text-5xl text-bone-100 leading-none">{t("home.testi.title")}</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {TESTIMONIALS.map((tm, i) => <figure key={tm.key} data-testid={`testimonial-${i}`} className="border border-white/10 bg-ink-900/40 p-8 sm:p-10 flex flex-col">
                        <Quote className="w-7 h-7 text-brass-400 mb-6" strokeWidth={1.4} />
                        <div className="flex gap-1 mb-5">{[0, 1, 2, 3, 4].map(s => <Star key={s} className="w-4 h-4 text-brass-400 fill-current" />)}</div>
                        <blockquote className="font-serif italic text-xl sm:text-2xl leading-snug text-bone-100 mb-8 flex-1">“{t(tm.key)}”</blockquote>
                        <figcaption><div className="text-sm text-bone-100">{tm.name}</div><div className="text-xs uppercase text-bone-300 mt-1">{tm.location}</div></figcaption>
                    </figure>)}
                </div>
            </div>
        </section>
        <section className="py-12 sm:py-16 border-y border-white/5 bg-ink-800/40">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <p className="text-xs uppercase text-bone-300 text-center mb-8">{t("sec.press.title")}</p>
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-20 opacity-80">
                    {["Kinfolk", "MONOCLE", "Vogue Living", "CEREAL", "Elle Décor"].map(name => <span key={name} className="font-serif text-lg sm:text-2xl text-bone-100">{name}</span>)}
                </div>
            </div>
        </section>
        <section className="py-20 sm:py-24 lg:py-32">
            <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
                <p className="text-xs uppercase text-brass-300 mb-4">— The Dispatch</p><h2 className="font-serif text-4xl sm:text-5xl text-bone-100 leading-none mb-4">{t("sec.newsletter.title")}</h2>
                <p className="text-sm sm:text-base text-bone-300 font-light leading-relaxed mb-8 sm:mb-10">{t("sec.newsletter.sub")}</p>
                <form onSubmit={e => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-xl mx-auto">
                    <input data-testid="newsletter-email" type="email" aria-label={t("sec.newsletter.placeholder")} placeholder={t("sec.newsletter.placeholder")} className="min-w-0 flex-1 bg-transparent border-b border-white/20 rounded-none text-bone-100 px-2 py-3 focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/70" />
                    <button data-testid="newsletter-submit" type="submit" className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors px-6 py-3 text-xs uppercase">{t("sec.newsletter.submit")}</button>
                </form>
            </div>
        </section>
        <CertificateSection />
    </div>;
}